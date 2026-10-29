from __future__ import annotations

from app.config import normalize_username


def reseller_contact_url(username: str | None) -> str:
    normalized = normalize_username(username)
    return f"https://t.me/{normalized}"


def reseller_summary(user_id: int, username: str | None, is_approved: bool = True) -> dict:
    return {
        "user_id": user_id,
        "username": normalize_username(username) if username else None,
        "is_approved": is_approved,
        "contact_url": reseller_contact_url(username) if username else None,
    }


__all__ = ["reseller_contact_url", "reseller_summary"]


