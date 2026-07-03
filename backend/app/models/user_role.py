from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import (
    Boolean,
    CHAR,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    String,
    text,
)
from sqlalchemy.dialects import mysql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, utc_now

if TYPE_CHECKING:
    from models.user import User


class UserRole(Base):
    __tablename__ = "user_roles"

    __table_args__ = (
        CheckConstraint(
            "role_name IN ('CUSTOMER', 'SELLER', 'ADMIN', 'SUPPORTER')",
            name="ck_user_roles_role_name",
        ),
        Index("ix_user_roles_role_name", "role_name"),
    )

    user_id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        ForeignKey("users.id"),
        primary_key=True,
    )
    role_name: Mapped[str] = mapped_column(String(50), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=utc_now,
    )

    user: Mapped[User] = relationship(back_populates="roles")
