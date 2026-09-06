"""Create (or update) an admin user.

Usage:
    python -m scripts.create_admin --email admin@duo-cone.com --password 's3cret!!'
    # or rely on env: BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD
"""

from __future__ import annotations

import argparse
import asyncio
import getpass
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.config.settings import get_settings  # noqa: E402
from app.db.bootstrap import ensure_admin_user  # noqa: E402
from app.db.session import Base, SessionLocal, engine  # noqa: E402
from app.models import catalog as _catalog  # noqa: E402,F401
from app.models import commerce as _commerce  # noqa: E402,F401


async def main() -> None:
    settings = get_settings()
    parser = argparse.ArgumentParser(description="Create or update an admin user")
    parser.add_argument("--email", default=settings.bootstrap_admin_email or None)
    parser.add_argument("--password", default=settings.bootstrap_admin_password or None)
    args = parser.parse_args()

    email = args.email or input("Admin email: ").strip()
    password = args.password or getpass.getpass("Admin password: ")
    if not email or not password:
        parser.error("email and password are required")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with SessionLocal() as db:
        user = await ensure_admin_user(db, email, password)
    print(f"OK — admin ready: {user.email} (id={user.id})")


if __name__ == "__main__":
    asyncio.run(main())
