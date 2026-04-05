import streamlit as st
import pandas as pd
import asyncio
import sqlite3
import requests
from playwright.async_api import async_playwright
from urllib.parse import urljoin
from bs4 import BeautifulSoup
import json
import time
from datetime import datetime
import os
import logging


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Initialize SQLite database
def init_db():
    conn = sqlite3.connect('internships.db')
    cursor = conn.cursor()
    
    # Create table if it doesn't exist
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS internships (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company TEXT,
            role TEXT,
            location TEXT,
            url TEXT UNIQUE,
            date_posted TEXT,
            match_score REAL DEFAULT 100.0
        )
    ''')
    
    conn.commit()
    conn.close()


# Function to save scraped data to database
def save_to_db(internships_data):
    if not internships_data:
        return 0
    
    conn = sqlite3.connect('internships.db')
    cursor = conn.cursor()
    
    inserted_count = 0
    for internship in internships_data:
        try:
            cursor.execute('''
                INSERT OR IGNORE INTO internships (company, role, location, url, date_posted, match_score)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                internship.get('company', ''),
                internship.get('role', ''),
                internship.get('location', ''),
                internship.get('url', ''),
                internship.get('date_posted', ''),
                internship.get('match_score', 100.0)
            ))
            
            # Check if the row was actually inserted (not ignored due to duplicate)
            if cursor.rowcount > 0:
                inserted_count += 1
        except sqlite3.Error as e:
            logger.error(f"Database error when inserting {internship.get('company', 'Unknown')}: {e}")
            continue
    
    conn.commit()
    conn.close()
    
    return inserted_count


# Function to fetch data from database
def fetch_from_db(filters=None):
    conn = sqlite3.connect('internships.db')
    query = "SELECT * FROM internships ORDER BY date_posted DESC"
    
    try:
        df = pd.read_sql_query(query, conn)
    except pd.io.sql.DatabaseError:
        # Return empty DataFrame if table doesn't exist yet
        df = pd.DataFrame(columns=['id', 'company', 'role', 'location', 'url', 'date_posted', 'match_score'])
    finally:
        conn.close()
    
    # Apply filters if provided
    if filters:
        if filters.get('job_title'):
            df = df[df['role'].str.contains(filters['job_title'], case=False, na=False)]
        if filters.get('location'):
            df = df[df['location'].str.contains(filters['location'], case=False, na=False)]
        if filters.get('min_match_score'):
            df = df[df['match_score'] >= filters['min_match_score']]
    
    return df


# Scrape internships from SimplifyJobs GitHub repository
async def scrape_simplifyjobs_internships():
    internships = []
    
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            # Set a timeout for navigation
            await page.goto("https://github.com/SimplifyJobs/Summer2026-Internships", timeout=30000)
            
            # Wait for the page to load
            await page.wait_for_selector("article.Box-row", timeout=10000)
            
            # Get the page content
            content = await page.content()
            soup = BeautifulSoup(content, 'html.parser')
            
            # Find internship entries
            entries = soup.find_all('article', class_='Box-row')
            
            for entry in entries:
                try:
                    # Extract company name
                    company_elem = entry.find('h1', class_='h3')
                    if company_elem:
                        company = company_elem.get_text(strip=True)
                    else:
                        continue
                    
                    # Extract role and location
                    body_elem = entry.find('div', class_='Box-body')
                    if body_elem:
                        # Look for role and location in the body
                        text_parts = body_elem.get_text(separator='|', strip=True).split('|')
                        
                        role = ""
                        location = ""
                        url = ""
                        
                        for part in text_parts:
                            part_lower = part.lower()
                            if 'role:' in part_lower or 'position:' in part_lower:
                                role = part.replace('Role:', '').replace('Position:', '').strip()
                            elif 'location:' in part_lower:
                                location = part.replace('Location:', '').strip()
                            elif 'http' in part_lower:
                                # Try to find a link in the entry
                                link_elem = entry.find('a', href=True)
                                if link_elem:
                                    href = link_elem['href']
                                    if href.startswith('http'):
                                        url = href
                                    elif href.startswith('/'):
                                        url = f"https://github.com{href}"
                                    else:
                                        url = f"https://github.com/SimplifyJobs/Summer2026-Internships/{href}"
                    
                    # If we couldn't extract role, try a different approach
                    if not role:
                        # Look for common role keywords in the text
                        text_content = body_elem.get_text().lower()
                        if 'software' in text_content or 'engineer' in text_content:
                            role = 'Software Engineer'
                        elif 'ml' in text_content or 'machine learning' in text_content:
                            role = 'Machine Learning Engineer'
                        elif 'ai' in text_content or 'artificial intelligence' in text_content:
                            role = 'AI Engineer'
                        else:
                            role = 'Internship Position'
                    
                    # Default location if not found
                    if not location:
                        location = 'Remote/Various'
                    
                    # Default URL if not found
                    if not url:
                        # Try to find any link in the entry
                        link_elem = entry.find('a', href=True)
                        if link_elem:
                            href = link_elem['href']
                            if href.startswith('http'):
                                url = href
                            elif href.startswith('/'):
                                url = f"https://github.com{href}"
                            else:
                                url = f"https://github.com/SimplifyJobs/Summer2026-Internships/{href}"
                    
                    # Add to list if we have essential info
                    if company and role and url:
                        internships.append({
                            'company': company,
                            'role': role,
                            'location': location,
                            'url': url,
                            'date_posted': datetime.now().strftime('%Y-%m-%d'),
                            'match_score': 95.0  # High score for SimplifyJobs sourced listings
                        })
                except Exception as e:
                    logger.warning(f"Error processing entry: {e}")
                    continue
            
            await browser.close()
    except Exception as e:
        logger.error(f"Error during scraping: {e}")
    
    return internships


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


