from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.dialects import mysql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, utc_now


class ViolationReport(Base):
    __tablename__ = "violation_reports"

    __table_args__ = (
        UniqueConstraint(
            "reporter_id",
            "product_id",
            name="uq_violation_reports_reporter_product",
        ),
        Index("ix_violation_reports_product_id", "product_id"),
        Index("ix_violation_reports_status", "status"),
        Index("ix_violation_reports_created_at", "created_at"),
    )

    id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        primary_key=True,
        autoincrement=True,
    )
    reporter_id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        ForeignKey("users.id"),
        nullable=False,
    )
    product_id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        ForeignKey("products.id"),
        nullable=False,
    )
    reason_type: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=utc_now,
    )

    reporter: Mapped["User"] = relationship()
    product: Mapped["Product"] = relationship(back_populates="violation_reports")
    images: Mapped[list["ViolationReportImage"]] = relationship(
        back_populates="report",
        cascade="all, delete-orphan",
    )
    moderation_logs: Mapped[list["ModerationLog"]] = relationship(
        back_populates="report",
    )


class ViolationReportImage(Base):
    __tablename__ = "violation_report_images"

    __table_args__ = (
        Index("ix_violation_report_images_report_id", "report_id"),
    )

    id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        primary_key=True,
        autoincrement=True,
    )
    report_id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        ForeignKey("violation_reports.id"),
        nullable=False,
    )
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=utc_now,
    )

    report: Mapped[ViolationReport] = relationship(back_populates="images")


class ModerationLog(Base):
    __tablename__ = "moderation_logs"

    __table_args__ = (
        Index("ix_moderation_logs_report_id", "report_id"),
        Index("ix_moderation_logs_product_id", "product_id"),
        Index("ix_moderation_logs_seller_id", "seller_id"),
        Index("ix_moderation_logs_action", "action"),
        Index("ix_moderation_logs_created_at", "created_at"),
    )

    id: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        primary_key=True,
        autoincrement=True,
    )
    report_id: Mapped[int | None] = mapped_column(
        mysql.BIGINT(unsigned=True),
        ForeignKey("violation_reports.id"),
        nullable=True,
    )
    product_id: Mapped[int | None] = mapped_column(
        mysql.BIGINT(unsigned=True),
        ForeignKey("products.id"),
        nullable=True,
    )
    seller_id: Mapped[int | None] = mapped_column(
        mysql.BIGINT(unsigned=True),
        ForeignKey("seller_profiles.id"),
        nullable=True,
    )
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    note: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=utc_now,
    )

    report: Mapped[ViolationReport | None] = relationship(back_populates="moderation_logs")
    product: Mapped["Product | None"] = relationship()
    seller: Mapped["SellerProfile | None"] = relationship()
