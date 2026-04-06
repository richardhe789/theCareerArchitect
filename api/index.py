from fastapi import FastAPI

try:
    from backend.main import app
except ModuleNotFoundError:
    import sys
    from pathlib import Path

    sys.path.append(str(Path(__file__).resolve().parents[1]))
    try:
        from backend.main import app
    except ModuleNotFoundError:
        app = FastAPI(title="Internship Finder API")


handler = app

__all__ = ["app", "handler"]