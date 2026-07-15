# ConstructPro

Construction management system — monorepo containing frontend and backend.

## Layout

```
.
├── con-front/           # React (CRA) frontend  → deploys to Netlify
├── constructions-be/    # Node.js + Express API → deploys to Render
├── render.yaml          # Render Blueprint (backend)
└── DEPLOY.md            # Step-by-step deployment guide
```

## Local development

**Backend** (port 9000):
```powershell
cd constructions-be
npm install
node server.js
```
Needs a Postgres database. Copy `.env.example` to `.env` and fill in values.

**Frontend** (port 9001):
```powershell
cd con-front
npm install
$env:PORT = '9001'
npm start
```

## Deployment

See [DEPLOY.md](DEPLOY.md) for a step-by-step walkthrough:
- Postgres → Neon
- Backend → Render (via `render.yaml`)
- Frontend → Netlify (via `con-front/netlify.toml`)
