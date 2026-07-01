from __future__ import annotations

import asyncio
import logging
import secrets
from dataclasses import dataclass
from datetime import timedelta

from fastapi import Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.core.enums import RoleName, UserStatus
from src.exceptions.app_exception import AppException
from src.models.base import utc_now
from src.models.user import User
from src.repositories import (
    email_verification_repository,
    phone_verification_repository,
    session_repository,
    user_repository,
)
from src.schemas import auth as auth_schema
from src.schemas.user import UserMeResponse
from src.services import email_service, jwt_cookie_service
from src.utils import auth_security


logger = logging.getLogger("shepoo.auth")
MAX_PHONE_OTP_ATTEMPTS = 5


@dataclass(frozen=True)
class AuthResult:
    user: User
    roles: list[str]
    access_token: str
    refresh_token: str
    expires_in: int


@dataclass(frozen=True)
class VerificationChallenge:
    email_token: str | None
    phone_otp: str | None


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _normalize_identifier(identifier: str) -> str:
    value = identifier.strip()
    if "@" in value:
        return value.lower()
    phone = auth_schema.normalize_phone_number(value)
    if auth_schema.PHONE_RE.fullmatch(phone):
        return phone
    return value


def _generate_email_token() -> str:
    return secrets.token_urlsafe(48)


def _generate_phone_otp() -> str:
    return "".join(secrets.choice("0123456789") for _ in range(6))


async def create_verification_challenge(user: User, db: AsyncSession) -> VerificationChallenge:
    email_token: str | None = None
    email_sent = False
    phone_otp: str | None = None
    now = utc_now()

    if user.email_verified_at is None:
        await email_verification_repository.delete_tokens_for_user(user.id, db)
        email_token = _generate_email_token()
        await email_verification_repository.create_token(
            user_id=user.id,
            token_hash=auth_security.hash_token(email_token),
            expires_at=now + timedelta(minutes=settings.email_verification_token_expire_minutes),
            db=db,
        )
        email_sent = await asyncio.to_thread(
            email_service.send_email_verification,
            user.email,
            user.full_name,
            email_token,
        )

    if user.phone_verified_at is None:
        await phone_verification_repository.expire_pending_for_phone(user.id, user.phone, db)
        phone_otp = _generate_phone_otp()
        await phone_verification_repository.create_otp(
            user_id=user.id,
            phone=user.phone,
            otp_hash=auth_security.hash_token(phone_otp),
            expires_at=now + timedelta(minutes=settings.phone_otp_expire_minutes),
            db=db,
        )

    if email_token and (settings.dev_auth_debug or not email_sent):
        logger.info(
            "email_verification_link user_public_id=%s sent=%s link=%s",
            user.public_id,
            email_sent,
            email_service.email_verification_link(email_token),
        )

    if settings.dev_auth_debug:
        logger.info(
            "verification_challenge user_public_id=%s email_token=%s phone_otp=%s",
            user.public_id,
            email_token,
            phone_otp,
        )

    return VerificationChallenge(email_token=email_token, phone_otp=phone_otp)


def _request_ip(request: Request) -> str | None:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else None


