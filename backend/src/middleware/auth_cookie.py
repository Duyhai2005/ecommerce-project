from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from src.core.config import settings
from src.exceptions.app_exception import AppException
from src.services import jwt_cookie_service


class AuthCookieMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request.state.access_token = None
        request.state.auth_payload = None
        request.state.auth_error = None
        request.state.user_public_id = None

        token = request.cookies.get(settings.access_token_cookie_name)
        if token:
            request.state.access_token = token
            try:
                payload = jwt_cookie_service.decode_jwt_token(token, expected_type="access")
                request.state.auth_payload = payload
                request.state.user_public_id = payload["sub"]
            except AppException as exc:
                request.state.auth_error = exc

        return await call_next(request)
