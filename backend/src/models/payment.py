from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import CHAR, DateTime, ForeignKey, Index, JSON, Numeric, String
from sqlalchemy.dialects import mysql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, new_public_id, utc_now


class Payment(Base):
    __tablename__ = "payments"

    __table_args__ = (
        Index("ix_payments_user_id", "user_id"),
        Index("ix_payments_payment_status", "payment_status"),
        Index("ix_payments_payment_method", "payment_method"),
        Index("ix_payments_created_at", "created_at"),
    )

    id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        primary_key=True,
        autoincrement=True,
    )
    public_id: Mapped[str] = mapped_column(
        CHAR(36),
        unique=True,
        nullable=False,
        default=new_public_id,
    )
    payment_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    user_id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        ForeignKey("users.id"),
        nullable=False,
    )
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False)
    payment_gateway: Mapped[str | None] = mapped_column(String(50), nullable=True)
    payment_status: Mapped[str] = mapped_column(String(30), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    transaction_code: Mapped[str | None] = mapped_column(
        String(100),
        unique=True,
        nullable=True,
    )
    gateway_response: Mapped[dict[str, Any] | None] = mapped_column(
        JSON,
        nullable=True,
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    failed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
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

    user: Mapped["User"] = relationship()
    order_links: Mapped[list["PaymentOrder"]] = relationship(
        back_populates="payment",
        cascade="all, delete-orphan",
    )
    refunds: Mapped[list["Refund"]] = relationship(back_populates="payment")


class PaymentOrder(Base):
    __tablename__ = "payment_orders"

    __table_args__ = (Index("ix_payment_orders_order_id", "order_id"),)

    payment_id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        ForeignKey("payments.id"),
        primary_key=True,
    )
    order_id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        ForeignKey("orders.id"),
        primary_key=True,
        unique=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=utc_now,
    )

    payment: Mapped[Payment] = relationship(back_populates="order_links")
    order: Mapped["Order"] = relationship(back_populates="payment_link")


class Refund(Base):
    __tablename__ = "refunds"

    __table_args__ = (
        Index("ix_refunds_payment_id", "payment_id"),
        Index("ix_refunds_order_id", "order_id"),
        Index("ix_refunds_refund_status", "refund_status"),
    )

    id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        primary_key=True,
        autoincrement=True,
    )
    payment_id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        ForeignKey("payments.id"),
        nullable=False,
    )
    order_id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        ForeignKey("orders.id"),
        nullable=False,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    reason: Mapped[str] = mapped_column(String(500), nullable=False)
    refund_status: Mapped[str] = mapped_column(String(30), nullable=False)
    gateway_response: Mapped[dict[str, Any] | None] = mapped_column(
        JSON,
        nullable=True,
    )
    refunded_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=utc_now,
    )

    payment: Mapped[Payment] = relationship(back_populates="refunds")
    order: Mapped["Order"] = relationship(back_populates="refunds")


class SellerPayout(Base):
    __tablename__ = "seller_payouts"

    __table_args__ = (
        Index("ix_seller_payouts_seller_id", "seller_id"),
        Index("ix_seller_payouts_payout_status", "payout_status"),
        Index("ix_seller_payouts_created_at", "created_at"),
    )

    id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        primary_key=True,
        autoincrement=True,
    )
    seller_id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        ForeignKey("seller_profiles.id"),
        nullable=False,
    )
    order_id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        ForeignKey("orders.id"),
        unique=True,
        nullable=False,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    payout_status: Mapped[str] = mapped_column(String(30), nullable=False)
    bank_account_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    bank_account_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    bank_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
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

    seller: Mapped["SellerProfile"] = relationship()
    order: Mapped["Order"] = relationship(back_populates="seller_payout")
