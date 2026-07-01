from __future__ import annotations

from datetime import datetime

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.auth import PhoneVerificationOtp
from src.models.base import utc_now


async def create_otp(
    user_id: int,
    phone: str,
    otp_hash: str,
    expires_at: datetime,
    db: AsyncSession,
) -> PhoneVerificationOtp:
    otp = PhoneVerificationOtp(
        user_id=user_id,
        phone=phone,
        otp_hash=otp_hash,
        expires_at=expires_at,
    )
    db.add(otp)
    await db.flush()
    return otp


async def get_by_id(
    otp_id: int,
    db: AsyncSession,
) -> PhoneVerificationOtp | None:
    return await db.get(PhoneVerificationOtp, otp_id)


async def get_latest_pending(
    user_id: int,
    phone: str,
    db: AsyncSession,
    now: datetime | None = None,
) -> PhoneVerificationOtp | None:
    now = now or utc_now()
    result = await db.execute(
        select(PhoneVerificationOtp)
        .where(
            PhoneVerificationOtp.user_id == user_id,
            PhoneVerificationOtp.phone == phone,
            PhoneVerificationOtp.verified_at.is_(None),
            PhoneVerificationOtp.expires_at > now,
        )
        .order_by(PhoneVerificationOtp.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def get_latest_pending_by_phone(
    phone: str,
    db: AsyncSession,
    now: datetime | None = None,
) -> PhoneVerificationOtp | None:
    now = now or utc_now()
    result = await db.execute(
        select(PhoneVerificationOtp)
        .where(
            PhoneVerificationOtp.phone == phone,
            PhoneVerificationOtp.verified_at.is_(None),
            PhoneVerificationOtp.expires_at > now,
        )
        .order_by(PhoneVerificationOtp.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def list_pending_by_user(
    user_id: int,
    db: AsyncSession,
    now: datetime | None = None,
) -> list[PhoneVerificationOtp]:
    now = now or utc_now()
    result = await db.execute(
        select(PhoneVerificationOtp)
        .where(
            PhoneVerificationOtp.user_id == user_id,
            PhoneVerificationOtp.verified_at.is_(None),
            PhoneVerificationOtp.expires_at > now,
        )
        .order_by(PhoneVerificationOtp.created_at.desc())
    )
    return list(result.scalars().all())


async def increment_attempts(
    otp_id: int,
    db: AsyncSession,
) -> PhoneVerificationOtp | None:
    otp = await db.get(PhoneVerificationOtp, otp_id)
    if otp is None:
        return None

    otp.attempts += 1
    await db.flush()
    return otp


async def mark_verified(
    otp_id: int,
    db: AsyncSession,
) -> PhoneVerificationOtp | None:
    otp = await db.get(PhoneVerificationOtp, otp_id)
    if otp is None:
        return None

    otp.verified_at = utc_now()
    await db.flush()
    return otp


async def expire_pending_for_phone(
    user_id: int,
    phone: str,
    db: AsyncSession,
) -> int:
    now = utc_now()
    result = await db.execute(
        update(PhoneVerificationOtp)
        .where(
            PhoneVerificationOtp.user_id == user_id,
            PhoneVerificationOtp.phone == phone,
            PhoneVerificationOtp.verified_at.is_(None),
            PhoneVerificationOtp.expires_at > now,
        )
        .values(expires_at=now)
    )
    await db.flush()
    return result.rowcount or 0


async def delete_expired_otps(
    db: AsyncSession,
    now: datetime | None = None,
) -> int:
    now = now or utc_now()
    result = await db.execute(
        delete(PhoneVerificationOtp).where(PhoneVerificationOtp.expires_at <= now)
    )
    await db.flush()
    return result.rowcount or 0
