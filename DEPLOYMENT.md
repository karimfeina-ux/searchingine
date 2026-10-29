# Deploying LeadHunter AI Directly on Cloudflare (100% Free, Zero External Servers)

LeadHunter AI is configured to run **100% directly on Cloudflare Pages** with **no external VPS, no Docker, and no database servers required**.

Everything (Admin authentication, Deep AI Business discovery, 10+ lead verification, click & contacted tracking, and website brief generation) runs directly inside Cloudflare's global edge network and your browser with persistent storage.

---

## Method 1: Deploy via Cloudflare Dashboard (Easiest, 2 Minutes)

1. Push your repository to **GitHub** or **GitLab**.
2. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/) and log in.
3. In the left sidebar, click **Compute (Workers & Pages)** → **Create application** → **Pages** → **Connect to Git**.
4. Select your **leadhunter** repository.
5. In the Build Configuration screen, enter:
   - **Framework preset**: `Vite` (or `None`)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. Click **Save and Deploy**.

Cloudflare will build the site in ~30 seconds and give you a free, permanent HTTPS URL (e.g., `https://leadhunter-ai.pages.dev`). You can also add your custom domain with 1 click under **Custom domains**.

---

## Method 2: Deploy from your Terminal with Wrangler (1 Command)

If you have Node.js installed on your computer:

```bash
# 1. Build the production assets
npm run build

# 2. Deploy directly to Cloudflare Pages
npx wrangler pages deploy dist --project-name=leadhunter-ai
```

Wrangler will open a browser window to authenticate with your Cloudflare account and deploy your site immediately to Cloudflare Pages.

---

## What makes this app Cloudflare-Ready:

1. **Self-Healing API Bridge (`src/services/apiBridge.ts`)**: Automatically executes all business discovery, scoring, website absence verification, and tracking without needing an external Node.js server.
2. **Persistent Lead Memory (`src/services/clientDataEngine.ts`)**: Saves newly discovered leads, clicks, and contacted statuses in your browser's persistent storage so you never lose data and never repeat contacted businesses.
3. **SPA Routing Configuration (`public/_redirects`)**: Contains `/* /index.html 200` so all routes and refreshes resolve cleanly without 404s.
4. **Cloudflare Security Headers (`public/_headers`)**: Pre-configured with recommended security headers for production deployment.
5. **Wrangler Configuration (`wrangler.toml`)**: Pre-configured with project name and build output directory for 1-command deployment.
