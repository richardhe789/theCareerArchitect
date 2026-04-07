import io
import logging
import re
from typing import Any, Iterable, Mapping, Optional

import fitz  # type: ignore[import-not-found]
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
    text_chunks: list[str] = []
    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        for page in doc:
            text_chunks.append(page.get_text("text") or "")
    return "\n".join(text_chunks)


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


def _split_sections(text: str) -> dict[str, str]:
    section_headers = {
        "skills": ["skills", "technical skills", "technologies"],
        "experience": ["experience", "work experience", "employment"],
        "education": ["education", "academic"],
        "projects": ["projects", "project experience"],
    }
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    sections: dict[str, list[str]] = {key: [] for key in section_headers}
    current_section: Optional[str] = None

    for line in lines:
        normalized = line.lower().strip(":")
        matched_section = None
        for key, headers in section_headers.items():
            if normalized in headers:
                matched_section = key
                break
        if matched_section:
            current_section = matched_section
            continue
        if current_section:
            sections[current_section].append(line)

    return {key: "\n".join(value) for key, value in sections.items() if value}


def _extract_keywords(text: str, max_keywords: int = 20) -> list[str]:
    tokens = re.findall(r"[a-zA-Z][a-zA-Z0-9+.#-]{1,}", text.lower())
    stopwords = {
        "the",
        "and",
        "for",
        "with",
        "that",
        "this",
        "from",
        "are",
        "was",
        "were",
        "you",
        "your",
        "but",
        "not",
        "have",
        "has",
        "had",
        "use",
        "using",
        "used",
        "experience",
        "project",
        "skills",
    }
    freq: dict[str, int] = {}
    for token in tokens:
        if token in stopwords:
            continue
        freq[token] = freq.get(token, 0) + 1
    sorted_tokens = sorted(freq.items(), key=lambda item: item[1], reverse=True)
    return [token for token, _ in sorted_tokens[:max_keywords]]


def _extract_date_ranges(text: str) -> list[str]:
    date_pattern = re.compile(
        r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*[–-]\s*(?:Present|Current|\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{4})",
        re.IGNORECASE,
    )
    return date_pattern.findall(text)


def _extract_experience_titles(text: str) -> list[str]:
    title_pattern = re.compile(
        r"\b(Intern|Engineer|Developer|Analyst|Researcher|Scientist|Manager|Lead|Architect)[a-zA-Z ]{0,40}",
        re.IGNORECASE,
    )
    titles = [match.strip() for match in title_pattern.findall(text)]
    return sorted(set(titles))


def _extract_companies(text: str) -> list[str]:
    company_pattern = re.compile(r"\b[A-Z][A-Za-z0-9&\.\- ]{2,}\b")
    candidates = [match.strip() for match in company_pattern.findall(text)]
    filtered = [c for c in candidates if len(c.split()) <= 4]
    return list(dict.fromkeys(filtered))[:20]


def _extract_email(text: str) -> Optional[str]:
    match = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)
    return match.group(0) if match else None


def _extract_phone(text: str) -> Optional[str]:
    match = re.search(r"(\+?\d{1,3}[\s.-]?)?(\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}", text)
    return match.group(0) if match else None


def _extract_linkedin(text: str) -> Optional[str]:
    match = re.search(r"https?://(www\.)?linkedin\.com/[\w\-./]+", text, re.IGNORECASE)
    return match.group(0) if match else None


def _extract_github(text: str) -> Optional[str]:
    match = re.search(r"https?://(www\.)?github\.com/[\w\-./]+", text, re.IGNORECASE)
    return match.group(0) if match else None


def _extract_name(text: str) -> Optional[str]:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    for line in lines[:5]:
        if len(line.split()) in {2, 3} and line.replace(" ", "").isalpha():
            return line
    return None


def _extract_courses(text: str) -> list[str]:
    courses_pattern = re.compile(r"(Relevant Coursework|Courses|Coursework)[:\s]*(.*)", re.IGNORECASE)
    courses: list[str] = []
    for line in text.splitlines():
        match = courses_pattern.search(line)
        if match:
            courses.extend([course.strip() for course in match.group(2).split(",") if course.strip()])
    return courses[:20]


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

    raw_scores = [float(score) for score in similarities]
    if raw_scores:
        min_score = min(raw_scores)
        max_score = max(raw_scores)
    else:
        min_score = 0.0
        max_score = 0.0

    scored_jobs: list[dict[str, Any]] = []
    for job, similarity in zip(jobs, raw_scores, strict=False):
        if max_score > min_score:
            normalized = (similarity - min_score) / (max_score - min_score)
        else:
            normalized = 0.0
        scored_jobs.append({**job, "match_score": round(normalized * 100, 1)})

    return sorted(scored_jobs, key=lambda item: item.get("match_score", 0.0), reverse=True)


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
    sections = _split_sections(resume_text)
    keywords = _extract_keywords(resume_text)
    date_ranges = _extract_date_ranges(resume_text)
    experience_titles = _extract_experience_titles(resume_text)
    companies = _extract_companies(resume_text)
    email = _extract_email(resume_text)
    phone = _extract_phone(resume_text)
    linkedin = _extract_linkedin(resume_text)
    github = _extract_github(resume_text)
    name = _extract_name(resume_text)
    courses = _extract_courses(resume_text)
    return {
        "name": name,
        "email": email,
        "phone": phone,
        "linkedin": linkedin,
        "github": github,
        "characters": len(resume_text),
        "preview": resume_text[:500],
        "keywords": keywords,
        "experience_titles": experience_titles,
        "companies": companies,
        "date_ranges": date_ranges,
        "education": sections.get("education", ""),
        "skills_section": sections.get("skills", ""),
        "experience_section": sections.get("experience", ""),
        "projects_section": sections.get("projects", ""),
        "courses": courses,
    }


@app.post("/jobs/score")
@app.post("/api/jobs/score")
async def score_jobs(
    file: UploadFile = File(...),
    job_title: Optional[str] = None,
    location: Optional[str] = None,
    min_match_score: Optional[float] = None,
    limit: int = 15,
):
    file_bytes = await file.read()
    resume_text = _extract_resume_text(file.filename or "", file_bytes)
    jobs = _list_jobs(job_title=job_title, location=location, min_match_score=None)
    scored_jobs = _score_jobs(resume_text, jobs)

    safe_limit = max(1, min(limit, len(scored_jobs)))
    top_jobs = scored_jobs[:safe_limit]
    return {
        "jobs": top_jobs,
        "explanation": (
            "Scores are computed as TF-IDF cosine similarity between the resume text and each job's "
            "role/company/location text. Returned list is the top scoring roles."
        ),
    }


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