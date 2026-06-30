from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    CHAR,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    text,
)
from sqlalchemy.dialects import mysql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, new_public_id, utc_now


class Order(Base):
    __tablename__ = "orders"

    __table_args__ = (
        Index("ix_orders_user_id", "user_id"),
        Index("ix_orders_seller_id", "seller_id"),
        Index("ix_orders_order_status", "order_status"),
        Index("ix_orders_payment_status", "payment_status"),
        Index("ix_orders_created_at", "created_at"),
        Index("ix_orders_payment_expires_at", "payment_expires_at"),
        Index("ix_orders_seller_confirm_expires_at", "seller_confirm_expires_at"),
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
    order_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    user_id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        ForeignKey("users.id"),
        nullable=False,
    )
    seller_id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        ForeignKey("seller_profiles.id"),
        nullable=False,
    )
    order_status: Mapped[str] = mapped_column(String(30), nullable=False)
    payment_status: Mapped[str] = mapped_column(String(30), nullable=False)
    seller_confirmed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("0"),
    )
    seller_confirmed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )
    subtotal_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    shipping_fee: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
        server_default=text("0.00"),
    )
    product_discount_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
        server_default=text("0.00"),
    )
    shipping_discount_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
        server_default=text("0.00"),
    )
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    customer_note: Mapped[str | None] = mapped_column(String(500), nullable=True)
    payment_expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    seller_confirm_expires_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
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
    seller: Mapped["SellerProfile"] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
    )
    shipment: Mapped["Shipment | None"] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
        uselist=False,
    )
    status_logs: Mapped[list["OrderStatusLog"]] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
    )
    cancellation: Mapped["OrderCancellation | None"] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
        uselist=False,
    )
    payment_link: Mapped["PaymentOrder | None"] = relationship(
        back_populates="order",
        uselist=False,
    )
    refunds: Mapped[list["Refund"]] = relationship(back_populates="order")
    seller_payout: Mapped["SellerPayout | None"] = relationship(
        back_populates="order",
        uselist=False,
    )
    coupon_usages: Mapped[list["CouponUsage"]] = relationship(back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"

    __table_args__ = (
        Index("ix_order_items_order_id", "order_id"),
        Index("ix_order_items_product_id", "product_id"),
        Index("ix_order_items_variant_id", "variant_id"),
    )

    id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        primary_key=True,
        autoincrement=True,
    )
    order_id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        ForeignKey("orders.id"),
        nullable=False,
    )
    product_id: Mapped[int | None] = mapped_column(
        mysql.BIGINT(unsigned=True),
        ForeignKey("products.id"),
        nullable=True,
    )
    variant_id: Mapped[int | None] = mapped_column(
        mysql.BIGINT(unsigned=True),
        ForeignKey("product_variants.id"),
        nullable=True,
    )
    product_name_snapshot: Mapped[str] = mapped_column(String(255), nullable=False)
    variant_name_snapshot: Mapped[str] = mapped_column(String(150), nullable=False)
    product_image_snapshot: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )
    seller_name_snapshot: Mapped[str] = mapped_column(String(150), nullable=False)
    sku_snapshot: Mapped[str | None] = mapped_column(String(100), nullable=True)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(mysql.INTEGER(unsigned=True), nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=utc_now,
    )

    order: Mapped[Order] = relationship(back_populates="items")
    product: Mapped["Product | None"] = relationship(back_populates="order_items")
    variant: Mapped["ProductVariant | None"] = relationship(
        back_populates="order_items",
    )
    review: Mapped["ProductReview | None"] = relationship(
        back_populates="order_item",
        uselist=False,
    )


class Shipment(Base):
    __tablename__ = "shipments"

    id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        primary_key=True,
        autoincrement=True,
    )
    order_id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        ForeignKey("orders.id"),
        unique=True,
        nullable=False,
    )
    shipping_provider_name: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )
    receiver_name: Mapped[str] = mapped_column(String(150), nullable=False)
    receiver_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    province: Mapped[str] = mapped_column(String(100), nullable=False)
    district: Mapped[str] = mapped_column(String(100), nullable=False)
    ward: Mapped[str] = mapped_column(String(100), nullable=False)
    detail_address: Mapped[str] = mapped_column(String(255), nullable=False)
    address_type: Mapped[str] = mapped_column(String(30), nullable=False)
    shipped_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    failed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    order: Mapped[Order] = relationship(back_populates="shipment")


class OrderStatusLog(Base):
    __tablename__ = "order_status_logs"

    __table_args__ = (
        Index("ix_order_status_logs_order_id", "order_id"),
        Index("ix_order_status_logs_new_status", "new_status"),
        Index("ix_order_status_logs_created_at", "created_at"),
    )

    id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        primary_key=True,
        autoincrement=True,
    )
    order_id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        ForeignKey("orders.id"),
        nullable=False,
    )
    old_status: Mapped[str | None] = mapped_column(String(30), nullable=True)
    new_status: Mapped[str] = mapped_column(String(30), nullable=False)
    note: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=utc_now,
    )

    order: Mapped[Order] = relationship(back_populates="status_logs")


class OrderCancellation(Base):
    __tablename__ = "order_cancellations"

    id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        primary_key=True,
        autoincrement=True,
    )
    order_id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        ForeignKey("orders.id"),
        unique=True,
        nullable=False,
    )
    cancelled_by_user_id: Mapped[int | None] = mapped_column(
        mysql.BIGINT(unsigned=True),
        ForeignKey("users.id"),
        nullable=True,
    )
    cancelled_by_type: Mapped[str] = mapped_column(String(30), nullable=False)
    reason: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=utc_now,
    )

    order: Mapped[Order] = relationship(back_populates="cancellation")
    cancelled_by: Mapped["User | None"] = relationship()
