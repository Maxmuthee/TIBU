# TIBU — Deployment Guide (Option A: Vercel frontend + Railway backend)

The app splits into two deploys:

- **Frontend** (React/Vite static SPA) → **Vercel**
- **Backend** (FastAPI container) → **Railway** (or Render)

All AI/data services (Azure AI Foundry chat, Azure OpenAI embeddings, Azure AI
Search, Supabase) are already cloud-hosted, so the deployed app reaches
everything it needs. The crawler and ingestion scripts are **local-only dev
tools** — they are not part of the deployed runtime.

> Never commit `.env`. Set every secret in the host's dashboard instead.

---

## 1. Backend → Railway

1. Push this repo to GitHub.
2. Railway → **New Project → Deploy from GitHub repo** → pick this repo.
3. **Settings → Root Directory:** `backend` (so it builds `backend/Dockerfile`).
4. Railway auto-detects the Dockerfile. It injects `$PORT`; the Dockerfile already binds to it.
5. **Variables** → add all of these (values from your local `.env`):

   | Variable | Notes |
   |---|---|
   | `AZURE_OPENAI_ENDPOINT` | embeddings resource (`tibu-openai-new`) |
   | `AZURE_OPENAI_API_KEY` | |
   | `AZURE_OPENAI_EMBEDDING_DEPLOYMENT` | `text-embedding-ada-002` |
   | `AZURE_OPENAI_API_VERSION` | `2024-08-01-preview` |
   | `AZURE_CHAT_ENDPOINT` | Foundry resource (`tibu-ai-foundry`) |
   | `AZURE_CHAT_API_KEY` | |
   | `AZURE_CHAT_DEPLOYMENT` | `gpt-oss-120b` |
   | `AZURE_CHAT_API_VERSION` | `2024-10-21` |
   | `AZURE_SEARCH_ENDPOINT` | `tibu-search-students` |
   | `AZURE_SEARCH_API_KEY` | |
   | `AZURE_SEARCH_INDEX_NAME` | `tibu-knowledge-base` |
   | `DATABASE_URL` | Supabase connection string |
   | `ADMIN_PASSWORD` | admin panel password |
   | `APP_ENV` | `production` |

6. Deploy. Once live, Railway gives a public URL like
   `https://tibu-backend-production.up.railway.app`.
7. Verify: open `<that-url>/health` → should return `{"status":"healthy"}`.

CORS is already open (`allow_origins=["*"]` in `app/main.py`), so the Vercel
domain works without extra config.

---

## 2. Frontend → Vercel

1. Vercel → **Add New → Project** → import the same GitHub repo.
2. **Root Directory:** `frontend` (Vercel reads `frontend/vercel.json`).
3. **Environment Variables** → add:

   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | the Railway backend URL **without** a trailing slash, e.g. `https://tibu-backend-production.up.railway.app` |

   > The frontend appends `/api` itself (`src/services/api.js`), so do **not**
   > include `/api` in `VITE_API_URL`.

4. Deploy. Vercel builds with `npm run build` and serves `dist/`.
5. Open the Vercel URL — TIBU is live.

> `VITE_API_URL` is baked in at **build time**. If you change the backend URL
> later, redeploy the frontend.

---

## 3. Smoke test

- Visit the Vercel URL, open **Ask TIBU**, ask: *"What are the admission requirements?"*
- A grounded answer with sources confirms the full chain
  (Vercel → Railway → Azure) works.

---

## Updating the knowledge base later

Re-crawl / re-ingest **locally** (not in production), pointing at the same Azure
Search index the deployed backend reads:

```powershell
# from backend/ with the venv active
python -m app.services.crawl4ai_scraper --max-pages 5000 --max-depth 5 --ingest
```

New content appears in the live app immediately — no redeploy needed, because
the backend reads the index at query time.