def parse_greenhouse_board(board_json: dict, company_name: str) -> list[dict]:
    internships = []
    for job in board_json.get("jobs", []):
        title = job.get("title") or ""
        if not role_is_internship(title):
            continue
        internships.append({
            "company": company_name,
            "role": title,
            "location": normalize_location(job.get("location", {}).get("name", "")),
            "url": job.get("absolute_url", ""),
            "date_posted": datetime.now().strftime("%Y-%m-%d"),
            "match_score": score_from_source("ATS"),
        })
    return internships


def parse_lever_board(board_json: list[dict], company_name: str) -> list[dict]:
    internships = []
    for job in board_json:
        title = job.get("text") or ""
        if not role_is_internship(title):
            continue
        internships.append({
            "company": company_name,
            "role": title,
            "location": normalize_location(job.get("categories", {}).get("location", "")),
            "url": job.get("hostedUrl") or job.get("applyUrl") or "",
            "date_posted": datetime.now().strftime("%Y-%m-%d"),
            "match_score": score_from_source("ATS"),
        })
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


async def scrape_ats_links(urls):
    if not urls:
        return []

    internships = []

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)

            for url in urls:
                try:
                    page = await browser.new_page()
                    await page.goto(url, timeout=30000)

                    # Wait for content to load
                    await page.wait_for_timeout(300)

                    content = await page.content()
                    soup = BeautifulSoup(content, 'html.parser')

                    # Extract information based on ATS type
                    if 'lever.co' in url:
                        # Lever-specific extraction
                        title_elem = soup.find('h1', class_='posting-title')
                        company_elem = soup.find('div', class_='posting-company')
                        location_elem = soup.find('div', class_='posting-categories')

                        title = title_elem.get_text(strip=True) if title_elem else "N/A"
                        company = company_elem.get_text(strip=True) if company_elem else "N/A"
                        location = location_elem.get_text(strip=True) if location_elem else "N/A"

                    elif 'greenhouse.io' in url:
                        # Greenhouse-specific extraction
                        title_elem = soup.find('h1', class_='app-title')
                        company_elem = soup.find('div', class_='company-name')
                        location_elem = soup.find('div', class_='location')

                        title = title_elem.get_text(strip=True) if title_elem else "N/A"
                        company = company_elem.get_text(strip=True) if company_elem else "N/A"
                        location = location_elem.get_text(strip=True) if location_elem else "N/A"
                    else:
                        # Generic extraction
                        title_elem = soup.find(['h1', 'h2', 'h3'], string=lambda t: t and ('intern' in t.lower() or 'software' in t.lower()))
                        title = title_elem.get_text(strip=True) if title_elem else "N/A"

                        # Try to find company and location in meta tags or common elements
                        company = "N/A"
                        location = "N/A"

                    if title != "N/A":
                        internships.append({
                            'company': company,
                            'role': title,
                            'location': location,
                            'url': url,
                            'date_posted': datetime.now().strftime('%Y-%m-%d'),
                            'match_score': 85.0  # Medium-high score for ATS sourced listings
                        })

                    await page.close()
                except Exception as e:
                    logger.error(f"Error scraping {url}: {e}")
                    continue

            await browser.close()
    except Exception as e:
        logger.error(f"Browser error during ATS scraping: {e}")

    return internships


