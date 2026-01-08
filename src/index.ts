import { srvx } from "./srvx";

export type { BuildOptions } from "./build";
export { defaultBuildOptions, srvxBuild } from "./build";
export type { ClientBuildOptions } from "./client-build";
export { clientBuild, defaultClientBuildOptions } from "./client-build";
export type { DevServerOptions } from "./dev-server";
// Individual plugins (for advanced use cases)
export { defaultOptions, devServer } from "./dev-server";
export type { SrvxOptions } from "./srvx";
// Unified plugin (recommended)
export { defaultSrvxOptions, srvx } from "./srvx";

// Default export is the unified plugin
export default srvx;
