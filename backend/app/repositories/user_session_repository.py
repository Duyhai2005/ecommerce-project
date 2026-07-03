from datetime import datetime

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.user_session import UserSession


async def create_session(payload: dict, db: AsyncSession):
    session = UserSession(**payload)
    db.add(session)
    await db.flush()
    return session


async def get_session_by_refresh_token_hash(
    refresh_token_hash: str, db: AsyncSession
) -> UserSession:
    result = await db.execute(
        select(UserSession).where(UserSession.refresh_token_hash == refresh_token_hash)
    )
    return result.scalar_one_or_none()


async def revoke_session(
    session_id: int, revoked_at: datetime, revoke_reason: str, db: AsyncSession
):
    session = await db.get(UserSession, session_id)

    session.is_active = False
    session.revoked_at = revoked_at
    session.revoke_reason = revoke_reason
    await db.flush()
    return session
