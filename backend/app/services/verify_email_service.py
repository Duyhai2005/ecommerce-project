import os
import secrets
import smtplib
from datetime import UTC, datetime, timedelta
from email.message import EmailMessage
from urllib.parse import urlencode

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

import jwt_service
from repositories.email_verifycation_token_repository import *
from repositories.user_session_repository import *
from repositories.user_repositoriy import *
from schemas.auth_schema import *
from utils.hash_and_verify import *

load_dotenv()
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL")
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
FRONTEND_URL = os.getenv("FRONTEND_URL")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME")
SMTP_TIMEOUT_SECONDS = int(os.getenv("SMTP_TIMEOUT_SECONDS"))
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = os.getenv("SMTP_PORT")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS")
EMAIL_VERIFYCATION_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("EMAIL_VERIFYCATION_TOKEN_EXPIRE_MINUTES")
)


def generate_token() -> str:
    return secrets.token_urlsafe(48)


def _clean(value: str | None) -> str:
    return value.strip() if value else ""


def _sender_email() -> str:
    return _clean(SMTP_FROM_EMAIL) or _clean(SMTP_USERNAME)


def email_verification_link(token: str) -> str:
    query = urlencode({"token": token})
    return f"{FRONTEND_URL.rstrip('/')}/verify-email?{query}"


async def verify_email(token: str, db: AsyncSession):
    email_verification = await get_email_verifycation_by_token_hash(
        hash_token(token), db
    )
    if not email_verification:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Token không hợp lệ."
        )

    if email_verification.expires_at < datetime.now(UTC).replace(tzinfo=None):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Token đã hết hạn."
        )

    user_id = email_verification.user_id

    await set_email_verified_at(user_id=user_id, time=datetime.now(UTC), db=db)
    await delete_email_verifycation_token_by_user_id(user_id=user_id, db=db)


async def send_email_token(email: str, full_name: str, db: AsyncSession):
    user = await get_user_by_email(email=email, db=db)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Email chưa được đăng ký."
        )

    await delete_email_verifycation_token_by_user_id(user_id=user.id, db=db)

    token = generate_token()

    now = datetime.now(UTC)
    await create_email_verifycation(
        user_id=user.id,
        token_hash=hash_token(token),
        expires_at=now + timedelta(minutes=EMAIL_VERIFYCATION_TOKEN_EXPIRE_MINUTES),
        created_at=now,
        db=db,
    )

    link = email_verification_link(token=token)
    sender_email = _sender_email()
    sender_name = _clean(SMTP_FROM_NAME)
    sender = f"{sender_name} <{sender_email}>" if sender_name else sender_email

    message = EmailMessage()
    message["Subject"] = "Xác thực email Shepoo"
    message["From"] = sender
    message["To"] = email
    message.set_content(f"""Xin chào {full_name},
        
        Bấm vào link sau để xác thực email Shepoo: {link}
        
        Nếu bạn không muốn xác thực tài khoản Shepoo, vui lòng bỏ qua email này!""")

    try:
        with smtplib.SMTP(
            host=_clean(SMTP_HOST), port=SMTP_PORT, timeout=SMTP_TIMEOUT_SECONDS
        ) as smtp:
            if SMTP_USE_TLS:
                smtp.starttls()
            username = _clean(SMTP_USERNAME)
            password = _clean(SMTP_PASSWORD)
            if username and password:
                smtp.login(username, password)
            smtp.send_message(message)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Gửi email thất bại."
        )
