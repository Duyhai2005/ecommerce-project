from __future__ import annotations

from datetime import datetime

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.auth import EmailVerificationToken
from src.models.base import utc_now


async def create_token(
    user_id: int,
    token_hash: str,
    expires_at: datetime,
    db: AsyncSession,
) -> EmailVerificationToken:
    token = EmailVerificationToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    db.add(token)
    await db.flush()
    return token


async def get_by_id(
    token_id: int,
    db: AsyncSession,
) -> EmailVerificationToken | None:
    return await db.get(EmailVerificationToken, token_id)


async def get_by_token_hash(
    token_hash: str,
    db: AsyncSession,
) -> EmailVerificationToken | None:
    result = await db.execute(
        select(EmailVerificationToken).where(
            EmailVerificationToken.token_hash == token_hash,
        )
    )
    return result.scalar_one_or_none()


async def get_valid_by_token_hash(
    token_hash: str,
    db: AsyncSession,
    now: datetime | None = None,
) -> EmailVerificationToken | None:
    now = now or utc_now()
    result = await db.execute(
        select(EmailVerificationToken).where(
            EmailVerificationToken.token_hash == token_hash,
            EmailVerificationToken.verified_at.is_(None),
            EmailVerificationToken.expires_at > now,
        )
    )
    return result.scalar_one_or_none()


async def get_latest_pending_by_user(
    user_id: int,
    db: AsyncSession,
    now: datetime | None = None,
) -> EmailVerificationToken | None:
    now = now or utc_now()
    result = await db.execute(
        select(EmailVerificationToken)
        .where(
            EmailVerificationToken.user_id == user_id,
            EmailVerificationToken.verified_at.is_(None),
            EmailVerificationToken.expires_at > now,
        )
        .order_by(EmailVerificationToken.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def mark_verified(
    token_id: int,
    db: AsyncSession,
) -> EmailVerificationToken | None:
    token = await db.get(EmailVerificationToken, token_id)
    if token is None:
        return None

    token.verified_at = utc_now()
    await db.flush()
    return token


async def delete_tokens_for_user(
    user_id: int,
    db: AsyncSession,
) -> int:
    result = await db.execute(
        delete(EmailVerificationToken).where(
            EmailVerificationToken.user_id == user_id,
        )
    )
    await db.flush()
    return result.rowcount or 0


async def delete_expired_tokens(
    db: AsyncSession,
    now: datetime | None = None,
) -> int:
    now = now or utc_now()
    result = await db.execute(
        delete(EmailVerificationToken).where(
            EmailVerificationToken.expires_at <= now,
        )
    )
    await db.flush()
    return result.rowcount or 0
