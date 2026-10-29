from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings


class Base(DeclarativeBase):
    pass


settings = get_settings()
engine = create_async_engine(settings.database_url, echo=False, future=True)
session_factory = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def check_db() -> bool:
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with session_factory() as session:
        try:
            yield session
        finally:
            await session.close()


__all__ = ["Base", "engine", "session_factory", "init_db", "check_db", "get_db"]


