import os
import secrets
import uuid
import logging
from datetime import UTC, datetime, timedelta
from dotenv import load_dotenv

from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

import jwt_service
from repositories.user_repositoriy import *
from repositories.user_session_repository import *
from repositories.phone_verifycation_otp_repository import *
from schemas.auth_schema import *
from utils.hash_and_verify import *


logger = logging.getLogger(__name__)


load_dotenv()
PHONE_OTP_MAX_ATTEMPTS=int(os.getenv("PHONE_OTP_MAX_ATTEMPTS"))
PHONE_OTP_TTL_MINUTES=int(os.getenv("PHONE_OTP_TTL_MINUTES"))


def generate_otp(length: int = 6) -> str:
    return "".join(secrets.choice("0123456789") for _ in range(length))


async def verify_phone(phone: str, otp: str, db: AsyncSession):
    phone_verifycation = await get_phone_verifycation_by_phone(phone, db)
    
    if not phone_verifycation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Số điện thoại chưa được đăng ký."
        ) 
        
    phone_verifycation.attempts += 1        
        
    if not verify_password(otp, phone_verifycation.otp_hash):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Mã OTP không hợp lệ."
        ) 
        
    
    if phone_verifycation.expires_at < datetime.now(UTC).replace(tzinfo=None):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Đã hết hạn xác thực OTP."
        )
        
    if phone_verifycation.attempts > PHONE_OTP_MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn đã đạt giới hạn số lần xác thực OTP, vui lòng nhấn gửi lại OTP!"
        )
        
        
    user_id = phone_verifycation.user_id
    
    await set_phone_verified_at(user_id, datetime.now(UTC), db)
    await delete_phone_verifycation_otp_by_user_id(user_id, db)


async def send_phone_otp(phone: str, db: AsyncSession):
    user = await get_user_by_phone(phone=phone, db=db)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Số điện thoại chưa được đăng ký."
        ) 
        
    await delete_phone_verifycation_otp_by_user_id(user.id, db)
    
    otp = generate_otp()
    
    now = datetime.now(UTC)
    await create_phone_verifycation(
        user_id=user.id,
        otp_hash=hash_password(otp),
        phone=phone,
        expires_at=now + timedelta(minutes=PHONE_OTP_TTL_MINUTES),
        created_at=now,
        db=db
    )
    
    ##### DEV environment only
    logger.warning("DEV OTP phone=%s otp=%s", phone, otp)
    
