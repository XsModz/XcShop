from __future__ import annotations

from datetime import datetime, timezone


def coupon_is_valid(coupon: dict, user_id: int | None = None) -> bool:
    if not coupon.get("enabled", False):
        return False
    expires_at = coupon.get("expires_at")
    if expires_at and expires_at < datetime.now(timezone.utc):
        return False
    if not user_id:
        return True
    usage_count = coupon.get("usage_count", 0)
    per_user_limit = coupon.get("per_user_limit", 1)
    user_usage = coupon.get("user_usage", {}).get(str(user_id), 0)
    return usage_count < coupon.get("max_uses", 1) and user_usage < per_user_limit


def redeem_coupon(coupon: dict, user_id: int) -> dict:
    if not coupon_is_valid(coupon, user_id):
        raise ValueError("coupon not valid for this user")
    coupon.setdefault("usage_count", 0)
    coupon.setdefault("user_usage", {})
    coupon["usage_count"] += 1
    coupon["user_usage"][str(user_id)] = coupon["user_usage"].get(str(user_id), 0) + 1
    coupon["last_redeemed_by"] = user_id
    coupon["last_redeemed_at"] = datetime.now(timezone.utc)
    return coupon


__all__ = ["coupon_is_valid", "redeem_coupon"]


