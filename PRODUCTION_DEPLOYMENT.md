# DukaanBot Production Deployment

This is the production-grade deployment path for the current architecture.

## Architecture

DukaanBot currently has three runtime pieces:

1. `frontend/` - Next.js app for marketing, auth, onboarding, dashboard, and demo.
2. `backend/` - Express API for auth, shops, catalog, conversations, orders, billing, and internal routes.
3. `backend/scripts/whatsapp-worker.ts` - long-running Baileys worker for WhatsApp QR sessions and live message events.

MongoDB Atlas stores application data. The WhatsApp worker keeps a live socket to WhatsApp Web and forwards incoming messages to the backend bot engine.

## Why the Worker Should Not Run on Vercel in Production

The Baileys worker needs:

- a long-lived WebSocket connection to WhatsApp
- reconnect timers
- in-memory live socket state
- durable auth/session state
- a process that keeps listening even when no HTTP request is active

Vercel Functions are request-driven and time-limited. Their writable filesystem is temporary, and requests may hit different function instances. That makes the current Baileys worker unsuitable for reliable production use on Vercel.

## Recommended Production Setup

Use this split:

- Vercel: `frontend/`
- Always-on Node host: `backend/` API and WhatsApp worker
- MongoDB Atlas: database

The backend and WhatsApp worker can run on the same server. They do not need separate repos.

Good always-on hosts:

- AWS Lightsail or EC2
- Oracle Cloud Free Tier VM
- Fly.io
- Render paid instance
- Railway paid service
- any VPS with Node/Bun support

## Backend Server Commands

Install dependencies:

```bash
bun run install:all
```

Run the API:

```bash
bun run --cwd backend start
```

Run the WhatsApp worker:

```bash
bun run --cwd backend worker:whatsapp
```

For production, run both with a process manager such as `pm2`, `systemd`, or Docker Compose.

## Required Environment Variables

Set these on the backend host:

```bash
MONGODB_URI="mongodb+srv://..."
JWT_SECRET="random-32-plus-character-secret"
FRONTEND_URL="https://your-vercel-app.vercel.app"
APP_URL="https://api.your-domain.com"
WHATSAPP_WORKER_URL="http://localhost:3001"
INTERNAL_API_SECRET="random-32-plus-character-secret"
SESSION_ENCRYPTION_KEY="random-32-plus-character-secret"
BACKEND_PORT="4000"
WHATSAPP_WORKER_PORT="3001"
WHATSAPP_MODE="worker"
```

Set this on Vercel frontend:

```bash
NEXT_PUBLIC_API_URL="https://api.your-domain.com"
```

Optional Stripe variables:

```bash
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_STARTER_PRICE_ID=""
STRIPE_PRO_PRICE_ID=""
```

## Production Checklist

1. Deploy the frontend to Vercel.
2. Deploy backend API to an always-on server.
3. Run the WhatsApp worker on the same server.
4. Point `NEXT_PUBLIC_API_URL` to the backend public URL.
5. Point `FRONTEND_URL` to the Vercel frontend URL.
6. Ensure MongoDB Atlas network access allows the backend host.
7. Use HTTPS for the backend public URL.
8. Keep `INTERNAL_API_SECRET` private and identical for API and worker.
9. Do not use the demo-only Vercel in-process WhatsApp mode for production.

## Vercel-Only Demo Mode

This repo also contains a demo-only Vercel hack controlled by:

```bash
WHATSAPP_MODE="inprocess"
```

That mode starts Baileys inside the Vercel API runtime and stores auth data in MongoDB. It is useful for short demos, but it can disconnect, lose warm state, or require re-pairing after cold starts or deploys. It should not be sold as production WhatsApp reliability.
