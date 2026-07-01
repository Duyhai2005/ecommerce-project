from __future__ import annotations

from datetime import datetime

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.auth import PasswordResetToken
from src.models.base import utc_now


async def create_token(
    user_id: int,
    token_hash: str,
    expires_at: datetime,
    db: AsyncSession,
) -> PasswordResetToken:
    token = PasswordResetToken(
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
) -> PasswordResetToken | None:
    return await db.get(PasswordResetToken, token_id)


async def get_by_token_hash(
    token_hash: str,
    db: AsyncSession,
) -> PasswordResetToken | None:
    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash,
        )
    )
    return result.scalar_one_or_none()


async def get_valid_by_token_hash(
    token_hash: str,
    db: AsyncSession,
    now: datetime | None = None,
) -> PasswordResetToken | None:
    now = now or utc_now()
    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used_at.is_(None),
            PasswordResetToken.revoked_at.is_(None),
            PasswordResetToken.expires_at > now,
        )
    )
    return result.scalar_one_or_none()


async def mark_used(
    token_id: int,
    db: AsyncSession,
) -> PasswordResetToken | None:
    token = await db.get(PasswordResetToken, token_id)
    if token is None:
        return None

    token.used_at = utc_now()
    await db.flush()
    return token


async def revoke_token(
    token_id: int,
    db: AsyncSession,
) -> PasswordResetToken | None:
    token = await db.get(PasswordResetToken, token_id)
    if token is None:
        return None

    token.revoked_at = utc_now()
    await db.flush()
    return token


async def revoke_all_for_user(
    user_id: int,
    db: AsyncSession,
) -> int:
    result = await db.execute(
        update(PasswordResetToken)
        .where(
            PasswordResetToken.user_id == user_id,
            PasswordResetToken.used_at.is_(None),
            PasswordResetToken.revoked_at.is_(None),
        )
        .values(revoked_at=utc_now())
    )
    await db.flush()
    return result.rowcount or 0


async def delete_expired_tokens(
    db: AsyncSession,
    now: datetime | None = None,
) -> int:
    now = now or utc_now()
    result = await db.execute(
        delete(PasswordResetToken).where(PasswordResetToken.expires_at <= now)
    )
    await db.flush()
    return result.rowcount or 0
