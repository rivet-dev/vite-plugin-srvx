import fs from "fs";
import type { IncomingMessage, ServerResponse } from "http";
import path from "path";
import type { Plugin, ViteDevServer } from "vite";

export interface DevServerOptions {
	entry?: string;
	exclude?: (string | RegExp)[];
	injectClientScript?: boolean;
	loadModule?: (server: ViteDevServer, entry: string) => Promise<any>;
	/**
	 * Routes that should be forwarded to the server.
	 * All other routes will serve index.html for SPA support.
	 * Set to undefined or empty array to forward all routes to server (old behavior).
	 */
	serverRoutes?: string[];
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

/**
 * Check if a URL matches a route pattern.
 * Supports wildcard (*) at the end of patterns.
 */
function matchesRoute(url: string, pattern: string): boolean {
	if (pattern.endsWith("*")) {
		const prefix = pattern.slice(0, -1);
		return url.startsWith(prefix);
	}
	return url === pattern;
}

/**
 * Check if a URL matches any of the server routes.
 */
function isServerRoute(url: string, serverRoutes: string[]): boolean {
	return serverRoutes.some((pattern) => matchesRoute(url, pattern));
}

/**
 * Serve index.html with Vite transformations applied.
 */
async function serveIndexHtml(
	server: ViteDevServer,
	req: IncomingMessage,
	res: ServerResponse,
): Promise<boolean> {
	const indexPath = path.join(server.config.root, "index.html");
	if (fs.existsSync(indexPath)) {
		const html = await server.transformIndexHtml(
			req.url!,
			fs.readFileSync(indexPath, "utf-8"),
		);
		res.statusCode = 200;
		res.setHeader("Content-Type", "text/html");
		res.setHeader("Content-Length", Buffer.byteLength(html));
		res.end(html);
		return true;
	}
	return false;
}

function createMiddleware(server: ViteDevServer, options: DevServerOptions) {
	return async (
		req: IncomingMessage,
		res: ServerResponse,
		next: () => void,
	) => {
		const config = server.config;
		const base = config.base === "/" ? "" : config.base;
		const serverRoutes = options.serverRoutes;

		// Check excluded patterns (vite assets, source files, etc) - pass to Vite
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

		// Check if file exists in public dir - pass to Vite
		if (req.url?.startsWith(base)) {
			const publicDir = config.publicDir;
			if (publicDir && fs.existsSync(publicDir)) {
				const filePath = path.join(publicDir, req.url.replace(base, ""));
				if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
					return next();
				}
			}
		}

		// If serverRoutes is defined, check if this URL should go to the server
		// If not a server route, serve index.html for SPA support
		if (serverRoutes && serverRoutes.length > 0) {
			if (!isServerRoute(req.url || "/", serverRoutes)) {
				// Not a server route - serve index.html for SPA
				if (await serveIndexHtml(server, req, res)) {
					return;
				}
				// No index.html found, fall through to next middleware
				return next();
			}
		} else {
			// No serverRoutes defined - old behavior: serve index.html for root
			if (req.url === "/" || req.url === base || req.url === `${base}/`) {
				if (await serveIndexHtml(server, req, res)) {
					return;
				}
			}
		}

		// Forward to server app
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
