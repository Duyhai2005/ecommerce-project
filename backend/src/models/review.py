from __future__ import annotations

from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.dialects import mysql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, utc_now


class ProductReview(Base):
    __tablename__ = "product_reviews"

    __table_args__ = (
        CheckConstraint("rating BETWEEN 1 AND 5", name="ck_product_reviews_rating"),
        Index("ix_product_reviews_product_id", "product_id"),
        Index("ix_product_reviews_user_id", "user_id"),
        Index("ix_product_reviews_rating", "rating"),
        Index("ix_product_reviews_created_at", "created_at"),
    )

    id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        primary_key=True,
        autoincrement=True,
    )
    user_id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        ForeignKey("users.id"),
        nullable=False,
    )
    product_id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        ForeignKey("products.id"),
        nullable=False,
    )
    order_item_id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        ForeignKey("order_items.id"),
        unique=True,
        nullable=False,
    )
    rating: Mapped[int] = mapped_column(mysql.TINYINT(unsigned=True), nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=utc_now,
    )

    user: Mapped["User"] = relationship()
    product: Mapped["Product"] = relationship(back_populates="reviews")
    order_item: Mapped["OrderItem"] = relationship(back_populates="review")
    images: Mapped[list["ReviewImage"]] = relationship(
        back_populates="review",
        cascade="all, delete-orphan",
    )


class ReviewImage(Base):
    __tablename__ = "review_images"

    __table_args__ = (Index("ix_review_images_review_id", "review_id"),)

    id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        primary_key=True,
        autoincrement=True,
    )
    review_id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        ForeignKey("product_reviews.id"),
        nullable=False,
    )
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=utc_now,
    )

    review: Mapped[ProductReview] = relationship(back_populates="images")
