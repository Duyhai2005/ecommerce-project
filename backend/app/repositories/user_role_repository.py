from datetime import datetime

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.user import User
from models.user_role import UserRole


async def get_role_list_by_user_id(user_id: int, db: AsyncSession) -> list[str]:
    result = await db.execute(
        select(UserRole.role_name)
        .where(UserRole.user_id == user_id)
        .order_by(UserRole.role_name)
    )

    return list(result.scalars().all())
