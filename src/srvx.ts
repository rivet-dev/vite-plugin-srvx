import type { Plugin } from 'vite'
import { devServer, type DevServerOptions } from './dev-server.js'
import { clientBuild } from './client-build.js'
import { srvxBuild } from './build.js'

export interface SrvxOptions extends DevServerOptions {
  // Build-specific options
  outDir?: string
  serverOutFile?: string
  framework?: 'vercel' // Target framework for deployment
}

export const defaultSrvxOptions: Partial<SrvxOptions> = {
  entry: './src/server.ts',
  outDir: 'dist',
  serverOutFile: 'server.js',
}

export function srvx(options?: SrvxOptions): Plugin[] {
  const mergedOptions = { ...defaultSrvxOptions, ...options }

  return [
    // Development server plugin
    devServer({
      entry: mergedOptions.entry,
      exclude: mergedOptions.exclude,
      injectClientScript: mergedOptions.injectClientScript,
      loadModule: mergedOptions.loadModule,
    }),

    // Client build plugin
    clientBuild({
      outDir: mergedOptions.outDir,
    }),

    // Server build plugin
    srvxBuild({
      entry: mergedOptions.entry,
      outDir: mergedOptions.outDir,
      serverOutFile: mergedOptions.serverOutFile,
      framework: mergedOptions.framework,
    }),
  ]
}
