from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import uuid4

from fastapi import Response, status
from jose import ExpiredSignatureError, JWTError, jwt

from src.core.config import settings
from src.exceptions.app_exception import AppException


def _now() -> datetime:
    return datetime.now(UTC)


def _timestamp(value: datetime) -> int:
    return int(value.timestamp())


def _create_jwt_token(token_type: str, public_id: str, expires_delta: timedelta) -> str:
    issued_at = _now()
    expires_at = issued_at + expires_delta
    payload = {
        "sub": public_id,
        "type": token_type,
        "iat": _timestamp(issued_at),
        "exp": _timestamp(expires_at),
        "aud": settings.jwt_audience,
        "iss": settings.jwt_issuer,
        "jti": str(uuid4()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(public_id: str) -> str:
    return _create_jwt_token(
        token_type="access",
        public_id=public_id,
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )


def create_refresh_token(public_id: str) -> str:
    return _create_jwt_token(
        token_type="refresh",
        public_id=public_id,
        expires_delta=timedelta(days=settings.refresh_token_expire_days),
    )


def decode_jwt_token(token: str, expected_type: str | None = None) -> dict[str, Any]:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            audience=settings.jwt_audience,
            issuer=settings.jwt_issuer,
        )
    except ExpiredSignatureError as exc:
        raise AppException(
            code="TOKEN_EXPIRED",
            message="Token da het han.",
            status_code=status.HTTP_401_UNAUTHORIZED,
        ) from exc
    except JWTError as exc:
        raise AppException(
            code="INVALID_TOKEN",
            message="Token khong hop le.",
            status_code=status.HTTP_401_UNAUTHORIZED,
        ) from exc

    missing_claims = [claim for claim in ("sub", "type", "jti", "exp") if claim not in payload]
    if missing_claims:
        raise AppException(
            code="INVALID_TOKEN",
            message="Token thieu thong tin xac thuc.",
            status_code=status.HTTP_401_UNAUTHORIZED,
            details={"missing": missing_claims},
        )

    if expected_type is not None and payload["type"] != expected_type:
        raise AppException(
            code="INVALID_TOKEN_TYPE",
            message="Token khong dung loai yeu cau.",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    return payload


def token_expires_at(token: str) -> datetime:
    payload = decode_jwt_token(token)
    return datetime.fromtimestamp(int(payload["exp"]), UTC).replace(tzinfo=None)


def access_token_expires_in_seconds() -> int:
    return settings.access_token_expire_minutes * 60


def _cookie_options(max_age: int) -> dict[str, Any]:
    options: dict[str, Any] = {
        "httponly": True,
        "secure": settings.cookie_secure,
        "samesite": settings.cookie_same_site,
        "max_age": max_age,
        "path": "/",
    }
    if settings.cookie_domain:
        options["domain"] = settings.cookie_domain
    return options


def set_auth_cookies(response: Response, access_token: str, refresh_token: str | None = None) -> None:
    response.set_cookie(
        key=settings.access_token_cookie_name,
        value=access_token,
        **_cookie_options(access_token_expires_in_seconds()),
    )

    if refresh_token is not None:
        response.set_cookie(
            key=settings.refresh_token_cookie_name,
            value=refresh_token,
            **_cookie_options(settings.refresh_token_expire_days * 24 * 60 * 60),
        )


def clear_auth_cookies(response: Response) -> None:
    delete_options: dict[str, Any] = {"path": "/"}
    if settings.cookie_domain:
        delete_options["domain"] = settings.cookie_domain

    response.delete_cookie(settings.access_token_cookie_name, **delete_options)
    response.delete_cookie(settings.refresh_token_cookie_name, **delete_options)
