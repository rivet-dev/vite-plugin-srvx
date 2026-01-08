import { defineConfig } from "vite";
import srvx from "vite-plugin-srvx";

export default defineConfig({
	plugins: [
		...srvx({
			entry: "./src/server.ts",
			framework: "vercel", // Enable Vercel Edge Functions
		}),
	],
});
