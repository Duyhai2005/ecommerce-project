from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import CHAR, DateTime, ForeignKey, Index, Numeric, String, Text, text
from sqlalchemy.dialects import mysql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, new_public_id, utc_now


class SellerProfile(Base):
    __tablename__ = "seller_profiles"

    __table_args__ = (
        Index("ix_seller_profiles_status", "status"),
        Index("ix_seller_profiles_created_at", "created_at"),
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
    user_id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        ForeignKey("users.id"),
        unique=True,
        nullable=False,
    )
    shop_name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    shop_slug: Mapped[str] = mapped_column(String(180), unique=True, nullable=False)
    shop_logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    shop_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    pickup_address: Mapped[str] = mapped_column(String(500), nullable=False)
    shipping_fee: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
        server_default=text("0.00"),
    )
    shipping_provider_name: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    rejected_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    total_sold: Mapped[int] = mapped_column(
        mysql.INTEGER(unsigned=True),
        nullable=False,
        default=0,
        server_default=text("0"),
    )
    total_revenue: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        default=Decimal("0.00"),
        server_default=text("0.00"),
    )
    approved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
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

    user: Mapped["User"] = relationship(back_populates="seller_profile")
    documents: Mapped[list["SellerDocument"]] = relationship(
        back_populates="seller",
        cascade="all, delete-orphan",
    )
    category_suggestions: Mapped[list["CategorySuggestion"]] = relationship(
        back_populates="seller",
        cascade="all, delete-orphan",
    )
    products: Mapped[list["Product"]] = relationship(back_populates="seller")
    orders: Mapped[list["Order"]] = relationship(back_populates="seller")


class SellerDocument(Base):
    __tablename__ = "seller_documents"

    __table_args__ = (
        Index("ix_seller_documents_seller_id", "seller_id"),
        Index("ix_seller_documents_status", "status"),
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
    document_type: Mapped[str] = mapped_column(String(50), nullable=False)
    document_url: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=utc_now,
    )

    seller: Mapped[SellerProfile] = relationship(back_populates="documents")
