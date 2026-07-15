# Vercel-Only Demo Deployment

This file documents the demo-only Vercel hack for DukaanBot.

Use this only when the goal is to show the project for a few minutes. For production, use `PRODUCTION_DEPLOYMENT.md`.

## What This Mode Does

Set:

```bash
WHATSAPP_MODE="inprocess"
```

When this flag is enabled, the backend does not call the separate `backend/scripts/whatsapp-worker.ts` process. Instead, it starts Baileys inside the Vercel API runtime and stores Baileys auth state in MongoDB through `WhatsappSession.sessionBlob`.

This makes the QR connect flow possible on Vercel for short demos.

## Known Risks

- Vercel can recycle the function instance.
- A redeploy can kill the live WhatsApp socket.
- Warm state can disappear.
- A new request may hit a different function instance.
- The user may need to reconnect WhatsApp before the demo.
- This is not reliable enough for production customers.

## Vercel Project Settings

Import the repo as one Vercel project.

Use the existing root `vercel.json`.

Set these environment variables in Vercel:

```bash
MONGODB_URI="mongodb+srv://mohdhadi88923_db_user:O75CaYtmUczJxU1H@cluster0.qwq1z6q.mongodb.net/dukaanbot?retryWrites=true&w=majority"
JWT_SECRET="dev-secret-change-in-production-32chars"
INTERNAL_API_SECRET="dev-internal-secret-change-me-32chars"
SESSION_ENCRYPTION_KEY="01234567890123456789012345678901"
FRONTEND_URL="https://YOUR-APP-NAME.vercel.app"
APP_URL="https://YOUR-APP-NAME.vercel.app"
WHATSAPP_MODE="inprocess"
```

> [!NOTE]
> Replace `YOUR-APP-NAME` in `FRONTEND_URL` and `APP_URL` with your actual Vercel deployment URL (e.g. `https://dukaanbot.vercel.app`).
> Leave `NEXT_PUBLIC_API_URL` unset in your Vercel Dashboard env settings. The frontend automatically defaults to same-origin `/api` in production.

Optional Stripe variables:

```bash
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_STARTER_PRICE_ID=""
STRIPE_PRO_PRICE_ID=""
```

## Demo Routine

Before showing the client:

1. Open the Vercel app.
2. Log in.
3. Go to the dashboard.
4. Click `Connect WhatsApp`.
5. Scan the QR.
6. Send a test WhatsApp message from another phone.
7. Keep the dashboard open during the demo.

If replies stop, click disconnect/connect and scan again.

## Local Mode

For normal local development, keep:

```bash
WHATSAPP_MODE="worker"
```

or omit it entirely. Then run:

```bash
bun run dev
bun run worker:whatsapp
```
