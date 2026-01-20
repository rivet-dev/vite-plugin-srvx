import fs from "fs";
import type { IncomingMessage, ServerResponse } from "http";
import path from "path";
import type { Plugin, ViteDevServer } from "vite";

export interface DevServerOptions {
	entry?: string;
	exclude?: (string | RegExp)[];
	/** Routes that should always be handled by the server, even if they match exclude patterns */
	serverRoutes?: (string | RegExp)[];
	injectClientScript?: boolean;
	loadModule?: (server: ViteDevServer, entry: string) => Promise<any>;
}

export const defaultOptions: Partial<DevServerOptions> = {
	entry: "./src/server.ts",
	exclude: [
		/.*\.tsx?$/,
		/.*\.ts$/,
		/.*\.jsx?$/,
		/.*\.css$/,
		/.*\.scss$/,
		/.*\.sass$/,
		/.*\.less$/,
		/.*\.styl$/,
		/.*\.png$/,
		/.*\.jpg$/,
		/.*\.jpeg$/,
		/.*\.gif$/,
		/.*\.svg$/,
		/.*\.webp$/,
		/^\/@.+$/,
		/^\/node_modules\/.*/,
		/\?import$/,
	],
	injectClientScript: true,
};

interface SrvxApp {
	fetch: (request: Request) => Response | Promise<Response>;
}

function createMiddleware(server: ViteDevServer, options: DevServerOptions) {
	return async (
		req: IncomingMessage,
		res: ServerResponse,
		next: () => void,
	) => {
		const config = server.config;
		const base = config.base === "/" ? "" : config.base;

		if (req.url === "/" || req.url === base || req.url === `${base}/`) {
			const indexPath = path.join(config.root, "index.html");
			if (fs.existsSync(indexPath)) {
				const html = await server.transformIndexHtml(
					req.url,
					fs.readFileSync(indexPath, "utf-8"),
				);
				res.statusCode = 200;
				res.setHeader("Content-Type", "text/html");
				res.setHeader("Content-Length", Buffer.byteLength(html));
				res.end(html);
				return;
			}
		}

		// Check if URL matches serverRoutes (these take priority over exclude patterns)
		const serverRoutes = options.serverRoutes ?? [];
		let isServerRoute = false;

		for (const pattern of serverRoutes) {
			if (req.url) {
				if (pattern instanceof RegExp) {
					if (pattern.test(req.url)) {
						isServerRoute = true;
						break;
					}
				} else if (typeof pattern === "string") {
					// Support glob-style patterns like "/api/*"
					if (pattern.endsWith("/*")) {
						const prefix = pattern.slice(0, -1); // Remove the "*"
						if (req.url.startsWith(prefix) || req.url === prefix.slice(0, -1)) {
							isServerRoute = true;
							break;
						}
					} else if (req.url.startsWith(pattern)) {
						isServerRoute = true;
						break;
					}
				}
			}
		}

		// Only check exclude patterns if this is not a server route
		if (!isServerRoute) {
			const exclude = options.exclude ?? defaultOptions.exclude ?? [];

			for (const pattern of exclude) {
				if (req.url) {
					if (pattern instanceof RegExp) {
						if (pattern.test(req.url)) {
							return next();
						}
					} else if (typeof pattern === "string") {
						if (req.url.startsWith(pattern)) {
							return next();
						}
					}
				}
			}
		}

		if (req.url?.startsWith(base)) {
			const publicDir = config.publicDir;
			if (publicDir && fs.existsSync(publicDir)) {
				const filePath = path.join(publicDir, req.url.replace(base, ""));
				if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
					return next();
				}
			}
		}

		let app: SrvxApp | undefined;

		try {
			const loadModule =
				options.loadModule ?? ((server, entry) => server.ssrLoadModule(entry));
			const module = await loadModule(server, options.entry!);

			if ("default" in module) {
				app = module.default as SrvxApp;
			} else {
				app = module as SrvxApp;
			}

			if (!app?.fetch) {
				throw new Error("No fetch handler found in the entry module");
			}
		} catch (e) {
			return next();
		}

		const protocol = (req.socket as any).encrypted ? "https" : "http";
		const host = req.headers.host || "localhost";
		const url = `${protocol}://${host}${req.url}`;

		const headers = new Headers();
		for (const [key, value] of Object.entries(req.headers)) {
			if (value !== undefined) {
				if (Array.isArray(value)) {
					for (const v of value) {
						headers.append(key, v);
					}
				} else {
					headers.set(key, value);
				}
			}
		}

		const body =
			req.method !== "GET" && req.method !== "HEAD" ? req : undefined;

		const request = new Request(url, {
			method: req.method,
			headers,
			body: body as any,
			duplex: 'half',
		} as RequestInit);

		const response = await app.fetch(request);

		res.statusCode = response.status;
		response.headers.forEach((value, key) => {
			res.setHeader(key, value);
		});

		if (options.injectClientScript !== false) {
			const contentType = response.headers.get("content-type");
			if (contentType?.includes("text/html")) {
				const body = await response.text();

				let script = `<script type="module" src="/@vite/client"></script>`;

				const nonce = response.headers.get("content-security-policy-nonce");
				if (nonce) {
					script = `<script type="module" nonce="${nonce}" src="/@vite/client"></script>`;
				}

				const injectedBody = body.replace("</head>", `${script}</head>`);

				res.setHeader("content-length", Buffer.byteLength(injectedBody));
				res.end(injectedBody);
				return;
			}
		}

		if (response.body) {
			const reader = response.body.getReader();
			const stream = async () => {
				try {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;
						res.write(value);
					}
					res.end();
				} catch (error) {
					res.end();
				}
			};
			await stream();
		} else {
			res.end();
		}
	};
}

export function devServer(options?: DevServerOptions): Plugin {
	const entry = options?.entry ?? defaultOptions.entry;

	return {
		name: "vite-plugin-srvx-dev",
		apply: "serve",
		configureServer(server) {
			const mergedOptions: DevServerOptions = {
				...defaultOptions,
				...options,
				entry,
			};

			server.middlewares.use(createMiddleware(server, mergedOptions));
		},
	};
}
