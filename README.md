# vite-plugin-srvx

A Vite plugin that integrates [srvx](https://srvx.h3.dev/) (Universal Server) with Vite's development server, similar to how `@hono/vite-dev-server` works with Hono.

## Features

- **Automatic index.html serving** - The plugin automatically serves `index.html` on the root path
- **Hot Module Replacement (HMR)** - Full HMR support for your srvx server
- **Automatic Vite client script injection** - Vite's dev client is automatically injected into HTML responses
- **Web Standard APIs** - Use Request/Response APIs that work everywhere
- **Universal** - Works with Node.js, Deno, and Bun
- **Lightning fast** - Powered by Vite's blazing fast dev server
- **Vercel Edge Functions** - Built-in support for deploying to Vercel (auto-detected!)

## Installation

```bash
npm install vite-plugin-srvx srvx vite
```

Or with pnpm:

```bash
pnpm add vite-plugin-srvx srvx vite
```

## Usage

### 1. Create an index.html file

Create an `index.html` file in your project root:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My srvx App</title>
</head>
<body>
  <h1>Hello from srvx + Vite!</h1>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

### 2. Create your srvx server

Create a `src/server.ts` file for your API routes:

```typescript
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    // The plugin automatically serves index.html on '/'
    // so you only need to handle API routes here

    if (url.pathname === '/api/hello') {
      return Response.json({
        message: 'Hello from srvx!',
        timestamp: new Date().toISOString(),
      })
    }

    return new Response('Not Found', { status: 404 })
  },
}
```

### 3. Configure Vite

Create a `vite.config.ts` file:

```typescript
import { defineConfig } from 'vite'
import srvx from 'vite-plugin-srvx'

export default defineConfig({
  plugins: [
    ...srvx({
      entry: './src/server.ts',
    }),
  ],
})
```

### 4. Run the development server

```bash
vite
```

Your srvx server will now run with Vite's dev server! Visit `http://localhost:5173` to see your app:
- `/` - Automatically serves `index.html`
- `/api/hello` - Your srvx API endpoint
- All other routes are handled by your srvx server's fetch handler

## Building for Production

The plugin uses Vite's mode system to handle client and server builds separately.

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build && vite build --mode server",
    "start": "srvx dist/server.js"
  }
}
```

Then build your app:

```bash
npm run build
```

This will:
1. Build your frontend (HTML, CSS, JS) to `dist/public` (first `vite build`)
2. Build your srvx server to `dist/server.js` (second `vite build --mode server`)

Run your production build:

```bash
npm run start
# or directly: srvx dist/server.js
```

srvx automatically serves static files from the `dist/public` directory!

## Options

### Plugin Options

```typescript
interface SrvxOptions {
  // Entry file for your srvx server (default: './src/server.ts')
  entry?: string

  // Output directory for server build (default: 'dist')
  outDir?: string

  // Server output filename (default: 'server.js')
  serverOutFile?: string

  // Target framework for deployment (e.g., 'vercel')
  // When set to 'vercel' OR when VERCEL=1 env var is set (auto-detected),
  // outputs to dist/api/index.js for Vercel Edge Functions
  framework?: 'vercel'

  // Development server options
  // Patterns to exclude from the srvx handler (will be handled by Vite instead)
  exclude?: (string | RegExp)[]

  // Whether to inject Vite's client script for HMR (default: true)
  injectClientScript?: boolean

  // Custom module loader (default: uses Vite's ssrLoadModule)
  loadModule?: (server: ViteDevServer, entry: string) => Promise<any>
}
```

> **Note:** The plugin returns an array of three plugins (dev server + client build + server build), so use the spread operator: `...srvx({})`

### Example with custom options

```typescript
import { defineConfig } from 'vite'
import srvx from 'vite-plugin-srvx'

export default defineConfig(({ mode }) => ({
  plugins: [
    ...srvx({
      entry: './src/server.ts',
      outDir: 'build',
      serverOutFile: 'app.js',
      exclude: [
        /.*\.tsx?$/,
        /.*\.css$/,
        /^\/@.+$/,
      ],
      injectClientScript: true,
    }),
  ],
}))
```

Then build with:
```bash
npm run build
# This runs: vite build && vite build --mode server
# - Client build outputs to build/public
# - Server build outputs to build/app.js
```

And run: `srvx build/app.js` (it will automatically serve static files from `build/public`)

### Using Individual Plugins (Advanced)

If you need more control, you can import the plugins separately:

```typescript
import { defineConfig } from 'vite'
import { devServer, clientBuild, srvxBuild } from 'vite-plugin-srvx'

export default defineConfig(({ mode }) => ({
  plugins: [
    devServer({ entry: './src/server.ts' }),
    clientBuild({ outDir: 'dist' }),
    srvxBuild({ entry: './src/server.ts', outDir: 'dist' }),
  ],
}))
```

## How it works

### Development Mode

The `devServer` plugin creates a Vite middleware that:

1. **Serves index.html on root** - When requesting `/`, the plugin automatically serves and transforms your `index.html` using Vite's `transformIndexHtml` (which handles script injection, etc.)
2. **Intercepts other HTTP requests** - All non-root requests are passed to your srvx server
3. **Loads your srvx server module** - Uses Vite's SSR module loader for HMR support
4. **Converts to Web Standard APIs** - Converts Node.js `IncomingMessage` → Web Standard `Request`
5. **Calls your fetch handler** - Your srvx server's `fetch` handler processes the request
6. **Converts the response** - Converts the `Response` back to Node.js `ServerResponse`
7. **Injects Vite client** - For HTML responses from your server, Vite's client script is injected for HMR

### Production Build

The plugin uses Vite's mode system with three separate plugins:

1. **Client build** (`vite build`):
   - `clientBuild` plugin is active (mode !== 'server')
   - Builds frontend to `dist/public`
   - `srvxBuild` plugin is inactive

2. **Server build** (`vite build --mode server`):
   - `srvxBuild` plugin is active (mode === 'server')
   - Sets `ssr: true` via the `config` hook
   - Builds server to `dist/server.js`
   - `clientBuild` plugin is inactive

3. **Run with srvx**:
   - `srvx dist/server.js`
   - srvx automatically serves static files from `dist/public`

This approach follows the same pattern as [@hono/vite-build](https://github.com/honojs/vite-plugins/tree/main/packages/build)

This gives you the best of both worlds: srvx's universal server API and Vite's lightning-fast development experience!

## Examples

Check out the [examples](./examples) directory for full working examples:
- [examples/basic](./examples/basic) - Basic srvx + Vite setup
- [examples/vercel](./examples/vercel) - Vercel Edge Functions deployment

To run an example:

```bash
pnpm install
pnpm build
cd examples/basic  # or examples/vercel
pnpm dev
```

## Comparison with @hono/vite-dev-server

This plugin is heavily inspired by `@hono/vite-dev-server` but designed specifically for srvx:

- Similar middleware architecture
- Same HMR capabilities
- Compatible API design
- Works with any framework that uses Web Standard fetch API

## License

MIT

## Credits

Inspired by [@hono/vite-dev-server](https://github.com/honojs/vite-plugins/tree/main/packages/dev-server)