def user_to_response(user: User, roles: list[str]) -> UserMeResponse:
    return UserMeResponse(
        public_id=user.public_id,
        full_name=user.full_name,
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


def user_verification_to_status(
    message: str,
    user: User,
) -> auth_schema.RegistrationStatusResponse:
    email_verified = user.email_verified_at is not None
    phone_verified = user.phone_verified_at is not None
    return auth_schema.RegistrationStatusResponse(
        message=message,
        registration_id=user.public_id,
        email=user.email,
        phone=user.phone,
        email_verified=email_verified,
        phone_verified=phone_verified,
        completed=email_verified and phone_verified,
    )


async def roles_for_user(user: User, db: AsyncSession) -> list[str]:
    return await user_repository.list_roles(user.id, db) or []


def ensure_user_can_login(user: User) -> None:
    if user.status == UserStatus.DELETED.value:
        raise AppException(
            code="USER_DELETED",
            message="Tai khoan da bi xoa.",
            status_code=status.HTTP_403_FORBIDDEN,
        )

    if user.status == UserStatus.LOCKED.value:
        locked_until = user.locked_until
        if locked_until is None or locked_until > utc_now():
            raise AppException(
                code="USER_LOCKED",
                message="Tai khoan dang bi khoa.",
                status_code=status.HTTP_423_LOCKED,
                details={"lockedUntil": locked_until.isoformat() if locked_until else None},
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


async def register_user(
    payload: auth_schema.RegisterRequest,
    db: AsyncSession,
) -> auth_schema.RegistrationStatusResponse:
    email = _normalize_email(payload.email)
    phone = payload.phone.strip()

    if await user_repository.get_by_email(email, db):
        raise AppException(
            code="EMAIL_EXISTS",
            message="Email da duoc su dung.",
            status_code=status.HTTP_409_CONFLICT,
        )

    if await user_repository.get_by_phone(phone, db):
        raise AppException(
            code="PHONE_EXISTS",
            message="So dien thoai da duoc su dung.",
            status_code=status.HTTP_409_CONFLICT,
        )

    user = await user_repository.create_user(
        {
            "full_name": payload.full_name.strip(),
            "email": email,
            "phone": phone,
            "password_hash": auth_security.hash_password(payload.password),
            "status": UserStatus.ACTIVE.value,
        },
        db=db,
        roles=[RoleName.CUSTOMER],
    )
    await create_verification_challenge(user, db)
    return user_verification_to_status(
        "Da dang ky. Vui long xac thuc email va so dien thoai truoc khi dang nhap.",
        user,
    )


async def verify_email(
    payload: auth_schema.VerifyEmailRequest,
    db: AsyncSession,
) -> auth_schema.RegistrationStatusResponse:
    token_hash = auth_security.hash_token(payload.token.strip())
    token = await email_verification_repository.get_valid_by_token_hash(token_hash, db)

    if token is None:
        raise AppException(
            code="INVALID_EMAIL_VERIFICATION_TOKEN",
            message="Token xac thuc email khong hop le hoac da het han.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    user = await user_repository.get_by_id(token.user_id, db)
    if user is None:
        raise AppException(
            code="USER_NOT_FOUND",
            message="Khong tim thay tai khoan can xac thuc.",
            status_code=status.HTTP_404_NOT_FOUND,
        )

    await email_verification_repository.mark_verified(token.id, db)
    await user_repository.set_email_verified(user.id, db)
    await db.refresh(user)
    if user.phone_verified_at is None:
        message = "Xac thuc email thanh cong. Vui long xac thuc so dien thoai."
    else:
        message = "Xac thuc email thanh cong. Vui long dang nhap lai."
    return user_verification_to_status(message, user)


async def verify_phone(
    payload: auth_schema.VerifyPhoneRequest,
    db: AsyncSession,
) -> auth_schema.RegistrationStatusResponse:
    phone = auth_schema.normalize_phone_number(payload.phone)
    user: User | None = None
    otp = None

    if payload.registration_id:
        user = await user_repository.get_by_public_id(payload.registration_id, db)
        if user is None:
            raise AppException(
                code="USER_NOT_FOUND",
                message="Khong tim thay tai khoan can xac thuc.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        if user.phone != phone:
            raise AppException(
                code="PHONE_MISMATCH",
                message="So dien thoai khong khop voi tai khoan dang xac thuc.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        otp = await phone_verification_repository.get_latest_pending(
            user_id=user.id,
            phone=phone,
            db=db,
        )
    else:
        otp = await phone_verification_repository.get_latest_pending_by_phone(
            phone=phone,
            db=db,
        )

    if otp is None:
        raise AppException(
            code="PHONE_OTP_NOT_FOUND",
            message="OTP khong hop le hoac da het han.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    user = user or await user_repository.get_by_id(otp.user_id, db)
    if user is None:
        raise AppException(
            code="USER_NOT_FOUND",
            message="Khong tim thay tai khoan can xac thuc.",
            status_code=status.HTTP_404_NOT_FOUND,
        )

    if otp.attempts >= MAX_PHONE_OTP_ATTEMPTS:
        await phone_verification_repository.expire_pending_for_phone(otp.user_id, phone, db)
        raise AppException(
            code="PHONE_OTP_LOCKED",
            message="OTP da vuot qua so lan thu. Vui long gui lai ma moi.",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    if not auth_security.verify_token_hash(payload.otp, otp.otp_hash):
        updated_otp = await phone_verification_repository.increment_attempts(otp.id, db)
        if updated_otp and updated_otp.attempts >= MAX_PHONE_OTP_ATTEMPTS:
            await phone_verification_repository.expire_pending_for_phone(otp.user_id, phone, db)
        raise AppException(
            code="INVALID_PHONE_OTP",
            message="OTP khong dung.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    await phone_verification_repository.mark_verified(otp.id, db)
    await user_repository.set_phone_verified(user.id, db)
    await db.refresh(user)
    if user.email_verified_at is None:
        message = "Xac thuc so dien thoai thanh cong. Vui long xac thuc email."
    else:
        message = "Xac thuc so dien thoai thanh cong. Vui long dang nhap lai."
    return user_verification_to_status(message, user)


async def resend_email_verification(
    payload: auth_schema.ResendEmailVerificationRequest,
    db: AsyncSession,
) -> auth_schema.RegistrationStatusResponse:
    user: User | None = None
    if payload.registration_id:
        user = await user_repository.get_by_public_id(payload.registration_id, db)
    elif payload.email:
        user = await user_repository.get_by_email(_normalize_email(payload.email), db)

    if user is None:
        raise AppException(
            code="USER_NOT_FOUND",
            message="Khong tim thay tai khoan de gui lai email xac thuc.",
            status_code=status.HTTP_404_NOT_FOUND,
        )

    if user.email_verified_at is None:
        await email_verification_repository.delete_tokens_for_user(user.id, db)
        email_token = _generate_email_token()
        await email_verification_repository.create_token(
            user_id=user.id,
            token_hash=auth_security.hash_token(email_token),
            expires_at=utc_now() + timedelta(minutes=settings.email_verification_token_expire_minutes),
            db=db,
        )
        email_sent = await asyncio.to_thread(
            email_service.send_email_verification,
            user.email,
            user.full_name,
            email_token,
        )
        if settings.dev_auth_debug or not email_sent:
            logger.info(
                "email_verification_link user_public_id=%s sent=%s link=%s",
                user.public_id,
                email_sent,
                email_service.email_verification_link(email_token),
            )

    return user_verification_to_status("Da gui lai ma xac thuc email.", user)


async def resend_phone_verification(
    payload: auth_schema.ResendPhoneVerificationRequest,
    db: AsyncSession,
) -> auth_schema.RegistrationStatusResponse:
    user: User | None = None
    if payload.registration_id:
        user = await user_repository.get_by_public_id(payload.registration_id, db)
    elif payload.phone:
        user = await user_repository.get_by_phone(auth_schema.normalize_phone_number(payload.phone), db)

    if user is None:
        raise AppException(
            code="USER_NOT_FOUND",
            message="Khong tim thay tai khoan de gui lai OTP.",
            status_code=status.HTTP_404_NOT_FOUND,
        )

    if user.phone_verified_at is None:
        await phone_verification_repository.expire_pending_for_phone(user.id, user.phone, db)
        phone_otp = _generate_phone_otp()
        await phone_verification_repository.create_otp(
            user_id=user.id,
            phone=user.phone,
            otp_hash=auth_security.hash_token(phone_otp),
            expires_at=utc_now() + timedelta(minutes=settings.phone_otp_expire_minutes),
            db=db,
        )
        if settings.dev_auth_debug:
            logger.info(
                "phone_verification_otp user_public_id=%s phone_otp=%s",
                user.public_id,
                phone_otp,
            )

    return user_verification_to_status("Da gui lai OTP dien thoai.", user)


async def authenticate_user(
    payload: auth_schema.LoginRequest,
    db: AsyncSession,
) -> tuple[User, list[str]]:
    identifier = _normalize_identifier(payload.identifier)
    user = await user_repository.get_by_identifier(identifier, db)

    if user is None or not auth_security.verify_password(payload.password, user.password_hash):
        raise AppException(
            code="INVALID_CREDENTIALS",
            message="Email/so dien thoai hoac mat khau khong dung.",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    ensure_user_can_login(user)
    roles = await roles_for_user(user, db)
    return user, roles


async def issue_auth_result(
    user: User,
    roles: list[str],
    db: AsyncSession,
    request: Request,
    device_name: str | None = None,
) -> AuthResult:
    access_token = jwt_cookie_service.create_access_token(user.public_id)
    refresh_token = jwt_cookie_service.create_refresh_token(user.public_id)

    await session_repository.create_session(
        user_id=user.id,
        refresh_token_hash=auth_security.hash_token(refresh_token),
        expires_at=jwt_cookie_service.token_expires_at(refresh_token),
        db=db,
        device_name=device_name,
        ip_address=_request_ip(request),
        user_agent=request.headers.get("user-agent"),
    )

    return AuthResult(
        user=user,
        roles=roles,
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=jwt_cookie_service.access_token_expires_in_seconds(),
    )


async def refresh_auth_result(
    refresh_token: str,
    db: AsyncSession,
    request: Request,
) -> AuthResult:
    payload = jwt_cookie_service.decode_jwt_token(refresh_token, expected_type="refresh")
    session = await session_repository.get_active_by_refresh_token_hash(
        auth_security.hash_token(refresh_token),
        db=db,
    )
    if session is None:
        raise AppException(
            code="SESSION_NOT_FOUND",
            message="Phien dang nhap khong hop le hoac da het han.",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    user = await user_repository.get_by_public_id(payload["sub"], db)
    if user is None or user.id != session.user_id:
        raise AppException(
            code="INVALID_TOKEN",
            message="Token khong khop voi nguoi dung.",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    ensure_user_can_login(user)
    roles = await roles_for_user(user, db)
    access_token = jwt_cookie_service.create_access_token(user.public_id)

    await session_repository.touch_session(session.id, db)

    return AuthResult(
        user=user,
        roles=roles,
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=jwt_cookie_service.access_token_expires_in_seconds(),
    )


async def revoke_refresh_token(
    refresh_token: str | None,
    db: AsyncSession,
    reason: str = "logout",
) -> None:
    if not refresh_token:
        return

    try:
        jwt_cookie_service.decode_jwt_token(refresh_token, expected_type="refresh")
    except AppException:
        return

    await session_repository.revoke_by_refresh_token_hash(
        refresh_token_hash=auth_security.hash_token(refresh_token),
        db=db,
        reason=reason,
    )
