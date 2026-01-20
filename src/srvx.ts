import type { Plugin } from "vite";
import { srvxBuild } from "./build";
import { clientBuild } from "./client-build";
import { type DevServerOptions, devServer } from "./dev-server";

export interface SrvxOptions extends DevServerOptions {
	// Build-specific options
	outDir?: string;
	serverOutFile?: string;
	framework?: "vercel"; // Target framework for deployment
	// Client build options
	clientOutDir?: string; // Client output directory (default: "public")
	clientEmptyOutDir?: boolean; // Whether to empty the client output directory before build (default: true)
}

export const defaultSrvxOptions: Partial<SrvxOptions> = {
	entry: "./src/server.ts",
	outDir: "dist",
	clientOutDir: "public",
	serverOutFile: "server.js",
};

export function srvx(options?: SrvxOptions): Plugin[] {
	const mergedOptions = { ...defaultSrvxOptions, ...options };

	return [
		// Development server plugin
		devServer({
			entry: mergedOptions.entry,
			exclude: mergedOptions.exclude,
			injectClientScript: mergedOptions.injectClientScript,
			loadModule: mergedOptions.loadModule,
			serverRoutes: mergedOptions.serverRoutes,
		}),

		// Client build plugin
		clientBuild({
			outDir: mergedOptions.clientOutDir,
			emptyOutDir: mergedOptions.clientEmptyOutDir,
		}),

		// Server build plugin
		srvxBuild({
			entry: mergedOptions.entry,
			outDir: mergedOptions.outDir,
			serverOutFile: mergedOptions.serverOutFile,
			framework: mergedOptions.framework,
		}),
	];
}
