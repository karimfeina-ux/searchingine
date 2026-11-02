# Complete Cloudflare Pages Deployment & API Keys Guide

LeadHunter AI is engineered to run seamlessly on **Cloudflare Pages** (with Edge Functions) at zero server cost.

---

## Architecture on Cloudflare Pages

- **Frontend (Client)**: Vite + React 19 SPA built into `dist/`.
- **Edge Backend (Serverless)**: Cloudflare Pages Functions located in `/functions/` handling:
  - `/api/search/google-maps`: Edge proxy for Google Maps Places API (New) Text Search
  - `/api/auth/login`: Admin session verification and authentication
  - `/api/places-search`: OpenStreetMap Overpass search fallback
- **Resilient Fallback**: `src/services/apiBridge.ts` + `src/services/clientDataEngine.ts` guarantees data persists in the user's browser `localStorage` even if backend services are offline.
- **Routing**: `public/_redirects` rewrites `/*` to `/index.html` with status 200 to prevent 404s on browser reload.

---

## Step-by-Step Deployment Instructions

### 1. Push Your Code to GitHub / GitLab

Ensure all latest commits (including `/functions`, `package.json`, `vite.config.ts`, and `.npmrc`) are pushed to your repository:
```bash
git add .
git commit -m "feat: complete Google Maps Platform integration and Cloudflare Pages edge functions"
git push origin main
```

---

### 2. Connect Project in Cloudflare Dashboard

1. Log into your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. On the left sidebar, navigate to **Compute (Workers & Pages)**.
3. Click **Create** → Select the **Pages** tab → Click **Connect to Git**.
4. Select your GitHub repository (`searchingine` or your fork).
5. Configure the build parameters:
   - **Project name**: `leadhunter-ai` (or `searchingine`)
   - **Production branch**: `main`
   - **Framework preset**: `Vite` (or `None`)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave blank)

---

### 3. Configure Environment Variables & Secrets (CRITICAL)

In Cloudflare Pages, go to **Settings** → **Environment variables** (apply to both **Production** and **Preview**):

| Variable Name | Type | Value / Description | Required? |
| :--- | :--- | :--- | :--- |
| `VITE_GOOGLE_MAPS_API_KEY` | Plaintext / Secret | Your Google Maps API key (e.g. `AIzaSy...`) | **Required** (baked into client build) |
| `GOOGLE_MAPS_API_KEY` | Secret | Same Google Maps API key (used by `/functions` edge worker) | **Required** |
| `ADMIN_EMAIL` | Plaintext | Admin login email (e.g. `admin@leadhunter.ai` or your email) | Recommended |
| `ADMIN_PASSWORD` | Secret | Your private password for logging into the admin dashboard | Recommended |
| `AUTH_SECRET` | Secret | Any random secure string (e.g. `leadhunter_super_secret_key_9988`) | Recommended |
| `GEMINI_API_KEY` | Secret | (Optional) Gemini API Key for AI synthesis | Optional |
| `NODE_VERSION` | Plaintext | `22` | Recommended |

> ⚠️ **Important Build-Time Note**:
> Because Vite embeds variables prefixed with `VITE_` during `npm run build`, you **must** configure `VITE_GOOGLE_MAPS_API_KEY` in Cloudflare Pages **before** clicking **Save and Deploy**. If you add it later, trigger a **Retry deployment** so Vite can bundle the key.

---

### 4. Configure Functions Compatibility Flag

To ensure modern Web API and Node.js features run at Cloudflare's edge:
1. In Cloudflare Pages, go to **Settings** → **Functions**.
2. Under **Compatibility flags**:
   - Ensure **Compatibility date** is `2024-09-23` or later.
   - Under **Production compatibility flags**, click **Add flag** and add `nodejs_compat`.
   - Under **Preview compatibility flags**, add `nodejs_compat`.
3. Save settings.

---

### 5. Deploy & Verify

1. Go to **Deployments** → Click **Create deployment** (or push a commit to Git).
2. The build will run:
   - Runs `npm install` (utilizing `.npmrc` with `legacy-peer-deps=true` if needed).
   - Runs `npm run build` (`vite build`).
   - Compiles `/functions` into Cloudflare Workers edge routes.
3. Once completed (~35 seconds), your application will be live at:
   `https://<your-project>.pages.dev`
4. Visit your site:
   - Log in using your configured `ADMIN_EMAIL` and `ADMIN_PASSWORD` (or default `admin@leadhunter.ai` / `admin`).
   - Click the **Google Map** tab or search for any city (e.g. "Madrid, Spain", "Barbershop", toggle "Only Without Website").
   - Click any pin on the map to verify real-time place data, Google reviews, phone number, and direct Google Maps links.

---

## Alternative: 1-Click Deployment with Wrangler CLI

If you prefer deploying from your local terminal:

```bash
# 1. Install dependencies and build locally
npm install
npm run build

# 2. Deploy dist and functions using Cloudflare Wrangler
npx wrangler pages deploy dist --project-name=leadhunter-ai
```

Wrangler will upload your `dist/` directory and mount your `/functions` automatically!

---

## Cross-Device Synchronization with Cloudflare D1 (Free Tier)

To synchronize prospects, statuses (contacted, waiting, signed, not interested), notes, exclusions, and settings between your PC and mobile phone at $0 cost:

### Step 1: Create the D1 Database
1. In the [Cloudflare Dashboard](https://dash.cloudflare.com/), go to **Storage & Databases** → **D1 SQL Database**.
2. Click **Create database**.
3. Name it: `leadhunter_db`.
4. Click **Create**.

### Step 2: Initialize Database Schema (Automated)
LeadHunter AI automatically executes `CREATE TABLE IF NOT EXISTS` on the first request to your Cloudflare Functions!
*(Optional manual execution: Open `schema.sql`, copy all text, and run it in the Cloudflare D1 Console, or run `npx wrangler d1 execute leadhunter_db --file=./schema.sql`)*

### Step 3: Bind D1 Database to Your Cloudflare Pages Project
1. In Cloudflare Dashboard, go to **Compute (Workers & Pages)** → click your Pages project (`leadhunter-ai` or `searchingine`).
2. Go to **Settings** → **Functions** → scroll down to **D1 database bindings**.
3. Click **Add binding**:
   - **Variable name**: `DB` (must be capital letters `DB`)
   - **D1 database**: Select `leadhunter_db` from the dropdown list.
4. Click **Save**.
5. Trigger a new deployment (or push a commit to Git) so Cloudflare Pages activates the `DB` binding.

### Permanent Contacted Client Guarantee:
- Whenever you mark a client as **Contacted**, **Waiting**, or **Deal Won** on your PC, it is written directly to your D1 cloud database.
- When you open `https://<your-project>.pages.dev` on your mobile phone, the phone loads the contacted clients and registers them in the Contacted tab.
- Clicking **"Clean Search Leads"** only clears the uncontacted search results—your contacted leads are permanently preserved and NEVER deleted.

