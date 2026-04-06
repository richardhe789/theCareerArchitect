from typing import Optional

from fastapi import FastAPI

app = FastAPI(title="Internship Finder API")
backend_app: Optional[FastAPI]

try:
    from backend.main import app as backend_app
except ModuleNotFoundError:
    import sys
    from pathlib import Path

    sys.path.append(str(Path(__file__).resolve().parents[1]))
    try:
        from backend.main import app as backend_app
    except ModuleNotFoundError:
        backend_app = None

if backend_app is not None:
    app = backend_app

handler = app

__all__ = ["app", "handler"]