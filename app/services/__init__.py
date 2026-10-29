from __future__ import annotations

from datetime import datetime, timezone


def audit_action(actor_id: int | None, action: str, entity_type: str | None = None, entity_id: int | None = None, details: str | None = None) -> dict:
    return {
        "actor_id": actor_id,
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "details": details,
        "created_at": datetime.now(timezone.utc),
    }


__all__ = ["audit_action"]


