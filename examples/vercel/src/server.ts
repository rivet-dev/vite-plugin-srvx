export default {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);

		// API endpoint - returns JSON
		if (url.pathname === "/api/hello") {
			return Response.json({
				message: "Hello from Vercel Edge Functions!",
				timestamp: new Date().toISOString(),
				powered_by: "srvx + Vite + Vercel Edge",
				runtime: "edge",
			});
		}

		// Time API endpoint
		if (url.pathname === "/api/time") {
			return Response.json({
				time: new Date().toLocaleTimeString(),
				date: new Date().toLocaleDateString(),
				unix: Date.now(),
			});
		}

		// User agent endpoint
		if (url.pathname === "/api/user-agent") {
			const userAgent = request.headers.get("user-agent") || "Unknown";
			return Response.json({
				userAgent,
				headers: Object.fromEntries(request.headers.entries()),
			});
		}

		// About page - returns HTML
		if (url.pathname === "/about") {
			return new Response(
				`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>About - Vercel Edge Example</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-height: 100vh;
    }
    h1 { font-size: 3rem; margin-bottom: 1rem; }
    p { font-size: 1.2rem; line-height: 1.6; }
    a {
      color: #ffd700;
      text-decoration: none;
      font-weight: 500;
    }
    a:hover { text-decoration: underline; }
    .badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      padding: 0.5rem 1rem;
      border-radius: 1rem;
      margin: 0.25rem;
    }
  </style>
</head>
<body>
  <h1>About This Example</h1>
  <p>
    This is a demonstration of <strong>srvx</strong> (Universal Server)
    deployed as a <strong>Vercel Edge Function</strong>, with
    <strong>Vite</strong> powering the development and build process.
  </p>
  <div>
    <span class="badge">⚡ Vite</span>
    <span class="badge">🌐 srvx</span>
    <span class="badge">▲ Vercel Edge</span>
  </div>
  <p><a href="/">← Back to home</a></p>
</body>
</html>`,
				{
					headers: {
						"Content-Type": "text/html",
					},
				}
			);
		}

		// For all other routes, return 404
		return new Response("Not Found", { status: 404 });
	},
};
