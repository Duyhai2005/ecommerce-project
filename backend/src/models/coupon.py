from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Index, Numeric, String, UniqueConstraint, text
from sqlalchemy.dialects import mysql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, utc_now


class Coupon(Base):
    __tablename__ = "coupons"

    __table_args__ = (
        Index("ix_coupons_coupon_type", "coupon_type"),
        Index("ix_coupons_status", "status"),
        Index("ix_coupons_start_at", "start_at"),
        Index("ix_coupons_end_at", "end_at"),
    )

    id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        primary_key=True,
        autoincrement=True,
    )
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    coupon_type: Mapped[str] = mapped_column(String(30), nullable=False)
    discount_type: Mapped[str] = mapped_column(String(30), nullable=False)
    discount_value: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    max_discount_amount: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )
    min_order_amount: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )
    usage_limit: Mapped[int] = mapped_column(
        mysql.INTEGER(unsigned=True),
        nullable=False,
    )
    used_count: Mapped[int] = mapped_column(
        mysql.INTEGER(unsigned=True),
        nullable=False,
        default=0,
        server_default=text("0"),
    )
    start_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=utc_now,
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
        onupdate=utc_now,
    )

    usages: Mapped[list["CouponUsage"]] = relationship(
        back_populates="coupon",
        cascade="all, delete-orphan",
    )


class CouponUsage(Base):
    __tablename__ = "coupon_usages"

    __table_args__ = (
        UniqueConstraint("user_id", "coupon_id", name="uq_coupon_usages_user_coupon"),
        UniqueConstraint(
            "order_id",
            "coupon_type_snapshot",
            name="uq_coupon_usages_order_coupon_type",
        ),
        Index("ix_coupon_usages_order_id", "order_id"),
        Index("ix_coupon_usages_coupon_id", "coupon_id"),
    )

    id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        primary_key=True,
        autoincrement=True,
    )
    coupon_id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        ForeignKey("coupons.id"),
        nullable=False,
    )
    user_id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        ForeignKey("users.id"),
        nullable=False,
    )
    order_id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        ForeignKey("orders.id"),
        nullable=False,
    )
    coupon_type_snapshot: Mapped[str] = mapped_column(String(30), nullable=False)
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    used_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utc_now)

    coupon: Mapped[Coupon] = relationship(back_populates="usages")
    user: Mapped["User"] = relationship()
    order: Mapped["Order"] = relationship(back_populates="coupon_usages")
