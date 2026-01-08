export default {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === "/api/hello") {
			return Response.json({
				message: "Hello from srvx!",
				timestamp: new Date().toISOString(),
				powered_by: "srvx + Vite",
			});
		}

		if (url.pathname === "/api/time") {
			return Response.json({
				time: new Date().toLocaleTimeString(),
				date: new Date().toLocaleDateString(),
				unix: Date.now(),
			});
		}

		if (url.pathname === "/about") {
			return new Response(
				`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>About - srvx + Vite</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      min-height: 100vh;
    }
    h1 { font-size: 3rem; }
    a {
      color: #ffd700;
      text-decoration: none;
      font-weight: 500;
    }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>About</h1>
  <p>This is an example app demonstrating the integration of srvx with Vite.</p>
  <p>srvx is a universal server framework based on web standards, and Vite provides lightning-fast development experience.</p>
  <p><a href="/">← Back to home</a></p>
</body>
</html>`,
				{
					headers: {
						"Content-Type": "text/html",
					},
				},
			);
		}

		return new Response("Not Found", { status: 404 });
	},
};
