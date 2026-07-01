from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.enums import RoleName, UserStatus
from src.models.base import utc_now
from src.models.user import User, UserRole


def _role_value(role_name: str | RoleName) -> str:
    return role_name.value if isinstance(role_name, RoleName) else role_name


async def get_by_id(user_id: int, db: AsyncSession) -> User | None:
    return await db.get(User, user_id)


async def get_by_email(email: str, db: AsyncSession) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_by_phone(phone: str, db: AsyncSession) -> User | None:
    result = await db.execute(select(User).where(User.phone == phone))
    return result.scalar_one_or_none()


async def get_by_public_id(public_id: str, db: AsyncSession) -> User | None:
    result = await db.execute(select(User).where(User.public_id == public_id))
    return result.scalar_one_or_none()


async def get_by_identifier(identifier: str, db: AsyncSession) -> User | None:
    filters = [
        User.email == identifier,
        User.phone == identifier,
        User.public_id == identifier,
    ]

    if identifier.isdigit():
        filters.append(User.id == int(identifier))

    result = await db.execute(select(User).where(or_(*filters)))
    return result.scalar_one_or_none()


async def get_with_roles(user_id: int, db: AsyncSession) -> User | None:
    result = await db.execute(
        select(User)
        .options(selectinload(User.roles))
        .where(User.id == user_id)
    )
    return result.scalar_one_or_none()


async def create_user(
    data: dict[str, Any],
    db: AsyncSession,
    roles: list[str | RoleName] | None = None,
) -> User:
    payload = dict(data)
    role_names = roles if roles is not None else payload.pop("roles", None)

    user = User(**payload)
    db.add(user)
    await db.flush()

    if role_names:
        for role_name in role_names:
            db.add(UserRole(user_id=user.id, role_name=_role_value(role_name)))
        await db.flush()

    return user


async def update_user(
    user_id: int,
    data: dict[str, Any],
    db: AsyncSession,
) -> User | None:
    user = await db.get(User, user_id)
    if user is None:
        return None

    for field, value in data.items():
        if hasattr(user, field):
            setattr(user, field, value)

    await db.flush()
    return user


async def add_role(
    user_id: int,
    role_name: str | RoleName,
    db: AsyncSession,
) -> list[str] | None:
    user = await db.get(User, user_id)
    if user is None:
        return None

    role = _role_value(role_name)
    existing = await db.get(UserRole, {"user_id": user_id, "role_name": role})
    if existing is None:
        db.add(UserRole(user_id=user_id, role_name=role))
        await db.flush()

    return await list_roles(user_id, db)


async def remove_role(
    user_id: int,
    role_name: str | RoleName,
    db: AsyncSession,
) -> list[str] | None:
    user = await db.get(User, user_id)
    if user is None:
        return None

    role = _role_value(role_name)
    user_role = await db.get(UserRole, {"user_id": user_id, "role_name": role})
    if user_role is not None:
        await db.delete(user_role)
        await db.flush()

    return await list_roles(user_id, db)


async def list_roles(user_id: int, db: AsyncSession) -> list[str] | None:
    user = await db.get(User, user_id)
    if user is None:
        return None

    result = await db.execute(
        select(UserRole.role_name)
        .where(UserRole.user_id == user_id)
        .order_by(UserRole.role_name)
    )
    return list(result.scalars().all())


async def set_email_verified(user_id: int, db: AsyncSession) -> datetime | None:
    user = await db.get(User, user_id)
    if user is None:
        return None

    user.email_verified_at = utc_now()
    await db.flush()
    return user.email_verified_at


async def set_phone_verified(user_id: int, db: AsyncSession) -> datetime | None:
    user = await db.get(User, user_id)
    if user is None:
        return None

    user.phone_verified_at = utc_now()
    await db.flush()
    return user.phone_verified_at


async def update_password(
    user_id: int,
    password_hash: str,
    db: AsyncSession,
) -> str | None:
    user = await db.get(User, user_id)
    if user is None:
        return None

    user.password_hash = password_hash
    await db.flush()
    return user.password_hash


async def lock_user(
    user_id: int,
    reason: str,
    locked_until: datetime | None,
    db: AsyncSession,
) -> User | None:
    user = await db.get(User, user_id)
    if user is None:
        return None

    user.status = UserStatus.LOCKED.value
    user.locked_until = locked_until
    user.lock_reason = reason
    await db.flush()
    return user


async def unlock_user(user_id: int, db: AsyncSession) -> User | None:
    user = await db.get(User, user_id)
    if user is None:
        return None

    user.status = UserStatus.ACTIVE.value
    user.locked_until = None
    user.lock_reason = None
    await db.flush()
    return user


async def soft_delete_user(user_id: int, db: AsyncSession) -> User | None:
    user = await db.get(User, user_id)
    if user is None:
        return None

    user.status = UserStatus.DELETED.value
    user.deleted_at = utc_now()
    await db.flush()
    return user
