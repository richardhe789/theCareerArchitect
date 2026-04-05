# Local Internship Dashboard

A full-stack internship dashboard with a FastAPI backend and a Next.js frontend. The backend handles scraping and storage, while the frontend provides a modern UI.

## Features

- Next.js dashboard to view internship listings
- Advanced filtering by job title, location, and match score
- Direct scraping from high-signal sources like the SimplifyJobs GitHub repository
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
pip install -r requirements.txt
```

3. Install Playwright browser dependencies:
```bash
playwright install chromium
```

## Usage (FastAPI + Next.js)

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python -m playwright install chromium
uvicorn main:app --reload --port 8000
```

### Frontend (Next.js)
```bash
cd nextjs-app
npm install
npm run dev
```

Open the dashboard at http://localhost:3000 (frontend) and ensure the API is running on http://localhost:8000.

## How It Works

- The backend scrapes internship data from SimplifyJobs and company ATS APIs (Greenhouse/Lever).
- Data is stored in a local SQLite database (`internships.db`).
- The frontend queries the backend API to render listings and trigger scrapes.
- Duplicate listings are prevented by checking unique URLs.

## Project Structure

- `backend/`: FastAPI service + scraper + SQLite utilities
- `nextjs-app/`: Next.js frontend
- `internships.db`: SQLite database (created automatically)

## Customization

To add more scraping sources:
1. Modify the `scrape_simplifyjobs_internships()` function or add new scraping functions
2. Update the `run_scraper()` function to include your new scraping functions
3. Adjust the database schema in `init_db()` if needed

## Hosting Notes

- **Frontend**: Deploy `nextjs-app` to Vercel (set `NEXT_PUBLIC_API_BASE_URL` to your backend URL).
- **Backend**: Deploy FastAPI on Render/Fly.io/Railway for full Playwright support.

### Vercel API (lightweight)
This repo includes a Vercel-compatible API entrypoint in `api/main.py` for simple deployments.
The `vercel.json` uses a versioned runtime (`@vercel/python@4.6.0`) to satisfy Vercel’s runtime validation.
Note: Vercel serverless functions have limited support for Playwright. For reliable scraping, host the backend on Render/Fly.

## Troubleshooting

- If you get a Playwright error, make sure to run `python -m playwright install chromium`.
- If the frontend cannot reach the backend, check the API URL in `nextjs-app/.env.local`.
- Check backend logs for scraping errors.
