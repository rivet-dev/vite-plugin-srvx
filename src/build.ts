import path from 'path'
import type { Plugin, UserConfig } from 'vite'

export interface BuildOptions {
  entry?: string
  outDir?: string
  serverOutFile?: string
  framework?: 'vercel' // Target framework for deployment
}

export const defaultBuildOptions: Partial<BuildOptions> = {
  entry: './src/server.ts',
  outDir: 'dist',
  serverOutFile: 'server.js',
}

export function srvxBuild(options?: BuildOptions): Plugin {
  const mergedOptions = { ...defaultBuildOptions, ...options }

  // Auto-detect Vercel or use explicit framework option
  const isVercel = mergedOptions.framework === 'vercel' || process.env.VERCEL === '1'

  return {
    name: 'vite-plugin-srvx-server-build',

    // Only apply during server builds (not client builds)
    apply(_config, { command, mode }) {
      return command === 'build' && mode === 'server'
    },

    config(): UserConfig {
      // For Vercel, output to dist/api/index.js
      // For standard builds, use configured options
      const serverOutDir = isVercel
        ? path.join(mergedOptions.outDir || 'dist', 'api')
        : (mergedOptions.outDir || 'dist')
      const serverOutFile = isVercel ? 'index.js' : (mergedOptions.serverOutFile || 'server.js')

      return {
        build: {
          ssr: true,
          outDir: serverOutDir,
          copyPublicDir: false, // Don't copy public assets during server build
          rollupOptions: {
            input: mergedOptions.entry,
            output: {
              entryFileNames: serverOutFile,
              format: 'esm',
            },
          },
          emptyOutDir: false,
        },
      }
    },

    buildEnd() {
      const serverOutDir = isVercel
        ? path.join(mergedOptions.outDir || 'dist', 'api')
        : (mergedOptions.outDir || 'dist')
      const serverOutFile = isVercel ? 'index.js' : (mergedOptions.serverOutFile || 'server.js')
      const serverPath = path.join(serverOutDir, serverOutFile)

      console.log('\n✅ Server built successfully!')
      console.log(`📦 Server output: ${serverPath}`)

      if (isVercel) {
        console.log('\n🚀 Deploy to Vercel:')
        console.log('   1. Configure vercel.json with:')
        console.log('      {')
        console.log('        "functions": {')
        console.log('          "dist/api/**": { "runtime": "edge" }')
        console.log('        }')
        console.log('      }')
        console.log('   2. Run: vercel deploy\n')
        console.log('💡 Output structure:')
        console.log('   dist/api/index.js  - Edge Function')
        console.log('   dist/public/       - Static assets')
      } else {
        console.log('\n🚀 Run your app with:')
        console.log(`   srvx ${serverPath}\n`)
        console.log('💡 Tip: srvx will automatically serve static files from dist/public/')
      }
    },
  }
}
