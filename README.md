# Local Internship Dashboard

A full-stack internship dashboard with a FastAPI backend and a Next.js frontend. The backend handles scraping and storage, while the frontend provides a modern UI.

## Features

- Next.js dashboard to view internship listings
- Advanced filtering by job title, location, and match score
- Direct scraping from the SimplifyJobs GitHub repository (via GitHub API)
- Local SQLite database for persistent storage
- Duplicate prevention based on unique URLs
- One-click application button for each listing

## Requirements

- Python 3.8+
- Playwright browser dependencies

## Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/internship-dashboard.git
cd internship-dashboard
```

2. Install Python dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Install Playwright browser dependencies:
```bash
python -m playwright install chromium
```

## Usage (FastAPI + Next.js)

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python -m playwright install chromium
python -m uvicorn main:app --reload --port 8000
```

If you run uvicorn from the repo root instead, use:
```bash
python -m uvicorn backend.main:app --reload --port 8000
```

### Frontend (Next.js)
```bash
cd nextjs-app
npm install
npm run dev
```

Open the dashboard at http://localhost:3000 (frontend) and ensure the API is running on http://localhost:8000.

## How It Works

- The backend scrapes internship data from the SimplifyJobs GitHub README via the GitHub API.
- Data is stored in a local SQLite database (`internships.db`).
- The frontend queries the backend API to render listings and trigger scrapes.
- Duplicate listings are prevented by checking unique URLs.

## Project Structure

- `backend/`: FastAPI service + scraper + SQLite utilities
- `nextjs-app/`: Next.js frontend
- `internships.db`: SQLite database (created automatically)

## Customization

SimplifyJobs is fetched via the GitHub API. If you hit rate limits, set `GITHUB_TOKEN` in your environment.

## Hosting Notes

- **Frontend**: Deploy `nextjs-app` to Vercel (set `NEXT_PUBLIC_API_BASE_URL` to your backend URL).
- **Backend**: Deploy FastAPI on Render/Fly.io/Railway for full Playwright support.

### Vercel API (lightweight)
This repo includes a Vercel-compatible API entrypoint in `api/main.py` for simple deployments.
`python-dotenv` is included to avoid missing dotenv binary errors during Vercel builds.
The root `vercel.json` declares explicit builds for the Next.js app and the Python function.
`api/main.py` always exports a top-level `app` (and `handler`) so Vercel can detect the serverless function.
Note: Vercel serverless functions have limited support for Playwright. For reliable scraping, host the backend on Render/Fly.

## Troubleshooting

- If you get a Playwright error, make sure to run `python -m playwright install chromium`.
- If the frontend cannot reach the backend, check the API URL in `nextjs-app/.env.local`.
- Check backend logs for scraping errors.
