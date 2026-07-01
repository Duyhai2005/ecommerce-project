from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.config import settings
from src.exceptions.app_exception import AppException
from src.exceptions.handlers import app_exception_handler
from src.middleware.auth_cookie import AuthCookieMiddleware
from src.middleware.logging import RequestLoggingMiddleware
from src.routes.auth_routes import router as auth_router


logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)

app = FastAPI(title="Shepoo Ecommerce API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(AuthCookieMiddleware)

app.add_exception_handler(AppException, app_exception_handler)
app.include_router(auth_router)


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "env": settings.app_env}
