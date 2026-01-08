# Vercel Edge Functions Example

This example demonstrates how to deploy a **srvx** server as a **Vercel Edge Function** using **vite-plugin-srvx**.

## Features

- ⚡ **Vite** for lightning-fast development
- 🌐 **srvx** Universal Server with Web Standard APIs
- ▲ **Vercel Edge Functions** for global edge deployment
- 🎨 Interactive frontend with API testing
- 🔧 Zero-config deployment setup

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Development

```bash
pnpm dev
```

Visit http://localhost:5173 to see the app in development mode.

### 3. Build

```bash
pnpm build
```

This creates:
```
dist/
├── api/
│   └── index.js       # Vercel Edge Function
└── public/            # Static assets
    ├── index.html
    └── assets/
```

### 4. Preview with Vercel CLI

```bash
pnpm preview
```

Or manually:

```bash
vercel dev
```

## Deploy to Vercel

### Option 1: Deploy via CLI

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Deploy
vercel
```

### Option 2: Deploy via GitHub

1. Push this example to a GitHub repository
2. Import the repository in [Vercel Dashboard](https://vercel.com/new)
3. Vercel will automatically detect the configuration and deploy!

## How It Works

### 1. Vite Configuration

The `vite.config.ts` enables Vercel mode:

```typescript
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
```

### 2. Vercel Configuration

The `vercel.json` tells Vercel where to find the Edge Function:

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist/public",
  "functions": {
    "dist/api/**": {
      "runtime": "edge"
    }
  }
}
```

### 3. Server Code

Your srvx server (`src/server.ts`) uses Web Standard APIs:

```typescript
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/hello") {
      return Response.json({ message: "Hello!" });
    }

    return new Response("Not Found", { status: 404 });
  },
};
```

## API Endpoints

The example includes several API endpoints:

- **`GET /api/hello`** - Returns a greeting message
- **`GET /api/time`** - Returns current time
- **`GET /api/user-agent`** - Returns user agent and headers

## Edge Function Benefits

Deploying to Vercel Edge Functions provides:

- ⚡ **Ultra-low latency** - Runs on Vercel's global edge network
- 🌍 **Global reach** - Automatically deployed to 100+ edge locations
- 📈 **Auto-scaling** - Scales automatically based on demand
- 💰 **Cost-effective** - Pay only for what you use
- 🔒 **Secure** - Runs in isolated V8 environments

## Project Structure

```
examples/vercel/
├── frontend/
│   ├── main.ts        # Frontend TypeScript
│   └── style.css      # Styles
├── src/
│   └── server.ts      # srvx server (Edge Function)
├── index.html         # Entry HTML
├── package.json       # Dependencies
├── tsconfig.json      # TypeScript config
├── vite.config.ts     # Vite + srvx config
└── vercel.json        # Vercel deployment config
```

## Environment Variables

To use environment variables in your Edge Function:

1. Add them in Vercel Dashboard → Project Settings → Environment Variables
2. Access them in your server code:

```typescript
export default {
  async fetch(request: Request) {
    const apiKey = process.env.API_KEY;
    // Use the API key...
  },
};
```

## Limitations

Vercel Edge Functions have some constraints:

- **Max Duration**: 25 seconds (must begin sending response)
- **Streaming**: Up to 300 seconds
- **Code Size**: 1 MB (Hobby), 2 MB (Pro), 4 MB (Enterprise) after gzip
- **No Node.js APIs**: Only Web Standard APIs (which srvx uses!)

## Troubleshooting

### Build fails

Make sure all dependencies are installed:
```bash
pnpm install
```

### Edge Function not found

Verify your `vercel.json` has the correct function configuration:
```json
{
  "functions": {
    "dist/api/**": {
      "runtime": "edge"
    }
  }
}
```

### Static files not loading

Check that your `outputDirectory` points to `dist/public` in `vercel.json`.

## Learn More

- [Vercel Edge Functions Documentation](https://vercel.com/docs/functions/runtimes/edge)
- [srvx Documentation](https://srvx.h3.dev/)
- [vite-plugin-srvx Documentation](../../README.md)
- [Vercel Deployment Guide](../../VERCEL.md)

## License

MIT
