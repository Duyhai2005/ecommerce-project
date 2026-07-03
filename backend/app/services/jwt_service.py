import os
import secrets
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from dotenv import load_dotenv
from fastapi import HTTPException, Response, status
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models import user
from repositories.user_repositoriy import *
from repositories.user_session_repository import *
from utils import hash_and_verify
from utils.hash_and_verify import *

load_dotenv()
SECRET_KEY = os.getenv("ACCESS_TOKEN_SECRET")
ACCESS_TOKEN_TTL_MINUTES = int(os.getenv("ACCESS_TOKEN_TTL_MINUTES"))
REFRESH_TOKEN_TTL_DAYS = int(os.getenv("REFRESH_TOKEN_TTL_DAYS"))
COOKIE_SECURE = bool(os.getenv("COOKIE_SECURE"))
COOKIE_SAME_SITE = os.getenv("COOKIE_SAME_SITE")
COOKIE_DOMAIN = os.getenv("COOKIE_DOMAIN")
ALGORITHM = "HS256"
ISSUER = "shepoo_ecommerce-platform"
AUDIENCE = "shepoo_ecommerce-platform"


def create_jwt_token(type: str, public_id: str) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": public_id,
        "type": type,
        "iat": now,
        "exp": now
        + (
            timedelta(minutes=ACCESS_TOKEN_TTL_MINUTES)
            if type == "access"
            else timedelta(days=REFRESH_TOKEN_TTL_DAYS)
        ),
        "aud": AUDIENCE,
        "iss": ISSUER,
        "jti": str(uuid.uuid4()),
    }

    token = jwt.encode(payload=payload, key=SECRET_KEY, algorithm=ALGORITHM)

    return token


def create_access_token(public_id: str) -> str:
    return create_jwt_token(public_id=public_id, type="access")


def create_refresh_token(public_id: str) -> str:
    return create_jwt_token(public_id=public_id, type="refresh")


def decode_jwt_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            key=SECRET_KEY,
            algorithms=ALGORITHM,
            issuer=ISSUER,
            audience=AUDIENCE,
            options={"require": ["sub", "type", "iat", "exp", "aud", "iss", "jti"]},
        )
        return payload
    except ExpiredSignatureError:
        raise HTTPException(
            detail="Token đã hết hạn!", status_code=status.HTTP_401_UNAUTHORIZED
        )
    except InvalidTokenError:
        raise HTTPException(
            detail="Token không hợp lệ!", status_code=status.HTTP_401_UNAUTHORIZED
        )


async def verify_refresh_token(db: AsyncSession, token: str) -> user.User:
    now = datetime.now(UTC)
    payload = decode_jwt_token(token=token)

    if payload["type"] != "access":
        raise HTTPException(
            detail="Token không phải là access token!",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    db_user = await get_user_by_public_id(payload["sub"], db=db)
    if db_user is None:
        raise HTTPException(
            detail="Người dùng không tồn tại.", status_code=status.HTTP_404_NOT_FOUND
        )

    return db_user


def jwt_token_expires_at(token: str, db: AsyncSession) -> datetime:
    payload = decode_jwt_token(token=token)
    return datetime.fromtimestamp(payload["exp"], UTC)


def _cookie_options(max_age: int) -> dict[str, Any]:
    options: dict[str, Any] = {
        "httponly": True,
        "secure": COOKIE_SECURE,
        "samesite": COOKIE_SAME_SITE,
        "max_age": max_age,
    }
    if COOKIE_DOMAIN:
        options["domain"] = COOKIE_DOMAIN
    return options


def set_auth_cookies(
    response: Response, access_token: str, refresh_token: str | None = None
) -> None:
    response.set_cookie(
        key="access_token",
        value=access_token,
        path="/",
        **_cookie_options(max_age=ACCESS_TOKEN_TTL_MINUTES * 60)
    )

    if refresh_token:
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            path="/auth/refresh",
            ** _cookie_options(max_age=REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60),
        )


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie("access_token", path="/", domain=COOKIE_DOMAIN)
    response.delete_cookie("refresh_token", path="/auth/refresh", domain=COOKIE_DOMAIN)
