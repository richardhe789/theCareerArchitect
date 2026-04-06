import os
import sqlite3

from typing import Any, Iterable, Mapping, Optional

import pandas as pd
from pandas.errors import DatabaseError


def resolve_db_path(db_path: str) -> str:
    if os.getenv("VERCEL"):
        return os.path.join("/tmp", os.path.basename(db_path))
    return db_path


def init_db(db_path: str = "internships.db") -> None:
    conn = sqlite3.connect(resolve_db_path(db_path))
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS internships (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company TEXT,
            role TEXT,
            location TEXT,
            url TEXT UNIQUE,
            date_posted TEXT,
            match_score REAL DEFAULT 100.0
        )
        """
    )
    conn.commit()
    conn.close()


def save_to_db(internships_data: Iterable[Mapping[str, Any]], db_path: str = "internships.db") -> int:
    if not internships_data:
        return 0

    conn = sqlite3.connect(resolve_db_path(db_path))
    cursor = conn.cursor()

    inserted_count = 0
    for internship in internships_data:
        try:
            cursor.execute(
                """
                INSERT OR IGNORE INTO internships (company, role, location, url, date_posted, match_score)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    internship.get("company", ""),
                    internship.get("role", ""),
                    internship.get("location", ""),
                    internship.get("url", ""),
                    internship.get("date_posted", ""),
                    internship.get("match_score", 100.0),
                ),
            )

            if cursor.rowcount > 0:
                inserted_count += 1
        except sqlite3.Error:
            continue

    conn.commit()
    conn.close()
    return inserted_count


def fetch_from_db(
    filters: Optional[Mapping[str, Any]] = None, db_path: str = "internships.db"
) -> pd.DataFrame:
    conn = sqlite3.connect(resolve_db_path(db_path))
    query = "SELECT * FROM internships ORDER BY date_posted DESC"
    try:
        df = pd.read_sql_query(query, conn)
    except DatabaseError:
        df = pd.DataFrame(
            columns=["id", "company", "role", "location", "url", "date_posted", "match_score"]
        )
    finally:
        conn.close()

    if filters:
        job_title = filters.get("job_title")
        location = filters.get("location")
        min_match_score = filters.get("min_match_score")
        if job_title:
            df = df[df["role"].str.contains(job_title, case=False, na=False)]
        if location:
            df = df[df["location"].str.contains(location, case=False, na=False)]
        if min_match_score is not None:
            df = df[df["match_score"] >= float(min_match_score)]

    return df