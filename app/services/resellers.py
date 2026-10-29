from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone


def generate_license_key() -> str:
    return secrets.token_urlsafe(18)


def is_license_valid(expires_at: datetime | None, status: str | None) -> bool:
    if status not in {None, "active", "pending"}:
        return False
    if expires_at is None:
        return True
    return expires_at > datetime.now(timezone.utc)


def redeem_license(license: dict, user_id: int) -> dict:
    if license.get("status") not in {"active", "pending"}:
        raise ValueError("license is not redeemable")
    if license.get("redeemed_by") is not None:
        raise ValueError("license already redeemed")
    if license.get("expired"):
        raise ValueError("license expired")
    license["redeemed_by"] = user_id
    license["redeemed_at"] = datetime.now(timezone.utc)
    license["status"] = "redeemed"
    return license


def create_license(product_id: int | None = None, user_id: int | None = None, ttl_days: int | None = None) -> dict:
    expires_at = None
    if ttl_days:
        expires_at = datetime.now(timezone.utc) + timedelta(days=ttl_days)
    return {
        "id": secrets.randbelow(1000000),
        "key": generate_license_key(),
        "product_id": product_id,
        "user_id": user_id,
        "status": "active",
        "expires_at": expires_at,
        "redeemed_by": None,
        "redeemed_at": None,
        "expired": False,
    }


__all__ = [
    "create_license",
    "generate_license_key",
    "is_license_valid",
    "redeem_license",
]


