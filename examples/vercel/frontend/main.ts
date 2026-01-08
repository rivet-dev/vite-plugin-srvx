import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <div class="container">
    <header>
      <h1>⚡ Vercel Edge Functions</h1>
      <p class="subtitle">Powered by srvx + Vite</p>
      <div class="badges">
        <span class="badge">⚡ Vite</span>
        <span class="badge">🌐 srvx</span>
        <span class="badge">▲ Vercel Edge</span>
      </div>
    </header>

    <section class="features">
      <h2>Try the API Endpoints</h2>
      <div class="api-grid">
        <button class="api-btn" data-endpoint="/api/hello">
          <span class="emoji">👋</span>
          <span>Hello API</span>
        </button>
        <button class="api-btn" data-endpoint="/api/time">
          <span class="emoji">⏰</span>
          <span>Time API</span>
        </button>
        <button class="api-btn" data-endpoint="/api/user-agent">
          <span class="emoji">🔍</span>
          <span>User Agent</span>
        </button>
      </div>
    </section>

    <section class="response-section">
      <h3>Response:</h3>
      <pre id="response" class="response-box">Click a button above to test an API endpoint</pre>
    </section>

    <section class="links">
      <a href="/about" class="link">About This Example →</a>
    </section>

    <footer>
      <p>Deployed on Vercel Edge Functions • Lightning fast global CDN</p>
    </footer>
  </div>
`;

// Add event listeners to API buttons
const buttons = document.querySelectorAll<HTMLButtonElement>(".api-btn");
const responseBox = document.querySelector<HTMLPreElement>("#response")!;

buttons.forEach((button) => {
	button.addEventListener("click", async () => {
		const endpoint = button.dataset.endpoint!;
		responseBox.textContent = "Loading...";
		responseBox.classList.add("loading");

		try {
			const response = await fetch(endpoint);
			const data = await response.json();
			responseBox.textContent = JSON.stringify(data, null, 2);
			responseBox.classList.remove("loading");
			responseBox.classList.add("success");
		} catch (error) {
			responseBox.textContent = `Error: ${error}`;
			responseBox.classList.remove("loading");
			responseBox.classList.add("error");
		}
	});
});
