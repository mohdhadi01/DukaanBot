# DukaanBot

**Your shop on WhatsApp. Orders on autopilot.**

DukaanBot is a no-code WhatsApp chatbot SaaS for small shops — kirana stores, salons, tailors, and local businesses. Build conversation flows visually, connect your shop phone via QR scan, and manage orders from one dashboard.

<p align="center">
  <img src="./ss/image.png" alt="DukaanBot landing page with WhatsApp order flow preview" width="100%" />
</p>

<p align="center">
  <em>Landing page with live WhatsApp-style order demo — menu, cart, and checkout in chat.</em>
</p>

---

## Screenshots

### Merchant dashboard

Analytics, orders, customers, menu builder, flow builder, and inbox — everything a shop owner needs in one place.

<p align="center">
  <img src="./ss/Screenshot%202026-07-04%20211126.png" alt="DukaanBot merchant dashboard with revenue analytics and order tracking" width="100%" />
</p>

<p align="center">
  <em>Dashboard — revenue charts, top products, order pipeline, and WhatsApp connect.</em>
</p>

---

## Features

| Feature | Description |
|---------|-------------|
| **Visual Flow Builder** | Drag-and-drop nodes: welcome, menu, questions, branches, collect input, place order |
| **WhatsApp QR Connect** | Scan QR from dashboard — no Meta Business API setup required |
| **Inbox Simulator** | Test your bot like a real customer before going live |
| **Menu Builder** | Products, categories, prices, and availability |
| **Order Management** | Pending → preparing → ready → delivered pipeline |
| **Customer CRM** | Phone, name, order history, and conversation threads |
| **Analytics** | Revenue, top products, daily charts, order breakdown |
| **Browser Demo** | `/demo` runs fully in-browser — no database or backend needed |
| **Subscriptions** | Stripe-ready plans with 14-day free trial |

---

## Tech stack

| Layer | Technologies |
|-------|----------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui, Zustand |
| **Backend** | Express 5, Bun, JWT auth (HTTP-only cookies) |
| **Database** | MongoDB Atlas, Mongoose |
| **WhatsApp** | Baileys (QR pairing), dedicated worker service |
| **Payments** | Stripe (optional) |

### Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│  Next.js :3000  │────▶│  Express :4000  │────▶│  MongoDB Atlas   │
│  (frontend/)    │     │  (backend/)     │     │                  │
└─────────────────┘     └────────┬────────┘     └──────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │ WhatsApp Worker │
                        │     :3001       │
                        │  (Baileys QR)   │
                        └─────────────────┘
```

---

## Project structure

```
dukaanbot/
├── frontend/          # Next.js app (marketing, demo, dashboard)
├── backend/           # Express API + WhatsApp worker script
│   ├── src/
│   │   ├── routes/    # Auth, API, Stripe, internal webhooks
│   │   ├── models/    # Mongoose schemas
│   │   ├── lib/       # Bot engine, JWT, WhatsApp helpers
│   │   └── services/  # Auth, billing, shop, bot
│   └── scripts/
│       └── whatsapp-worker.ts
├── ss/                # Screenshots for README
├── .env.example
└── package.json       # Root workspace scripts
```

---

## Quick start

### Prerequisites

- [Bun](https://bun.sh) installed
- [MongoDB Atlas](https://cloud.mongodb.com) cluster (for full app only)

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/dukaanbot.git
cd dukaanbot
cp .env.example .env
bun run install:all
```

### 2. Configure `.env`

```env
MONGODB_URI="mongodb+srv://USER:PASS@cluster.mongodb.net/dukaanbot?retryWrites=true&w=majority"
NEXT_PUBLIC_API_URL="http://localhost:4000"
FRONTEND_URL="http://localhost:3000"
JWT_SECRET="your-32-char-secret"
```

### 3. Run

**Demo only (no database):**

```bash
bun run dev:frontend
```

Open [http://localhost:3000/demo](http://localhost:3000/demo)

**Full app:**

```bash
bun run dev              # frontend :3000 + backend :4000
bun run worker:whatsapp  # WhatsApp QR worker :3001 (optional)
```

| Service | Port | Command |
|---------|------|---------|
| Frontend | 3000 | `bun run dev:frontend` |
| API | 4000 | `bun run dev:backend` |
| WhatsApp worker | 3001 | `bun run worker:whatsapp` |

---

## Bot flow (how it works)

1. Customer sends **Hi** on WhatsApp
2. Bot welcomes and shows menu options (`1` Order · `2` Hours · `3` Talk to owner)
3. Customer picks items by number (`2, 3, 5`) → added to cart
4. Customer types `0` → cart summary + **confirm** prompt
5. Bot collects **address** and **notes**
6. Order placed → appears in dashboard **Orders** tab

The same flow is editable in the **Flow Builder** and testable in the **Inbox** simulator.

---

## API overview

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/register` | Sign up + 14-day trial |
| `POST /api/auth/login` | JWT cookie login |
| `GET /api/shops` | Shop profile + stats |
| `GET/POST /api/flow` | Flow nodes & edges |
| `GET/POST /api/messages` | Inbox conversations |
| `GET/POST /api/orders` | Order management |
| `POST /api/whatsapp/connect` | Start QR pairing |
| `GET /api/whatsapp/status` | Connection state |

---

## WhatsApp setup

1. Register and complete onboarding
2. Go to **Settings** → **Connect WhatsApp**
3. Scan QR with your shop phone (WhatsApp → Linked devices)
4. Status shows **Live on WhatsApp**

> Uses WhatsApp Web protocol (Baileys). Easy for shop owners — no Meta developer account needed. Use responsibly.

---

## Production build

```bash
bun run build
bun run start
```

Set production URLs in `.env`:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

---

## License

MIT — use freely for learning and portfolio.

---

<p align="center">
  Built for small shops in India 🇮🇳 · Made with Next.js, Express & MongoDB
</p>
