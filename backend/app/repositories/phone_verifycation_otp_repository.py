from datetime import datetime, UTC

from sqlalchemy import and_, or_, select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from models.phone_verifycation_otp import PhoneVerificationOtp


async def delete_phone_verifycation_otp_by_user_id(user_id: int, db: AsyncSession):
    await db.execute(
        delete(PhoneVerificationOtp).where(PhoneVerificationOtp.user_id == user_id)
    )
    await db.flush()


async def get_phone_verifycation_by_otp_hash(otp_hash: str, db: AsyncSession) -> PhoneVerificationOtp:
    result = await db.execute(
        select(PhoneVerificationOtp).where(
            PhoneVerificationOtp.otp_hash == otp_hash
        )
    )
    return result.scalar_one_or_none()


async def get_phone_verifycation_by_phone(phone: str, db: AsyncSession) -> PhoneVerificationOtp:
    result = await db.execute(
        select(PhoneVerificationOtp).where(
            PhoneVerificationOtp.phone == phone
        )
    )
    return result.scalar_one_or_none()


async def get_attempts_phone_verifycation_by_phone(phone: str, db: AsyncSession):
    result = await db.execute(
        select(PhoneVerificationOtp.attempts)
        .where(PhoneVerificationOtp.phone == phone)
    )
    return result.scalar_one_or_none()


async def create_phone_verifycation(
    user_id: int,
    otp_hash: str,
    phone: str,
    expires_at: datetime,
    created_at: datetime,
    db: AsyncSession,
):
    now = datetime.now(UTC)

    db.add(
        PhoneVerificationOtp(
            user_id=user_id,
            otp_hash=otp_hash,
            expires_at=expires_at,
            created_at=created_at,
            phone = phone,
        )
    )

    await db.flush()

    return
