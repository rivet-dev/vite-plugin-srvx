import path from 'path'
import type { Plugin, UserConfig } from 'vite'

export interface ClientBuildOptions {
  outDir?: string
}

export const defaultClientBuildOptions: Required<ClientBuildOptions> = {
  outDir: 'dist',
}

export function clientBuild(options?: ClientBuildOptions): Plugin {
  const mergedOptions = { ...defaultClientBuildOptions, ...options }

  return {
    name: 'vite-plugin-srvx-client-build',

    // Only apply during client builds (not server builds)
    apply(_config, { command, mode }) {
      return command === 'build' && mode !== 'server'
    },

    config(): UserConfig {
      // Output to 'dist/public' (or custom outDir/public)
      const clientOutDir = path.join(mergedOptions.outDir, 'public')

      return {
        build: {
          outDir: clientOutDir,
        },
      }
    },
  }
}
