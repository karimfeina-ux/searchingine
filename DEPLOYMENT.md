# Deployment Guide for LeadHunter AI

LeadHunter AI is a **full-stack desktop & web application** comprising:
- **Frontend**: React 19 + Tailwind CSS + Progressive Web App (PWA) offline cache.
- **Backend**: Node.js + Express (`server.ts`) + Autonomous Cron Scheduler (`node-cron`).
- **Database**: Embedded SQLite (`data/leadhunter.db`) for persistent lead scoring, deduplication, and verification tracking.

Because the app uses **SQLite** (a persistent local file with native bindings) and an **autonomous daily scheduler**, the deployment needs a persistent volume or container.

---

## Recommended: Cloudflare Tunnel (Free SSL, DDoS Protection & Custom Domain)

The easiest and most secure way to deploy with Cloudflare:

1. **Deploy the Node app on any server or VPS** (Hetzner, DigitalOcean, Ubuntu, or even a local mini-PC) using Docker:
   ```bash
   git clone <your-repo>
   cd <your-repo>
   docker compose up -d
   ```
2. **Install Cloudflare's Tunnel daemon (`cloudflared`)**:
   ```bash
   # On your server:
   curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i cloudflared.deb
   cloudflared tunnel login
   ```
3. **Create your tunnel and route to your custom domain**:
   ```bash
   cloudflared tunnel create leadhunter
   cloudflared tunnel route dns leadhunter yourdomain.com
   ```
4. **Point the tunnel to port 3000**:
   Create `~/.cloudflared/config.yml`:
   ```yaml
   tunnel: <TUNNEL_ID>
   credentials-file: /root/.cloudflared/<TUNNEL_ID>.json
   ingress:
     - hostname: yourdomain.com
       service: http://localhost:3000
     - service: http_status:404
   ```
5. **Run the tunnel service**:
   ```bash
   sudo cloudflared service install
   sudo systemctl start cloudflared
   ```
✅ **Result**: Your app runs at `https://yourdomain.com` with Cloudflare edge caching, SSL, WAF, and zero exposed public ports!

---

## Option 2: Render.com (Easiest Cloud Setup with Free Tier)

1. Sign up on [Render.com](https://render.com).
2. Click **New +** → **Web Service** → Connect your GitHub repo.
3. Configure the service:
   - **Environment**: `Node`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm run start`
4. Add a **Persistent Disk** (under Disks tab):
   - **Name**: `leadhunter_data`
   - **Mount Path**: `/app/data`
   - **Size**: 1 GB
5. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `3000`
   - `GEMINI_API_KEY`: *(Optional, for live Gemini queries)*
6. Click **Deploy Web Service**.
7. In Cloudflare, add a `CNAME` record pointing your domain to the Render URL with the **Orange Cloud (Proxied)** enabled.

---

## Option 3: Railway.app

1. Sign up at [Railway.app](https://railway.app).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Go to **Settings** → **Volumes** → **Add Volume** mounted to `/app/data`.
4. Railway will automatically build via `Dockerfile` or `npm run build` and launch with persistent storage.
5. In **Settings** → **Networking** → **Custom Domain**, add your domain and set DNS in Cloudflare.

---

## Option 4: Fly.io

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Run `fly launch` in your app directory.
3. Create a persistent volume for SQLite:
   ```bash
   fly volumes create leadhunter_data --size 1
   ```
4. In `fly.toml`, mount the volume:
   ```toml
   [mounts]
     source = "leadhunter_data"
     destination = "/app/data"
   ```
5. Deploy:
   ```bash
   fly deploy
   ```

---

## Environment Variables Reference

| Variable | Description | Default |
|---|---|---|
| `PORT` | Listening server port | `3000` |
| `NODE_ENV` | Environment mode | `production` |
| `GEMINI_API_KEY` | Server-side Gemini API key for live internet research | `process.env.GEMINI_API_KEY` |
| `DISABLE_HMR` | Disable hot-module reload in dev mode | `false` |
