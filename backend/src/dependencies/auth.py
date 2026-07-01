from __future__ import annotations

from fastapi import Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.core.database import get_db
from src.core.enums import UserStatus
from src.exceptions.app_exception import AppException
from src.models.user import User
from src.repositories import user_repository
from src.services import jwt_cookie_service


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    auth_error = getattr(request.state, "auth_error", None)
    payload = getattr(request.state, "auth_payload", None)

    if payload is None:
        token = request.cookies.get(settings.access_token_cookie_name)
        if not token:
            raise AppException(
                code="NOT_AUTHENTICATED",
                message="Ban can dang nhap de thuc hien thao tac nay.",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )
        if auth_error is not None:
            raise auth_error
        payload = jwt_cookie_service.decode_jwt_token(token, expected_type="access")

    user = await user_repository.get_by_public_id(payload["sub"], db)
    if user is None:
        raise AppException(
            code="USER_NOT_FOUND",
            message="Nguoi dung khong ton tai.",
            status_code=status.HTTP_404_NOT_FOUND,
        )

    if user.status == UserStatus.DELETED.value:
        raise AppException(
            code="USER_DELETED",
            message="Tai khoan da bi xoa.",
            status_code=status.HTTP_403_FORBIDDEN,
        )

    if user.email_verified_at is None or user.phone_verified_at is None:
        raise AppException(
            code="USER_NOT_VERIFIED",
            message="Tai khoan chua xac thuc email va so dien thoai.",
            status_code=status.HTTP_403_FORBIDDEN,
            details={
                "emailVerified": user.email_verified_at is not None,
                "phoneVerified": user.phone_verified_at is not None,
            },
        )

    request.state.current_user = user
    return user
