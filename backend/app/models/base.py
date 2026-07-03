from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy.orm import DeclarativeBase


def utc_now() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def new_public_id() -> str:
    return str(uuid4())


class Base(DeclarativeBase):
    pass
