from __future__ import annotations

import logging

from fastapi import APIRouter, Body, Depends, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.core.database import get_db
from src.dependencies.auth import get_current_user
from src.exceptions.app_exception import AppException
from src.models.user import User
from src.schemas import auth as auth_schema
from src.schemas.user import UserMeResponse
from src.services import auth_service, jwt_cookie_service


router = APIRouter(prefix=f"{settings.api_prefix}/auth", tags=["Auth"])
logger = logging.getLogger("shepoo.auth")


def _session_response(result: auth_service.AuthResult) -> auth_schema.AuthSessionResponse:
    return auth_schema.AuthSessionResponse(
        user=auth_service.user_to_response(result.user, result.roles),
        expires_in=result.expires_in,
    )


@router.post(
    "/register",
    response_model=auth_schema.RegistrationStatusResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def register(
    payload: auth_schema.RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await auth_service.register_user(payload, db)
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    jwt_cookie_service.clear_auth_cookies(response)
    logger.info("registered_unverified_user user_public_id=%s email=%s", result.registration_id, result.email)
    return result


@router.post("/verify-email", response_model=auth_schema.RegistrationStatusResponse)
async def verify_email(
    payload: auth_schema.VerifyEmailRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await auth_service.verify_email(payload, db)
        if result.completed:
            await auth_service.revoke_refresh_token(
                request.cookies.get(settings.refresh_token_cookie_name),
                db,
                reason="verification_completed",
            )
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    if result.completed:
        jwt_cookie_service.clear_auth_cookies(response)
    logger.info("verified_email email=%s completed=%s", result.email, result.completed)
    return result


@router.post("/verify-phone", response_model=auth_schema.RegistrationStatusResponse)
async def verify_phone(
    payload: auth_schema.VerifyPhoneRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await auth_service.verify_phone(payload, db)
        if result.completed:
            await auth_service.revoke_refresh_token(
                request.cookies.get(settings.refresh_token_cookie_name),
                db,
                reason="verification_completed",
            )
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    if result.completed:
        jwt_cookie_service.clear_auth_cookies(response)
    logger.info("verified_phone phone=%s completed=%s", result.phone, result.completed)
    return result


@router.post("/verify-email/resend", response_model=auth_schema.MessageResponse)
async def resend_email_verification(
    payload: auth_schema.ResendEmailVerificationRequest | None = Body(default=None),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await auth_service.resend_email_verification(
            payload or auth_schema.ResendEmailVerificationRequest(),
            db,
        )
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    return auth_schema.MessageResponse(message=result.message)


@router.post("/verify-phone/resend", response_model=auth_schema.MessageResponse)
async def resend_phone_verification(
    payload: auth_schema.ResendPhoneVerificationRequest | None = Body(default=None),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await auth_service.resend_phone_verification(
            payload or auth_schema.ResendPhoneVerificationRequest(),
            db,
        )
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    return auth_schema.MessageResponse(message=result.message)


@router.post("/login", response_model=auth_schema.AuthSessionResponse)
async def login(
    payload: auth_schema.LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    try:
        user, roles = await auth_service.authenticate_user(payload, db)
        result = await auth_service.issue_auth_result(
            user=user,
            roles=roles,
            db=db,
            request=request,
            device_name=payload.device_name,
        )
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    jwt_cookie_service.set_auth_cookies(response, result.access_token, result.refresh_token)
    logger.info("logged_in user_public_id=%s", result.user.public_id)
    return _session_response(result)


@router.get("/me", response_model=UserMeResponse)
async def me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    roles = await auth_service.roles_for_user(current_user, db)
    return auth_service.user_to_response(current_user, roles)


@router.post("/refresh", response_model=auth_schema.AuthSessionResponse)
async def refresh(
    request: Request,
    response: Response,
    payload: auth_schema.RefreshRequest | None = Body(default=None),
    db: AsyncSession = Depends(get_db),
):
    refresh_token = (
        payload.refresh_token
        if payload is not None
        else request.cookies.get(settings.refresh_token_cookie_name)
    )
    if not refresh_token:
        raise AppException(
            code="REFRESH_TOKEN_MISSING",
            message="Khong tim thay refresh token.",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        result = await auth_service.refresh_auth_result(refresh_token, db, request)
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    # Refresh keeps the existing refresh token cookie; only the access token is renewed.
    jwt_cookie_service.set_auth_cookies(response, result.access_token)
    logger.info("refreshed_session user_public_id=%s", result.user.public_id)
    return _session_response(result)


@router.post("/logout", response_model=auth_schema.MessageResponse)
async def logout(
    request: Request,
    response: Response,
    payload: auth_schema.LogoutRequest | None = Body(default=None),
    db: AsyncSession = Depends(get_db),
):
    refresh_token = (
        payload.refresh_token
        if payload is not None
        else request.cookies.get(settings.refresh_token_cookie_name)
    )

    try:
        await auth_service.revoke_refresh_token(refresh_token, db)
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    jwt_cookie_service.clear_auth_cookies(response)
    return auth_schema.MessageResponse(message="Dang xuat thanh cong.")
