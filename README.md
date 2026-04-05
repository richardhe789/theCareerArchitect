# Local Internship Dashboard

A Python web application that combines a web scraper and a Streamlit UI to help you find and manage internship opportunities. The application uses Streamlit for the frontend and Playwright for the background scraping engine.

## Features

- Web-based dashboard to view internship listings
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

## Usage

1. Run the Streamlit application:
```bash
python -m streamlit run app.py
```

2. The dashboard will open in your default browser at `http://localhost:8501`

3. Use the interface to:
   - Filter internships by job title (e.g., SWE, ML, AI)
   - Filter by location
   - Set minimum match score threshold
   - Click "Run Scraper" to fetch new internship listings

## How It Works

- The application scrapes internship data from the SimplifyJobs Summer2026-Internships GitHub repository
- Data is stored in a local SQLite database (`internships.db`)
- The dashboard displays all unique listings with filtering capabilities
- The "Run Scraper" button fetches new data without closing the dashboard
- Duplicate listings are prevented by checking unique URLs

## Project Structure

- `app.py`: Streamlit web application
- `requirements.txt`: Python dependencies
- `internships.db`: SQLite database (created automatically)

## Customization

To add more scraping sources:
1. Modify the `scrape_simplifyjobs_internships()` function or add new scraping functions
2. Update the `run_scraper()` function to include your new scraping functions
3. Adjust the database schema in `init_db()` if needed

## Troubleshooting

- If you get a Playwright error, make sure to run `playwright install chromium`
- If the app doesn't launch, ensure Streamlit is properly installed
- Check the console output for any error messages during scraping
