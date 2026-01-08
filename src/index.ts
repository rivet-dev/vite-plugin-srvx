import { srvx } from './srvx.js'

// Unified plugin (recommended)
export { srvx, defaultSrvxOptions } from './srvx.js'
export type { SrvxOptions } from './srvx.js'

// Individual plugins (for advanced use cases)
export { devServer, defaultOptions } from './dev-server.js'
export type { DevServerOptions } from './dev-server.js'
export { clientBuild, defaultClientBuildOptions } from './client-build.js'
export type { ClientBuildOptions } from './client-build.js'
export { srvxBuild, defaultBuildOptions } from './build.js'
export type { BuildOptions } from './build.js'

// Default export is the unified plugin
export default srvx
