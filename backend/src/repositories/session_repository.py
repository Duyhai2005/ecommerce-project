from __future__ import annotations

from datetime import datetime

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.auth import UserSession
from src.models.base import utc_now


async def create_session(
    user_id: int,
    refresh_token_hash: str,
    expires_at: datetime,
    db: AsyncSession,
    device_name: str | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> UserSession:
    session = UserSession(
        user_id=user_id,
        refresh_token_hash=refresh_token_hash,
        device_name=device_name,
        ip_address=ip_address,
        user_agent=user_agent,
        expires_at=expires_at,
    )
    db.add(session)
    await db.flush()
    return session


async def get_by_id(session_id: int, db: AsyncSession) -> UserSession | None:
    return await db.get(UserSession, session_id)


async def get_by_refresh_token_hash(
    refresh_token_hash: str,
    db: AsyncSession,
) -> UserSession | None:
    result = await db.execute(
        select(UserSession).where(
            UserSession.refresh_token_hash == refresh_token_hash,
        )
    )
    return result.scalar_one_or_none()


async def get_active_by_refresh_token_hash(
    refresh_token_hash: str,
    db: AsyncSession,
    now: datetime | None = None,
) -> UserSession | None:
    now = now or utc_now()
    result = await db.execute(
        select(UserSession).where(
            UserSession.refresh_token_hash == refresh_token_hash,
            UserSession.is_active.is_(True),
            UserSession.revoked_at.is_(None),
            UserSession.expires_at > now,
        )
    )
    return result.scalar_one_or_none()


async def list_active_by_user(
    user_id: int,
    db: AsyncSession,
    now: datetime | None = None,
) -> list[UserSession]:
    now = now or utc_now()
    result = await db.execute(
        select(UserSession)
        .where(
            UserSession.user_id == user_id,
            UserSession.is_active.is_(True),
            UserSession.revoked_at.is_(None),
            UserSession.expires_at > now,
        )
        .order_by(UserSession.created_at.desc())
    )
    return list(result.scalars().all())


async def touch_session(
    session_id: int,
    db: AsyncSession,
) -> UserSession | None:
    session = await db.get(UserSession, session_id)
    if session is None:
        return None

    session.last_used_at = utc_now()
    await db.flush()
    return session


async def rotate_refresh_token(
    session_id: int,
    refresh_token_hash: str,
    expires_at: datetime,
    db: AsyncSession,
) -> UserSession | None:
    session = await db.get(UserSession, session_id)
    if session is None:
        return None

    session.refresh_token_hash = refresh_token_hash
    session.expires_at = expires_at
    session.last_used_at = utc_now()
    await db.flush()
    return session


async def revoke_session(
    session_id: int,
    db: AsyncSession,
    reason: str | None = None,
) -> UserSession | None:
    session = await db.get(UserSession, session_id)
    if session is None:
        return None

    session.is_active = False
    session.revoked_at = utc_now()
    session.revoke_reason = reason
    await db.flush()
    return session


async def revoke_by_refresh_token_hash(
    refresh_token_hash: str,
    db: AsyncSession,
    reason: str | None = None,
) -> UserSession | None:
    session = await get_by_refresh_token_hash(refresh_token_hash, db)
    if session is None:
        return None

    session.is_active = False
    session.revoked_at = utc_now()
    session.revoke_reason = reason
    await db.flush()
    return session


async def revoke_all_for_user(
    user_id: int,
    db: AsyncSession,
    reason: str | None = None,
    except_session_id: int | None = None,
) -> int:
    revoked_at = utc_now()
    statement = (
        update(UserSession)
        .where(
            UserSession.user_id == user_id,
            UserSession.is_active.is_(True),
            UserSession.revoked_at.is_(None),
        )
        .values(
            is_active=False,
            revoked_at=revoked_at,
            revoke_reason=reason,
        )
    )

    if except_session_id is not None:
        statement = statement.where(UserSession.id != except_session_id)

    result = await db.execute(statement)
    await db.flush()
    return result.rowcount or 0


async def delete_expired_sessions(
    db: AsyncSession,
    now: datetime | None = None,
) -> int:
    now = now or utc_now()
    result = await db.execute(
        delete(UserSession).where(UserSession.expires_at <= now)
    )
    await db.flush()
    return result.rowcount or 0
