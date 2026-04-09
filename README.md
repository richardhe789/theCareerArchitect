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

### Frontend (Next.js)
The Next.js app lives in `frontend/nextjs-app` (there is no `package.json` at the repo root), so run the dev server from that folder:
```bash
cd frontend/nextjs-app
npm install
npm run dev
```

Open the dashboard at http://localhost:3000.

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

Ensure the API is running on http://localhost:8000 so the frontend can fetch data.

## How It Works

- The backend scrapes internship data from the SimplifyJobs GitHub README via the GitHub API.
- Data is stored in a local SQLite database (`internships.db`).
- The frontend queries the backend API to render listings and trigger scrapes.
- Duplicate listings are prevented by checking unique URLs.

## Project Structure

- `backend/`: FastAPI service + scraper + SQLite utilities
- `frontend/nextjs-app/`: Next.js frontend
- `internships.db`: SQLite database (created automatically)

## Customization

SimplifyJobs is fetched via the GitHub API. If you hit rate limits, set `GITHUB_TOKEN` in your environment.

### UI Editing Guide (React + Tailwind)

The frontend is built with **Next.js + React** and styled with **Tailwind CSS** utility classes. The UI is split into small, focused components so you can edit each section without digging through one giant file.

**Where to edit UI components**

- `frontend/nextjs-app/src/app/page.tsx` — page composition and data flow
- `frontend/nextjs-app/src/components/dashboard/` — individual UI sections:
  - `Header.tsx` (title + Run Scraper button)
  - `FiltersPanel.tsx` (job title/location/score filters)
  - `ResumePanel.tsx` (upload + score buttons)
  - `ResumePreviewCard.tsx` (resume preview)
  - `JobsTable.tsx` (results table)
  - `StatusMessage.tsx` (helper/status text)

**How styling works**

UI styles are applied with Tailwind classes directly in JSX via `className`. Each class is a small rule:

```tsx
<div className="rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
  ...
</div>
```

- Colors: `bg-slate-50`, `text-slate-700`, `border-slate-200`
- Spacing: `p-4`, `px-6`, `mt-2`, `gap-4`
- Layout: `flex`, `grid`, `items-center`, `justify-between`
- Typography: `text-sm`, `font-semibold`, `uppercase`

**Quick edit workflow**

1. Open the component file you want to change.
2. Adjust the JSX structure (add/remove elements).
3. Tweak Tailwind classes to change spacing, colors, or layout.
4. Refresh the page (`npm run dev`) to see updates.

## Hosting Notes

- **Frontend**: Deploy `frontend/nextjs-app` to Vercel (set `NEXT_PUBLIC_API_BASE_URL` to your backend URL).
- **Backend**: Deploy FastAPI on Render/Fly.io/Railway for full Playwright support.

### Remote deployment checklist (Vercel)
- Use the same-origin API routes (`/api/jobs`, `/api/scrape`) — the frontend is already configured this way.
- Add `GITHUB_TOKEN` as a Vercel Environment Variable if you need higher GitHub API rate limits.
- SQLite writes on Vercel are stored in `/tmp` (ephemeral). For persistence, switch to a hosted database.
- Verify the function is live by visiting `/api/health` on your Vercel domain.

### Vercel API (lightweight)
This repo includes a Vercel-compatible API entrypoint in `api/index.py` for simple deployments.
`python-dotenv` is included to avoid missing dotenv binary errors during Vercel builds.
The root `vercel.json` declares explicit builds for the Next.js app and the Python function, and explicitly routes `/api/jobs`, `/api/scrape`, and `/api/health` to the Python handler.
`api/index.py` always exports a top-level `app` (and `handler`) so Vercel can detect the serverless function.
Note: Vercel serverless functions have limited support for Playwright. For reliable scraping, host the backend on Render/Fly.

## Troubleshooting

- If you get a Playwright error, make sure to run `python -m playwright install chromium`.
- If the frontend cannot reach the backend, check the API URL in `frontend/nextjs-app/.env.local`.
- Check backend logs for scraping errors.
- On Vercel, SQLite writes are stored in `/tmp` and are ephemeral per deployment (no persistence between runs).
