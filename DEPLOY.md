# Deploying to a testing stack

- **Frontend** (con-front) → Netlify
- **Backend** (constructions-be) → Render
- **Database** → Neon (managed Postgres)

All three have free tiers. Total setup time ~30 min.

---

## Prerequisites

1. Sign up (free) at:
   - https://app.netlify.com/signup
   - https://dashboard.render.com/register
   - https://console.neon.tech/signup
2. Install Netlify CLI (optional but useful):
   ```powershell
   npm install -g netlify-cli
   ```
3. This is a **monorepo** — both `con-front/` and `constructions-be/` live in the same GitHub repo. The repo root is `Source/`. Deploy configs (`render.yaml` at root, `con-front/netlify.toml`) already point to the right subdirectories.

---

## Step 1 — Database on Neon

1. In Neon dashboard, click **Create Project**.
   - Postgres version: **16** (matches local)
   - Region: closest to Hyderabad (Asia Pacific — Singapore)
   - Name: `constructions`
2. On the project page, copy the **Connection string** (looks like `postgresql://user:pw@ep-xxx.neon.tech/constructions?sslmode=require`).
3. From your local `constructions-be` folder, run the migration:
   ```powershell
   ./scripts/migrate_db_to_neon.ps1
   ```
   Paste the Neon URL when prompted. This dumps your local `postgres` DB and restores it into Neon.
4. Verify:
   ```powershell
   & 'C:\Program Files\PostgreSQL\16\bin\psql.exe' '<neon-url>' -c "SELECT count(*) FROM packages;"
   ```
   Should print `4`.

---

## Step 2 — Backend on Render

1. In the Render dashboard, click **New → Blueprint**.
2. Connect the `construction` GitHub repo (the one you just pushed).
3. Render reads `render.yaml` at the repo root and provisions a `constructions-be` web service using `rootDir: constructions-be`.
4. In the service's **Environment** tab, fill in the values marked `sync: false` (Render doesn't sync them from the yaml):
   - `DB_HOST` = `ep-xxx.neon.tech` (host part of the Neon connection string, no `https://`)
   - `DB_USER` = `postgres` (or whatever Neon shows)
   - `DB_PASSWORD` = from Neon connection string
   - `DB_NAME` = `constructions`
   - `ALLOWED_ORIGINS` = `https://your-app.netlify.app` (fill after Step 3, then redeploy)
5. Click **Deploy latest commit**.
6. Wait ~3 min. Once green, open the service URL — you should see the Swagger docs at `/api-docs`.

Note the URL — e.g. `https://constructions-be.onrender.com`. You'll need it for the frontend.

---

## Step 3 — Frontend on Netlify

### Option A: Git-based (recommended)

1. In Netlify dashboard, click **Add new site → Import an existing project**.
2. Connect the `construction` GitHub repo.
3. **Important — Base directory**: `con-front` (Netlify UI → Site settings → Build & deploy → Base directory). Netlify will then read `con-front/netlify.toml`.
4. Under **Environment variables**, add:
   - `REACT_APP_API_URL` = `https://constructions-be.onrender.com` (from Step 2, no trailing slash)
   - `REACT_APP_ENV` = `production`
5. Click **Deploy site**. First build takes ~3 min.
6. Copy the deployed URL (e.g. `https://random-name-12345.netlify.app`).
7. Rename in Netlify **Site settings → Change site name** to something readable.

### Option B: CLI drag-drop (no Git needed)

```powershell
cd C:\Users\fs1.PartnerFoxACER\Documents\Projects\Construction\Source\con-front
$env:REACT_APP_API_URL = 'https://constructions-be.onrender.com'
$env:REACT_APP_ENV = 'production'
npm run build
netlify deploy --dir=build --prod
```

Netlify will prompt to link/create a site the first time.

---

## Step 4 — Wire CORS back

1. Go back to Render → `constructions-be` → Environment.
2. Update `ALLOWED_ORIGINS` = `https://your-actual-netlify-url.netlify.app` (comma-separate if multiple).
3. Save. Render redeploys automatically.

Netlify `deploy-preview-*` and `branch-deploy-*` subdomains are already whitelisted by the `*.netlify.app` regex in server.js — no need to add previews individually.

---

## Verifying

Open the Netlify URL in an incognito window. You should be able to:
- Load `/packages/rates` and see the four package cards with live data.
- Log in with `admin` / (whatever the local password is — this went through the migration).
- Add an item to a package and watch Cost/SFT recompute.

---

## Common gotchas

- **CORS blocked**: Render env var `ALLOWED_ORIGINS` must exactly match the Netlify URL (with `https://`, no trailing slash). Check backend logs on Render.
- **Free-tier cold start**: Render free web services spin down after 15 min idle. First request after idle takes ~30s. Upgrade to $7/mo Starter to avoid.
- **CRA env vars not picked up**: They MUST start with `REACT_APP_` and be set at build time. If you added them after the build, trigger a rebuild in Netlify (Deploys → Trigger deploy).
- **SPA 404 on refresh**: `public/_redirects` and `netlify.toml` both handle this. If still broken, check that `build/_redirects` exists after `npm run build`.
- **Neon SSL**: server.js already enables SSL for non-localhost hosts. No extra config needed.
- **Rate-card values missing**: The `v_package_cost_per_sqft` VIEW must exist in Neon. The migration script includes it if you ran `pg_dump` after we created the view.

---

## Rollback

- **Netlify**: Deploys tab → click any previous deploy → **Publish deploy**.
- **Render**: Deployment history → click previous deploy → **Redeploy**.
- **DB**: Take a fresh `pg_dump` before any risky migration; restore with `psql <neon-url> -f dump.sql`.
