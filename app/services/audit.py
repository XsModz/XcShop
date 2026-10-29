from __future__ import annotations


def available_stock(stock_count: int | None) -> int:
    return max(0, int(stock_count or 0))


def can_sell_product(stock_count: int | None) -> bool:
    return available_stock(stock_count) > 0


__all__ = ["available_stock", "can_sell_product"]


