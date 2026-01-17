import type { Plugin, UserConfig } from "vite";

export interface ClientBuildOptions {
	outDir?: string; // Client output directory
	emptyOutDir?: boolean; // Whether to empty the output directory before build
}

export const defaultClientBuildOptions: Partial<ClientBuildOptions> = {
	outDir: "public",
	emptyOutDir: true,
};

export function clientBuild(options?: ClientBuildOptions): Plugin {
	const mergedOptions = { ...defaultClientBuildOptions, ...options };

	return {
		name: "vite-plugin-srvx-client-build",

		// Only apply during client builds (not server builds)
		apply(_config, { command, mode }) {
			return command === "build" && mode !== "server";
		},

		config(): UserConfig {
			return {
				build: {
					outDir: mergedOptions.outDir,
					emptyOutDir: mergedOptions.emptyOutDir,
				},
			};
		},
	};
}