# Main scraping function
async def run_scraper():
    st.write("Starting internship scraping...")
    
    # Scrape from SimplifyJobs
    simplifyjobs_internships = await scrape_simplifyjobs_internships()
    st.write(f"Found {len(simplifyjobs_internships)} internships from SimplifyJobs repository")
    
    ats_urls = []
    ats_internships = await scrape_ats_links(ats_urls)
    st.write(f"Found {len(ats_internships)} internships from ATS links")

    company_board_internships = scrape_company_boards()
    st.write(f"Found {len(company_board_internships)} internships from company career boards")

    # Combine all internships
    all_internships = simplifyjobs_internships + ats_internships + company_board_internships
    
    # Save to database
    if all_internships:
        inserted_count = save_to_db(all_internships)
        st.success(f"Successfully added {inserted_count} new internships to the database! (Duplicates were skipped)")
    else:
        st.info("No new internships found during scraping.")
    
    return all_internships


# Main Streamlit app
def main():
    st.set_page_config(page_title="Local Internship Dashboard", layout="wide")
    st.title("🔍 Local Internship Dashboard")
    
    # Initialize database
    init_db()
    
    # Sidebar for filters
    st.sidebar.header("🔍 Search Filters")
    
    job_title_filter = st.sidebar.text_input("Job Title Keywords (e.g., SWE, ML, AI)")
    location_filter = st.sidebar.text_input("Preferred Location")
    min_match_score = st.sidebar.slider("Minimum Match Score", 0, 100, 70)
    
    # Run scraper button
    if st.sidebar.button("🔄 Run Scraper"):
        with st.spinner("Scraping new internships... This may take a minute."):
            try:
                asyncio.run(run_scraper())
                st.rerun()  # Refresh the data display
            except RuntimeError as e:
                # Handle the case where asyncio event loop is already running
                if "There is no current event loop" in str(e):
                    # If running in Streamlit, we need to handle this differently
                    import subprocess
                    import sys
                    # Re-run the scraper function in a new process
                    st.warning("Running scraper in a separate process...")
                    result = subprocess.run([sys.executable, '-c', '''
import asyncio
from playwright.async_api import async_playwright
# Import functions from the main script
exec(open("app.py").read(), globals())
asyncio.run(run_scraper())
'''], capture_output=True, text=True)
                    if result.returncode == 0:
                        st.success("Scraper completed successfully!")
                        st.rerun()
                    else:
                        st.error(f"Scraper failed: {result.stderr}")
                else:
                    st.error(f"Error running scraper: {e}")
    
    # Fetch data from database with filters
    filters = {
        'job_title': job_title_filter,
        'location': location_filter,
        'min_match_score': min_match_score
    }
    
    df = fetch_from_db(filters)
    
    # Display statistics
    col1, col2, col3 = st.columns(3)
    col1.metric("Total Listings", len(df))
    col2.metric("Companies", df['company'].nunique() if not df.empty else 0)
    col3.metric("Last Updated", datetime.now().strftime("%Y-%m-%d %H:%M"))
    
    # Display data table
    if not df.empty:
        st.subheader(f"Available Internships ({len(df)} found)")
        
        # Prepare dataframe for display
        display_df = df[['company', 'role', 'location', 'date_posted']].copy()
        display_df.columns = ['Company', 'Role', 'Location', 'Date Posted']
        
        # Display dataframe
        st.dataframe(display_df, use_container_width=True, height=500)
        
        # Add apply buttons for each row
        st.subheader("Apply to Internships")
        for idx, row in df.iterrows():
            col1, col2, col3, col4, col5 = st.columns([3, 3, 2, 1, 1])
            
            with col1:
                st.write(f"**{row['company']}**")
            with col2:
                st.write(row['role'])
            with col3:
                st.write(row['location'])
            with col4:
                st.write(row['date_posted'])
            with col5:
                if st.button(f"Apply", key=f"apply_{idx}"):
                    st.markdown(f'<a href="{row["url"]}" target="_blank" rel="noopener noreferrer">Open Application</a>', unsafe_allow_html=True)
    else:
        st.info("No internships found matching your criteria. Click 'Run Scraper' to fetch new listings.")
    
    # Add footer
    st.markdown("---")
    st.markdown("💡 *Tip: The 'Run Scraper' button fetches new listings from high-signal sources like the SimplifyJobs GitHub repository.*")


if __name__ == "__main__":
    main()