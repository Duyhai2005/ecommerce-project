from datetime import UTC, datetime, timedelta

from fastapi import Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from jwt_service import *
from models.user import User
from repositories.user_repositoriy import *
from repositories.user_session_repository import *
from schemas.auth_schema import *
from schemas.user_schema import UserMeResponse
from utils.hash_and_verify import *


async def register_user(data: RegisterRequest, db: AsyncSession):
    email = data.email
    phone = data.phone
    username = data.username

    if await get_user_by_email(email=email, db=db) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email này đã được sử dụng."
        )

    if await get_user_by_phone(phone=phone, db=db) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Số điện thoại này đã được sử dụng.",
        )

    if await get_user_by_username(username=username, db=db) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Username này đã được sử dụng."
        )

    user = await create_user(
        {
            "fullname": data.fullname,
            "username": data.username,
            "email": data.email,
            "phone": data.phone,
            "password_hash": hash_password(data.password),
        },
        db=db,
        roles=["CUSTOMER"],
    )

    return RegisterResponse(
        fullname=user.fullname,
        username=user.fullname,
        email=user.email,
        phone=user.phone,
    )


async def login(
    payload: LoginRequest, request: Request, db: AsyncSession
) -> LoginReponse:
    identifier = payload.identifier
    password = payload.password

    user = await get_user_by_email(email=identifier, db=db)
    if not user:
        user = await get_user_by_phone(phone=identifier, db=db)
    if not user:
        user = await get_user_by_username(username=identifier, db=db)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Người dùng không tồn tại."
        )

    if not verify_password(password=password, password_hash=user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Mật khẩu không chính xác."
        )

    if user.status == "LOCKED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Tài khoản đã bị khoá."
        )

    access_token = create_access_token(public_id=user.public_id)
    refresh_token = create_refresh_token(public_id=user.public_id)

    session = await create_session(
        {
            "user_id": user.id,
            "refresh_token_hash": hash_token(refresh_token),
            "expires_at": jwt_token_expires_at(refresh_token, db),
            "user_agent": request.headers.get("user-agent"),  ########################
            "ip_address": _request_ip(request=request),
            # "device_name":
        },
        db=db,
    )

    return LoginReponse(access_token=access_token, refresh_token=refresh_token)


def _request_ip(request: Request) -> str | None:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else None


async def refresh(refresh_token: str, db: AsyncSession) -> str:
    session = await get_session_by_refresh_token_hash(hash_token(refresh_token), db)

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Vui lòng đăng nhập."
        )

    if session.revoked_at is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Phiên đăng nhập đã hết hạn."
        )

    user = await get_user_by_id(id=session.user_id, db=db)

    new_access_token = create_access_token(id=user.id)

    return new_access_token


async def logout(refresh_token: str, db: AsyncSession):
    session = await get_session_by_refresh_token_hash(hash_token(refresh_token), db)

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Vui lòng đăng nhập."
        )

    await revoke_session(
        session.id, datetime.now(UTC).replace(tzinfo=None), "logout", db
    )


def user_to_response(user: User, roles: list[str]) -> UserMeResponse:
    return UserMeResponse(
        public_id=user.public_id,
        full_name=user.fullname,
        email=user.email,
        phone=user.phone,
        avatar_url=user.avatar_url,
        gender=user.gender,
        date_of_birth=user.date_of_birth,
        email_verified_at=user.email_verified_at,
        phone_verified_at=user.phone_verified_at,
        status=user.status,
        locked_until=user.locked_until,
        lock_reason=user.lock_reason,
        roles=roles,
    )
