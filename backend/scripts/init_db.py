from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

from sqlalchemy import text


BACKEND_DIR = Path(__file__).resolve().parents[1]
APP_DIR = BACKEND_DIR / "app"

for path in (BACKEND_DIR, APP_DIR):
    path_text = str(path)
    if path_text not in sys.path:
        sys.path.insert(0, path_text)

from core.database import engine
from models.base import Base

# Import models so their tables are registered on Base.metadata.
import models.email_verifycation_token  # noqa: F401,E402
import models.password_reset_token  # noqa: F401,E402
import models.phone_verifycation_otp  # noqa: F401,E402
import models.user  # noqa: F401,E402
import models.user_role  # noqa: F401,E402
import models.user_session  # noqa: F401,E402


async def reset_database(connection) -> None:
    result = await connection.execute(
        text(
            "SELECT table_name "
            "FROM information_schema.tables "
            "WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'"
        )
    )
    table_names = [row[0] for row in result]

    if not table_names:
        return

    await connection.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
    try:
        for table_name in table_names:
            escaped_name = table_name.replace("`", "``")
            await connection.execute(text(f"DROP TABLE IF EXISTS `{escaped_name}`"))
    finally:
        await connection.execute(text("SET FOREIGN_KEY_CHECKS = 1"))


async def main() -> None:
    async with engine.begin() as connection:
        if os.getenv("RESET_DB_ON_START", "false").lower() in {"1", "true", "yes"}:
            await reset_database(connection)
        await connection.run_sync(Base.metadata.create_all)

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
