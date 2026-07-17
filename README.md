# TIBU — The Integrated University Buddy

> *Your campus, understood.*

**TIBU** is an AI-powered campus intelligence platform built for USIU-Africa.

---

## What TIBU Does

TIBU removes the friction between students and university information. Instead of navigating dozens of web pages, calling offices, or waiting in queues, students ask TIBU — and get accurate, sourced answers in seconds.

It combines a **RAG-powered AI chatbot** grounded in 3,000+ real USIU data sources with a suite of purpose-built tools for campus life, academic planning, and professional growth.

---

## Features

| Module | What It Does |
|---|---|
| **Ask TIBU** (AI Chat) | RAG chatbot answering anything USIU — fees, courses, offices, policies |
| **Smart Course Advisor** | Personalised course recommendations based on your major and completed courses |
| **Microcredentials Hub** | Browse 20 industry-recognised certifications (Google, IBM, AWS, Yale) with AI match |
| **Campus Navigator** | Interactive map of USIU buildings, facilities, and services |
| **Study Hub** | Past papers and study resource repository |
| **Study Group Matcher** | AI-powered matching with peers studying the same courses |
| **Opportunities** | Scholarships, internships, and student programmes |
| **Wellness Centre** | Mental health resources and crisis contacts |
| **Lost & Found** | Report and retrieve lost items on campus |

**Accessibility built-in:** Large text mode and high-contrast mode on every page.
**Persistent profiles:** Personalised onboarding — TIBU remembers your name, major, and year.
**Conversation history:** All past chats stored locally, organised by conversation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 6, Tailwind CSS v4, Framer Motion |
| Backend | Python 3.12, FastAPI, uvicorn |
| AI / Chat | Azure OpenAI GPT-4o-mini |
| Embeddings | Azure OpenAI text-embedding-ada-002 (1536 dims) |
| Vector Search | Azure AI Search — HNSW index |
| Web Crawler | Crawl4AI 0.8 + Playwright (BFS, JS rendering) |
| Data | 3,254 scraped USIU pages + 121 documents → 3,375+ knowledge sources |

---

## Knowledge Base

TIBU's knowledge base was built from scratch for this hackathon:

1. **Deep crawl** — Crawl4AI BFS-crawled all of usiu.ac.ke (3,458 pages) with JS rendering
2. **Preprocessing** — Regex pipeline stripped nav menus, footers, breadcrumbs → 48% noise reduction
3. **Chunking** — 600-char overlapping chunks for tight semantic retrieval
4. **Embeddings** — text-embedding-ada-002 via Azure OpenAI
5. **Index** — Azure AI Search HNSW vector index with hybrid search

---

## Quick Start

### Prerequisites
- Python 3.11+, Node.js 18+
- Azure account with OpenAI and AI Search resources

### Backend
```bash
cd tibu/backend
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
cp ../.env.example ../.env    # fill in Azure credentials
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd tibu/frontend
npm install
npm run dev
```

Open **http://localhost:5173** — TIBU is live.

### Ingest the knowledge base (first run only)
```powershell
# Windows PowerShell (from tibu/backend/)
.\scripts\ingest.ps1

# macOS/Linux (from tibu/backend/)
bash scripts/ingest.sh
```

---

## Project Structure

```
tibu/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── config.py            # Environment settings
│   │   ├── routers/             # 9 API route handlers
│   │   └── services/            # RAG engine, Crawl4AI scraper, document loader
│   ├── data/
│   │   ├── scraped_clean/       # 3,254 preprocessed USIU web pages
│   │   ├── documents/           # 121 USIU documents (PDF, DOCX, XLSX)
│   │   ├── pdfs/                # Academic PDFs
│   │   └── sample/              # Student Handbook
│   ├── scripts/
│   │   ├── ingest.ps1           # PowerShell ingestion pipeline
│   │   ├── ingest.sh            # Bash ingestion pipeline
│   │   ├── ingest.bat           # Windows CMD ingestion pipeline
│   │   └── fetch_excel.py       # Targeted Excel file fetcher
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/          # 12 React UI components
│   │   ├── hooks/               # useProfile, useConversations
│   │   ├── services/api.js      # API client
│   │   └── App.jsx              # App shell with routing
│   └── package.json
├── docs/                        # Architecture, setup, and pitch docs
└── .env.example
```

---

## SDG Alignment

**UN SDG 4 — Quality Education**
- *Target 4.3* — Equal access to higher education information
- *Target 4.4* — Skills for employment (Microcredentials Hub)
- *Target 4.a* — Effective, inclusive learning environments
- *Accessibility* — Large text + high-contrast for students with visual impairments

---

## Team

Built by: 
**Maxwell Gitahi**
**Ted Njeru**
**Teddy Baraka**
