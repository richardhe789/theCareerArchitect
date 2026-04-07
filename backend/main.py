import io
import logging
import re
from typing import Any, Iterable, Mapping, Optional

import pdfplumber  # type: ignore[import-not-found]
from docx import Document  # type: ignore[import-not-found]
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sklearn.feature_extraction.text import TfidfVectorizer  # type: ignore[import-not-found,import-untyped]
from sklearn.metrics.pairwise import cosine_similarity  # type: ignore[import-not-found,import-untyped]

try:
    from backend.database import fetch_from_db, init_db, save_to_db
    from backend.scraper import scrape_all_sources
except ModuleNotFoundError:
    import sys
    from pathlib import Path

    sys.path.append(str(Path(__file__).resolve().parents[1]))
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


def _health_payload():
    return {"status": "ok"}


@app.get("/health")
def health_check():
    return _health_payload()


@app.get("/api/health")
def api_health_check():
    return _health_payload()


def _list_jobs(
    job_title: Optional[str] = None,
    location: Optional[str] = None,
    min_match_score: Optional[float] = None,
):
    filters: Mapping[str, Any] = {
        "job_title": job_title,
        "location": location,
        "min_match_score": min_match_score,
    }
    df = fetch_from_db(filters)
    return df.to_dict(orient="records")


def _normalize_text(text: str) -> str:
    if not text:
        return ""
    cleaned = re.sub(r"[^a-zA-Z0-9\s]+", " ", text.lower())
    return re.sub(r"\s+", " ", cleaned).strip()


def _extract_text_from_pdf(file_bytes: bytes) -> str:
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        pages = [page.extract_text() or "" for page in pdf.pages]
    return "\n".join(pages)


def _extract_text_from_docx(file_bytes: bytes) -> str:
    doc = Document(io.BytesIO(file_bytes))
    return "\n".join([para.text for para in doc.paragraphs])


def _extract_resume_text(filename: str, file_bytes: bytes) -> str:
    extension = (filename or "").lower().split(".")[-1]
    if extension == "pdf":
        return _extract_text_from_pdf(file_bytes)
    if extension == "docx":
        return _extract_text_from_docx(file_bytes)
    raise HTTPException(status_code=400, detail="Unsupported resume format. Use PDF or DOCX.")


def _score_jobs(resume_text: str, jobs: Iterable[Mapping[str, Any]]) -> list[dict[str, Any]]:
    normalized_resume = _normalize_text(resume_text)
    if not normalized_resume:
        return [{**job, "match_score": 0.0} for job in jobs]

    job_texts = [
        _normalize_text(
            " ".join(
                [
                    str(job.get("role", "")),
                    str(job.get("company", "")),
                    str(job.get("location", "")),
                ]
            )
        )
        for job in jobs
    ]

    vectorizer = TfidfVectorizer(stop_words="english")
    corpus = [normalized_resume] + job_texts
    tfidf_matrix = vectorizer.fit_transform(corpus)
    similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()

    scored_jobs: list[dict[str, Any]] = []
    for job, similarity in zip(jobs, similarities, strict=False):
        scored_jobs.append({**job, "match_score": round(float(similarity) * 100, 1)})

    return scored_jobs


@app.get("/jobs")
def list_jobs(
    job_title: Optional[str] = None,
    location: Optional[str] = None,
    min_match_score: Optional[float] = None,
):
    return _list_jobs(job_title=job_title, location=location, min_match_score=min_match_score)


@app.get("/api/jobs")
def api_list_jobs(
    job_title: Optional[str] = None,
    location: Optional[str] = None,
    min_match_score: Optional[float] = None,
):
    return _list_jobs(job_title=job_title, location=location, min_match_score=min_match_score)


@app.post("/resume/parse")
@app.post("/api/resume/parse")
async def parse_resume(file: UploadFile = File(...)):
    file_bytes = await file.read()
    resume_text = _extract_resume_text(file.filename or "", file_bytes)
    return {
        "characters": len(resume_text),
        "preview": resume_text[:500],
    }


@app.post("/jobs/score")
@app.post("/api/jobs/score")
async def score_jobs(
    file: UploadFile = File(...),
    job_title: Optional[str] = None,
    location: Optional[str] = None,
    min_match_score: Optional[float] = None,
):
    file_bytes = await file.read()
    resume_text = _extract_resume_text(file.filename or "", file_bytes)
    jobs = _list_jobs(job_title=job_title, location=location, min_match_score=None)
    scored_jobs = _score_jobs(resume_text, jobs)
    if min_match_score is not None:
        scored_jobs = [
            job for job in scored_jobs if job.get("match_score", 0.0) >= float(min_match_score)
        ]
    return scored_jobs


async def _run_scrape():
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


@app.post("/scrape")
async def run_scrape():
    return await _run_scrape()


@app.post("/api/scrape")
async def api_run_scrape():
    return await _run_scrape()