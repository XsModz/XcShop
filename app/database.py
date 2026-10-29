from __future__ import annotations

import os
from functools import lru_cache
from typing import Any

from pydantic import AnyUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def normalize_username(value: str | None) -> str:
    if value is None:
        raise ValueError("username is required")
    username = value.strip().lstrip("@")
    if not username:
        raise ValueError("username cannot be empty")
    if len(username) < 5 or len(username) > 32:
        raise ValueError("username length must be 5-32 characters")
    if not username.replace("_", "").isalnum():
        raise ValueError("username contains invalid characters")
    return username


def validate_username(value: str | None) -> str:
    return normalize_username(value)


def build_telegram_profile_url(username: str | None) -> str:
    normalized = validate_username(username)
    return f"https://t.me/{normalized}"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    bot_token: str
    admin_id: int
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/xcshop"
    webhook_secret: str
    base_url: AnyUrl
    storage_chat_id: int
    support_username: str = "XsBest07"
    super_admin_id: int | None = None
    multi_instance: bool = False

    @field_validator("support_username")
    @classmethod
    def validate_support_username(cls, value: str) -> str:
        return validate_username(value)

    @field_validator("webhook_secret")
    @classmethod
    def validate_webhook_secret(cls, value: str) -> str:
        if not value or len(value) < 8:
            raise ValueError("WEBHOOK_SECRET must be at least 8 characters")
        return value

    @field_validator("admin_id", "storage_chat_id")
    @classmethod
    def validate_positive_int(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("ID values must be positive")
        return value

    @property
    def support_link(self) -> str:
        return build_telegram_profile_url(self.support_username)


@lru_cache
def get_settings() -> Settings:
    return Settings()


__all__ = [
    "Settings",
    "build_telegram_profile_url",
    "get_settings",
    "normalize_username",
    "validate_username",
]


