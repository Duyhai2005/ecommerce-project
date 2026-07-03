from datetime import datetime

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.user import User
from models.user_role import UserRole


async def get_user_by_email(email: str, db: AsyncSession) -> User:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_phone(phone: str, db: AsyncSession) -> User:
    result = await db.execute(select(User).where(User.phone == phone))
    return result.scalar_one_or_none()


async def get_user_by_username(username: str, db: AsyncSession) -> User:
    result = await db.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()


async def get_user_by_public_id(public_id: str, db: AsyncSession) -> User:
    result = await db.execute(select(User).where(User.public_id == public_id))
    return result.scalar_one_or_none()

async def get_user_by_id(id: int, db: AsyncSession) -> User:
    result = await db.execute(select(User).where(User.id == id))
    return result.scalar_one_or_none()


async def create_user(
    data: dict, db: AsyncSession, roles: list[str] | None = None
) -> User:
    user = User(**data)
    db.add(user)
    await db.flush()

    if roles is not None:
        for role in roles:
            db.add(UserRole(user_id=user.id, role_name=role))
        await db.flush()

    return user


async def set_email_verified_at(user_id: int, time: datetime, db: AsyncSession):
    user = await db.get(User, user_id)
    user.email_verified_at = time
    await db.flush()


async def set_phone_verified_at(user_id: int, time: datetime, db: AsyncSession):
    user = await db.get(User, user_id)
    user.phone_verified_at = time
    await db.flush()
