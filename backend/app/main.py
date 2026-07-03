from __future__ import annotations

import logging
import os
import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

APP_DIR = Path(__file__).resolve().parent
BACKEND_DIR = APP_DIR.parent
PROJECT_DIR = BACKEND_DIR.parent
SERVICES_DIR = APP_DIR / "services"

for path in (PROJECT_DIR, BACKEND_DIR, APP_DIR, SERVICES_DIR):
    path_text = str(path)
    if path_text not in sys.path:
        sys.path.insert(0, path_text)

from api.auth_api import router as auth_router


def csv_env(name: str, default: str) -> list[str]:
    value = os.getenv(name, default)
    return [item.strip() for item in value.split(",") if item.strip()]


logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)

app = FastAPI(
    title=os.getenv("APP_NAME", "Shepoo Ecommerce API"),
    version=os.getenv("APP_VERSION", "0.1.0"),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=csv_env(
        "CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)


@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "env": os.getenv("APP_ENV", "development"),
    }
