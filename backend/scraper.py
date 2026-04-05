import logging
from datetime import datetime

import requests
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright


logger = logging.getLogger(__name__)


SIMPLIFYJOBS_URL = "https://github.com/SimplifyJobs/Summer2026-Internships"


def normalize_location(location_text: str) -> str:
    if not location_text:
        return "Remote/Various"
    return location_text.strip()


def role_is_internship(title: str) -> bool:
    if not title:
        return False
    title_lower = title.lower()
    return "intern" in title_lower or "internship" in title_lower


def score_from_source(source: str) -> float:
    return 90.0 if source == "ATS" else 95.0


async def scrape_simplifyjobs_internships():
    internships = []
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto(SIMPLIFYJOBS_URL, timeout=30000)
            await page.wait_for_selector("article.Box-row", timeout=10000)

            content = await page.content()
            soup = BeautifulSoup(content, "html.parser")
            entries = soup.find_all("article", class_="Box-row")

            for entry in entries:
                try:
                    company_elem = entry.find("h1", class_="h3")
                    if not company_elem:
                        continue
                    company = company_elem.get_text(strip=True)

                    body_elem = entry.find("div", class_="Box-body")
                    if not body_elem:
                        continue

                    role = ""
                    location = ""
                    url = ""

                    text_parts = body_elem.get_text(separator="|", strip=True).split("|")
                    for part in text_parts:
                        part_lower = part.lower()
                        if "role:" in part_lower or "position:" in part_lower:
                            role = part.replace("Role:", "").replace("Position:", "").strip()
                        elif "location:" in part_lower:
                            location = part.replace("Location:", "").strip()
                        elif "http" in part_lower:
                            link_elem = entry.find("a", href=True)
                            if link_elem:
                                href = link_elem["href"]
                                if href.startswith("http"):
                                    url = href
                                elif href.startswith("/"):
                                    url = f"https://github.com{href}"
                                else:
                                    url = f"{SIMPLIFYJOBS_URL}/{href}"

                    if not role:
                        text_content = body_elem.get_text().lower()
                        if "software" in text_content or "engineer" in text_content:
                            role = "Software Engineer"
                        elif "ml" in text_content or "machine learning" in text_content:
                            role = "Machine Learning Engineer"
                        elif "ai" in text_content or "artificial intelligence" in text_content:
                            role = "AI Engineer"
                        else:
                            role = "Internship Position"

                    if not location:
                        location = "Remote/Various"

                    if not url:
                        link_elem = entry.find("a", href=True)
                        if link_elem:
                            href = link_elem["href"]
                            if href.startswith("http"):
                                url = href
                            elif href.startswith("/"):
                                url = f"https://github.com{href}"
                            else:
                                url = f"{SIMPLIFYJOBS_URL}/{href}"

                    if company and role and url:
                        internships.append(
                            {
                                "company": company,
                                "role": role,
                                "location": location,
                                "url": url,
                                "date_posted": datetime.now().strftime("%Y-%m-%d"),
                                "match_score": score_from_source("SIMPLIFYJOBS"),
                            }
                        )
                except Exception as exc:
                    logger.warning(f"Error processing entry: {exc}")
                    continue

            await browser.close()
    except Exception as exc:
        logger.error(f"Error during SimplifyJobs scraping: {exc}")

    return internships


def parse_greenhouse_board(board_json: dict, company_name: str) -> list[dict]:
    internships = []
    for job in board_json.get("jobs", []):
        title = job.get("title") or ""
        if not role_is_internship(title):
            continue
        internships.append(
            {
                "company": company_name,
                "role": title,
                "location": normalize_location(job.get("location", {}).get("name", "")),
                "url": job.get("absolute_url", ""),
                "date_posted": datetime.now().strftime("%Y-%m-%d"),
                "match_score": score_from_source("ATS"),
            }
        )
    return internships


def parse_lever_board(board_json: list[dict], company_name: str) -> list[dict]:
    internships = []
    for job in board_json:
        title = job.get("text") or ""
        if not role_is_internship(title):
            continue
        internships.append(
            {
                "company": company_name,
                "role": title,
                "location": normalize_location(job.get("categories", {}).get("location", "")),
                "url": job.get("hostedUrl") or job.get("applyUrl") or "",
                "date_posted": datetime.now().strftime("%Y-%m-%d"),
                "match_score": score_from_source("ATS"),
            }
        )
    return internships


def fetch_greenhouse_jobs(board_url: str, company_name: str) -> list[dict]:
    try:
        response = requests.get(board_url, timeout=20)
        response.raise_for_status()
        return parse_greenhouse_board(response.json(), company_name)
    except requests.RequestException as exc:
        logger.error(f"Greenhouse fetch failed for {company_name}: {exc}")
        return []


def fetch_lever_jobs(board_url: str, company_name: str) -> list[dict]:
    try:
        response = requests.get(board_url, timeout=20)
        response.raise_for_status()
        return parse_lever_board(response.json(), company_name)
    except requests.RequestException as exc:
        logger.error(f"Lever fetch failed for {company_name}: {exc}")
        return []


def scrape_company_boards() -> list[dict]:
    sources = [
        {
            "company": "Microsoft",
            "type": "greenhouse",
            "url": "https://boards-api.greenhouse.io/v1/boards/microsoft/jobs",
        },
        {
            "company": "NVIDIA",
            "type": "greenhouse",
            "url": "https://boards-api.greenhouse.io/v1/boards/nvidia/jobs",
        },
        {
            "company": "Apple",
            "type": "greenhouse",
            "url": "https://boards-api.greenhouse.io/v1/boards/apple/jobs",
        },
        {
            "company": "Meta",
            "type": "lever",
            "url": "https://api.lever.co/v0/postings/meta?mode=json",
        },
        {
            "company": "Stripe",
            "type": "lever",
            "url": "https://api.lever.co/v0/postings/stripe?mode=json",
        },
    ]

    internships = []
    for source in sources:
        if source["type"] == "greenhouse":
            internships.extend(fetch_greenhouse_jobs(source["url"], source["company"]))
        elif source["type"] == "lever":
            internships.extend(fetch_lever_jobs(source["url"], source["company"]))
    return internships


async def scrape_all_sources():
    simplifyjobs = await scrape_simplifyjobs_internships()
    company_boards = scrape_company_boards()
    return simplifyjobs + company_boards