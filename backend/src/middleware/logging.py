from __future__ import annotations

import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


logger = logging.getLogger("shepoo.request")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        started_at = time.perf_counter()
        user_public_id = getattr(request.state, "user_public_id", None)

        try:
            response = await call_next(request)
        except Exception:
            duration_ms = (time.perf_counter() - started_at) * 1000
            logger.exception(
                "request_failed method=%s path=%s duration_ms=%.2f user=%s",
                request.method,
                request.url.path,
                duration_ms,
                user_public_id or "-",
            )
            raise

        duration_ms = (time.perf_counter() - started_at) * 1000
        user_public_id = getattr(request.state, "user_public_id", None)
        logger.info(
            "request method=%s path=%s status=%s duration_ms=%.2f user=%s",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
            user_public_id or "-",
        )
        return response
