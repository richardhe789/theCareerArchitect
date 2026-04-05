import logging
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.database import fetch_from_db, init_db, save_to_db
from backend.scraper import scrape_all_sources


logger = logging.getLogger(__name__)

app = FastAPI(title="Internship Finder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    init_db()


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/jobs")
def list_jobs(
    job_title: Optional[str] = None,
    location: Optional[str] = None,
    min_match_score: Optional[float] = None,
):
    filters = {
        "job_title": job_title,
        "location": location,
        "min_match_score": min_match_score,
    }
    df = fetch_from_db(filters)
    return df.to_dict(orient="records")


@app.post("/scrape")
async def run_scrape():
    try:
        internships = await scrape_all_sources()
        inserted_count = save_to_db(internships)
        return {
            "inserted": inserted_count,
            "total_fetched": len(internships),
        }
    except Exception as exc:
        logger.exception("Scrape failed")
        raise HTTPException(status_code=500, detail=str(exc))