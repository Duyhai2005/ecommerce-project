from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_current_user
from models.user import User
from repositories import user_role_repository
from schemas.auth_schema import *
from schemas.user_schema import UserMeResponse
from services import (
    auth_service,
    jwt_service,
    verify_email_service,
    verify_phone_service,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/register", response_model=RegisterResponse, status_code=status.HTTP_200_OK
)
async def register(data: RegisterRequest, db: Annotated[AsyncSession, Depends(get_db)]):
    try:
        result = await auth_service.register_user(data=data, db=db)
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    return result


@router.post(
    "/verify-email",
    response_model=RouterStatusResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def verify_email(token: str, db: Annotated[AsyncSession, Depends(get_db)]):
    try:
        await verify_email_service.verify_email(token=token, db=db)
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    return RouterStatusResponse(completed=True)


@router.post(
    "/verify-email/send",
    response_model=MessageResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def send_verify_email(
    email: str, full_name: str, db: Annotated[AsyncSession, Depends(get_db)]
):
    try:
        await verify_email_service.send_email_token(email, full_name, db)
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    return MessageResponse(message=f"Đã gửi link xác thực tới email: {email}")


@router.post(
    "/verify-phone",
    response_model=RouterStatusResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def verify_phone(phone:str, otp: str, db: Annotated[AsyncSession, Depends(get_db)]):
    try:
        await verify_phone_service.verify_phone(phone=phone, otp=otp, db=db)
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    return RouterStatusResponse(completed=True)

@router.post(
    "/verify-phone/send",
    response_model=None,
    status_code=status.HTTP_200_OK,
)
async def verify_phone(phone: str, db: Annotated[AsyncSession, Depends(get_db)]):
    try:
        await verify_phone_service.send_phone_otp(phone, db)
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    return MessageResponse(message=f"Đã gửi otp xác thực tới số điện thoại: {phone}")


@router.post(
    "/login", response_model=MessageResponse, status_code=status.HTTP_202_ACCEPTED
)
async def login(
    data: LoginRequest,
    request: Request,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        result = await auth_service.login(data, request, db)
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    jwt_service.set_auth_cookies(response, result.access_token, result.refresh_token)

    return MessageResponse(message="Đăng nhập thành công.")


@router.post(
    "/refresh",
    response_model=RouterStatusResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def refresh(
    request: Request, response: Response, db: Annotated[AsyncSession, Depends(get_db)]
):
    ref_token = request.cookies.get("refresh_token")
    try:
        access_token = await auth_service.refresh(ref_token, db)
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    jwt_service.set_auth_cookies(response=response, access_token=access_token)
    return RouterStatusResponse(completed=True)


@router.get(
    "/me",
    response_model=UserMeResponse,
)
async def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    roles = await user_role_repository.get_role_list_by_user_id(current_user.id, db=db)
    return auth_service.user_to_response(current_user, roles)


@router.post(
    "/logout",
    response_model=None,
)
async def logout(
    request: Request, response: Response, db: Annotated[AsyncSession, Depends(get_db)]
):
    ref_token = request.cookies.get("refresh_token")

    try:
        await auth_service.logout(ref_token, db)
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    jwt_service.clear_auth_cookies(response)
    return MessageResponse(message="Đăng xuất thành công.")
