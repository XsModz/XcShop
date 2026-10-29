from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class OrderRecord:
    id: int
    user_id: int
    product_id: int
    status: str = "created"
    notes: str = ""


def create_order(user_id: int, product_id: int) -> OrderRecord:
    return OrderRecord(id=0, user_id=user_id, product_id=product_id, status="created")


__all__ = ["OrderRecord", "create_order"]


