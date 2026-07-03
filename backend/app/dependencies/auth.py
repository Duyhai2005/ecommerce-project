from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models.user import User
from repositories import user_repositoriy
from services import jwt_service


async def get_current_user(
    request: Request, db: Annotated[AsyncSession, Depends(get_db)]
) -> User:
    payload = getattr(request.state, "auth_payload", None)

    if payload is None:
        token = request.cookies.get("access_token")
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Bạn cần đăng nhập để thực hiện hành động này.",
            )
        payload = jwt_service.decode_jwt_token(token)

    user = await user_repositoriy.get_user_by_public_id(payload["sub"], db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Người dùng không tồn tại."
        )

    if user.status == "DELETED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Người dùng đã bị khoá."
        )

    request.state.current_user = user
    return user
