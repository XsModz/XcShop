from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass
class ProductRecord:
    id: int
    title: str
    description: str = ""
    category: str | None = None
    enabled: bool = True
    is_free: bool = True
    is_vip: bool = False
    version: str | None = None


def list_visible_products(products: list[ProductRecord]) -> list[ProductRecord]:
    return [product for product in products if product.enabled]


def get_product_by_id(products: list[ProductRecord], product_id: int) -> ProductRecord | None:
    for product in products:
        if product.id == product_id:
            return product
    return None


def is_product_available(product: ProductRecord | None) -> bool:
    return bool(product and product.enabled)


def product_summary(product: ProductRecord) -> str:
    tier = "FREE" if product.is_free else "VIP"
    return f"{product.title} ({tier})"


__all__ = [
    "ProductRecord",
    "get_product_by_id",
    "is_product_available",
    "list_visible_products",
    "product_summary",
]


