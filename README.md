# XcShop

XcShop is a Telegram-first storefront and reseller bot built for Python, FastAPI, SQLAlchemy, and aiogram. It stores persistent records in PostgreSQL and exposes a webhook-based Telegram interface suitable for Vercel serverless deployment.

## Features
- Telegram /start flow and main menu
- Product catalog with free and VIP item visibility checks
- Admin product management and product status toggles
- Product reseller assignment and contact links
- License creation, validation, and redemption
- Coupon creation and redemption with usage limits
- Delivery authorization against product access rules
- Webhook validation with secret token checks
- Safe configuration validation
- No payment integration in this release

## Architecture
This repo contains a modular Python application under `app/` and a FastAPI entrypoint under `api/index.py`.

## Python version
- Python 3.12+

## Dependency installation
```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## PostgreSQL setup
Create a PostgreSQL database and set `DATABASE_URL` to a SQLAlchemy async URL such as:
```bash
postgresql+asyncpg://postgres:postgres@localhost:5432/xcshop
```

## Local development
```bash
cp .env.example .env
python -m pytest -q
```

## Environment variables
Required:
- `BOT_TOKEN`
- `ADMIN_ID`
- `DATABASE_URL`
- `WEBHOOK_SECRET`
- `BASE_URL`
- `STORAGE_CHAT_ID`
- `SUPPORT_USERNAME`

Optional:
- `SUPER_ADMIN_ID` (defaults to `ADMIN_ID`)
- `MULTI_INSTANCE` (set to `true` to enable multi-instance mode)

## GitHub deployment
1. Push the repository to GitHub.
2. Add the environment variables in the Vercel project settings.
3. Import the repo into Vercel.
4. Configure the webhook with `BASE_URL` and `WEBHOOK_SECRET`.

## Vercel deployment
The `api/index.py` FastAPI app is the deployed entrypoint. Ensure the environment variables are set in the Vercel dashboard, then deploy the project.

## Telegram webhook setup
```bash
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
  -d "url=$BASE_URL/api/webhook" \
  -d "secret_token=$WEBHOOK_SECRET"
```

Check the webhook:
```bash
curl "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo"
```

Remove the webhook if needed:
```bash
curl "https://api.telegram.org/bot$BOT_TOKEN/deleteWebhook"
```

## Support username
Set `SUPPORT_USERNAME` to the owner contact username without the leading `@`; the app normalizes an optional leading `@` before constructing the Telegram profile link.

## Reseller setup
Resellers are stored in PostgreSQL and are assigned to specific products. Product details show the `Contact Reseller` button only when a valid reseller username exists.

## Product and file management
Admin users can create, enable, disable, archive, and assign products and resellers from Telegram commands and inline keyboards.

## License management
Licenses are generated with secure randomness, validated in UTC, and redeemed with duplicate-protection checks.

## Tests
```bash
pytest -q
```

## Notes
Payment support is intentionally disabled in this release. The bot does not create Telegram Stars invoices or checkout flows.

## Common deployment issues
- Missing environment variables: the application fails fast at startup.
- Invalid `WEBHOOK_SECRET`: Telegram requests are rejected with 401.
- Invalid username: profile links are not generated for untrusted usernames.
- Missing PostgreSQL configuration: the app will not establish a database pool.
