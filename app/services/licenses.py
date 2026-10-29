from __future__ import annotations

from typing import Any


def can_deliver_product(product: dict[str, Any] | None, user_id: int | None = None, user_has_access: bool = False) -> bool:
    if product is None:
        return False
    if product.get("enabled") is False:
        return False
    if product.get("is_vip"):
        return bool(user_has_access)
    return True


def product_delivery_url(username: str | None) -> str:
    if not username:
        raise ValueError("username is required")
    safe = username.strip().lstrip("@")
    if len(safe) < 5:
        raise ValueError("invalid username")
    return f"https://t.me/{safe}"


__all__ = ["can_deliver_product", "product_delivery_url"]


