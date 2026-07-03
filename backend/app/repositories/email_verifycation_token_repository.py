from datetime import UTC, datetime, timedelta

from sqlalchemy import and_, delete, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.email_verifycation_token import EmailVerificationToken


async def delete_email_verifycation_token_by_user_id(user_id: int, db: AsyncSession):
    await db.execute(
        delete(EmailVerificationToken).where(EmailVerificationToken.user_id == user_id)
    )
    await db.flush()


async def get_email_verifycation_by_token_hash(token_hash: str, db: AsyncSession):
    result = await db.execute(
        select(EmailVerificationToken).where(
            EmailVerificationToken.token_hash == token_hash
        )
    )
    return result.scalar_one_or_none()


async def create_email_verifycation(
    user_id: int,
    token_hash: str,
    expires_at: datetime,
    created_at: datetime,
    db: AsyncSession,
):
    now = datetime.now(UTC)

    db.add(
        EmailVerificationToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            created_at=created_at,
        )
    )

    await db.flush()

    return
