from __future__ import annotations

from fastapi import FastAPI, Header, HTTPException, Request
from aiogram import Bot, Dispatcher
from aiogram.types import Update

from app.config import Settings, get_settings
from handlers import register_routers

_settings = get_settings()

bot = Bot(token=_settings.bot_token, default=[])  # aiogram accepts token only
dispatcher = Dispatcher()
register_routers(dispatcher)

app = FastAPI(title="XcShop")


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "XcShop"}


@app.post("/api/webhook")
async def webhook(
    request: Request,
    secret_token: str | None = Header(default=None, alias="X-Telegram-Bot-Api-Secret-Token"),
) -> dict[str, str]:
    if not secret_token or secret_token != _settings.webhook_secret:
        raise HTTPException(status_code=401, detail="unauthorized")

    try:
        payload = await request.json()
    except Exception as exc:  # pragma: no cover - malformed input handling
        raise HTTPException(status_code=400, detail="malformed JSON") from exc

    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="malformed update")

    try:
        update = Update(**payload)
    except Exception as exc:  # pragma: no cover - malformed update data
        raise HTTPException(status_code=400, detail="invalid Telegram update") from exc

    await dispatcher.feed_update(bot, update)
    return {"status": "accepted"}
