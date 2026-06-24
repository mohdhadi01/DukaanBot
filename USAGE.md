# DukaanBot — WhatsApp Chatbot Builder for Small Shops

> A no-code WhatsApp auto-reply & order-management platform for kirana stores, tailors, tutors, salons, bakeries, and other small businesses. Inspired by China's WeChat mini-programs that let small merchants take orders on chat apps without building a full app.

This file tells you **how to use the app** and what's **left to add** before going fully live.

---

## 1. Quick Start (60 seconds)

1. Open the app in your browser (use the **Preview Panel** on the right of the workspace, or click **Open in New Tab** above it).
2. On the welcome screen, click **Load Demo Shop**. This instantly creates:
   - A sample kirana store ("Sharma Kirana Store") with 25 products across 5 categories
   - A ready-to-use auto-reply flow (welcome → menu choice → ordering → address → order placement)
   - 4 demo customers and 8 sample orders
3. Use the left sidebar to navigate between the 7 main views (described below).
4. Click the **? Help** button (top-right) anytime for an in-app tour.

> Tip: Click **Load Demo** again anytime to reset everything back to the demo state.

---

## 2. The 7 Main Views

### 🏠 Dashboard
Your shop at a glance:
- **Revenue / Orders / Customers / Conversations** stat cards
- **Revenue this week** area chart
- **Top products** by units sold
- **Order status** breakdown (pending / confirmed / preparing / ready / delivered / cancelled)
- **Recent orders** feed with one-click navigation to fullfilment

### 📦 Menu Builder
Add and organize the products/services customers see in WhatsApp:
- **Add Product** button (top-right) — name, price, unit (kg/L/pcs), category, description, availability toggle
- **Add Category** button — group products (e.g. "Groceries", "Dairy & Eggs", "Snacks")
- Search bar + category filter
- Toggle availability instantly (out-of-stock items disappear from the customer menu)
- Edit/delete with the icons on each product card

### 🔀 Flow Builder (the heart of the app)
A visual canvas where you design the WhatsApp auto-reply flow. Think of it as drawing a flowchart of how the bot should respond.

**8 step types** you can drag onto the canvas:

| Step | What it does |
|------|--------------|
| **Start** | Entry point. Every flow has exactly one. |
| **Message** | Sends a text message and moves on. Supports `{{name}}`, `{{shopName}}`, `{{address}}` placeholders. |
| **Menu** | Shows products from your menu. Toggle "allow ordering" to let customers add items to cart. |
| **Question** | Asks a multiple-choice question. Saves the answer to a variable (e.g. `mainChoice`). |
| **Collect Input** | Asks for free-text input (name, address, notes). Saves to a variable. |
| **Branch** | Routes the flow based on a variable's value. |
| **Place Order** | Takes the cart and creates a real Order record. |
| **End** | Ends the conversation with a closing message. |

**How to use the canvas:**
- **Add a step**: Click any step type in the left palette.
- **Move a step**: Drag it by its body.
- **Connect steps**: Drag from the **dark circle on a step's right side** to the **light circle on the next step's left side**.
- **Edit a step**: Double-click it (or click once to select, then "Edit" in the floating toolbar).
- **Label / branch a connection**: **Click the connection line** to open the editor. Set a *Label* (shown on canvas) and a *Condition* (matched against the variable value). This is how you route "Yes" vs "No" answers.
- **Delete a connection**: Click it → click "Delete" in the popup.
- **Set the starting step**: Select a step → click "Set Start" in the floating toolbar.
- **Zoom**: `+` / `−` buttons in the top-right.
- **Pan**: Click and drag the background.
- **Esc**: Closes any open popup or selection.

The default demo flow is:
```
Start → Welcome → Question (Menu/Hours/Human)
                    ├─ Menu/Order → Menu → Collect Address → Collect Notes → Place Order → End
                    ├─ Hours → Message (timings) → loops back to Question
                    └─ Human → Message (handoff) → End
```

### 💬 Inbox (WhatsApp Simulator)
Test the bot exactly like a real customer would:
- Click **New** (top-right) to start a test chat. Pick a preset customer or enter any name/phone.
- The chat opens with a realistic WhatsApp-style UI (chat bubbles, typing indicators, conversation list).
- Type anything — the bot runs your flow and replies in real time.
- **Quick replies** appear above the input for the first few messages ("Hi", "1", "See menu", "Order").
- **Reset** button starts a fresh conversation with the same customer (clears bot context).
- The conversation list polls every 4 seconds, so multiple chats stay in sync.

**Try the full customer journey:**
```
Hi            → bot says "Namaste!" + shows 3 options
1             → shows full menu with prices
1, 5          → adds items 1 and 5 to cart
0             → shows cart with total
confirm       → asks for delivery address
12 MG Road    → asks for notes
no            → places the order + says thank you
```
The order then appears in **Orders** view as "Pending".

### 🛒 Orders
Track and fulfill every order placed through the bot:
- **Status pills** at the top — All / Pending / Confirmed / Preparing / Ready / Delivered / Cancelled — each shows its count.
- **Search** by customer name, phone, or order ID.
- Click any order to open the **detail sheet** (right side) showing:
  - Customer info + phone
  - Status dropdown (change instantly)
  - Delivery address + notes
  - Item list with quantities and totals
  - One-click status advancement ("Confirm Order" → "Mark Preparing" → "Mark Ready" → "Mark Delivered")
  - Cancel button

### 👥 Customers
Everyone who's ever messaged your shop:
- Auto-created when they start a chat
- Shows order count, chat count, last order total
- Click **Message** to start a fresh WhatsApp-style chat with them
- Edit name, tags (e.g. "vip", "regular"), and internal notes
- Delete a customer (conversations remain for record-keeping)

### ⚙️ Settings
- **Shop Profile**: name, type (kirana / restaurant / tailor / tutor / salon / pharmacy / etc.), owner name, WhatsApp number, description, hours, currency, address
- **Branding**: pick a primary color (8 presets), open/closed toggle
- **WhatsApp Preview**: live preview of how your shop profile looks in WhatsApp
- **Reset to Demo Data**: starts over with the sample shop

---

## 3. How the Bot Engine Works

The bot engine (`src/lib/bot-engine.ts`) interprets your flow graph and walks each customer through it:

1. **First message**: The customer's "Hi" just triggers the flow — it isn't treated as a response to anything.
2. **Walking the flow**: The engine advances through steps automatically (e.g. Start → Welcome → Question all happen in one go).
3. **Waiting for input**: When the engine hits a Question or Collect step, it pauses and saves the current node ID to the conversation context.
4. **Next message**: The customer's next message is matched against the current step (option number for Question, free text for Collect).
5. **Branching**: For Question and Branch steps, the engine matches the customer's choice value against the **Condition** field on each outgoing edge.
6. **Cart management**: When a Menu step has "Allow ordering" enabled, customers can reply with item numbers ("1, 5") to add to cart, "0" to checkout, and "confirm" to place the order.
7. **Variables**: Use `{{variableName}}` in any Message or End step. Built-in variables: `{{name}}`, `{{shopName}}`, `{{address}}`, `{{notes}}`, plus any variable you defined in Question/Collect steps.
8. **Order creation**: The Place Order step creates an Order record with all cart items, the customer's address, and notes — instantly visible in the Orders view.

---

## 4. Tech Stack

- **Next.js 16** with App Router (single-route SPA)
- **TypeScript 5** throughout
- **Tailwind CSS 4** + **shadcn/ui** component library
- **Prisma ORM** + **SQLite** (10 models: Shop, Category, Product, FlowNode, FlowEdge, Customer, Conversation, Message, Order, OrderItem)
- **Zustand** for client state
- **Recharts** for analytics
- **Lucide** for icons
- Custom **flow engine** (no external library — pure SVG + React state for the visual builder)
- **Error boundary** for graceful error handling

---

## 5. File Structure

```
prisma/schema.prisma              # 10-model database schema
src/
├── app/
│   ├── page.tsx                  # Single-route SPA (renders the active view)
│   ├── layout.tsx                # Root layout + metadata
│   └── api/                      # 11 REST endpoints
│       ├── shops/                # Shop CRUD
│       ├── products/             # Product CRUD
│       ├── categories/           # Category CRUD
│       ├── flow/                 # Flow node CRUD
│       ├── flow/edges/           # Flow edge CRUD + label/condition editor
│       ├── conversations/        # Conversation list + create
│       ├── messages/             # Bot engine entry point (POST = customer message)
│       ├── orders/               # Order list + status update
│       ├── customers/            # Customer CRUD
│       ├── analytics/            # Dashboard stats
│       └── seed/                 # Demo data seeder
├── lib/
│   ├── db.ts                     # Prisma client singleton
│   └── bot-engine.ts             # Flow interpreter + cart + order placement
└── components/chatbot/
    ├── AppShell.tsx              # Top bar + sidebar + Help dialog
    ├── ErrorBoundary.tsx         # Graceful error fallback
    ├── store.ts                  # Zustand store (current view, refresh key)
    ├── api.ts                    # Fetch helpers + formatters
    └── views/                    # 7 view components
        ├── DashboardView.tsx
        ├── MenuView.tsx
        ├── FlowView.tsx          # Visual canvas + edge editor
        ├── InboxView.tsx         # WhatsApp simulator
        ├── OrdersView.tsx
        ├── CustomersView.tsx
        └── SettingsView.tsx
```

---

## 6. Local Development

```bash
# Install dependencies
bun install

# Push DB schema (already done once, but useful after schema changes)
bun run db:push

# Start dev server (the platform auto-runs this — don't run manually)
bun run dev

# Lint
bun run lint

# Build for production (not needed in this sandbox)
bun run build && bun run start
```

**Environment**: A `.env` file with `DATABASE_URL="file:/home/z/my-project/db/custom.db"` is pre-configured.

---

## 7. What's Production-Ready ✅

- ✅ **Full CRUD** for products, categories, customers, orders, flow nodes, flow edges
- ✅ **Visual flow builder** with drag/drop, pan/zoom, edge labels, branch conditions
- ✅ **Stateful bot engine** with cart, variables, branching, order placement
- ✅ **WhatsApp-style chat simulator** with realistic UX (typing indicators, quick replies, polling)
- ✅ **Order pipeline** with 6 statuses and one-click advancement
- ✅ **Analytics dashboard** with charts, top products, status breakdown
- ✅ **Error boundary** for graceful failure recovery
- ✅ **Help dialog** with 5-step onboarding tour
- ✅ **Mobile-responsive** (tested at 390×844 and 1280×800)
- ✅ **Toast notifications** for all user actions
- ✅ **Loading states** and empty-state illustrations
- ✅ **Keyboard shortcuts** (Esc to close popups, Enter to send)
- ✅ **Demo data seeder** for instant onboarding
- ✅ **Lint passes clean** with no errors

---

## 8. What's Left to Add Before Going Fully Live 🔜

This is a **fully working "tiny version"** as requested. To take it to a real production SaaS, here's the roadmap:

### Must-Have for Real Launch

1. **Real WhatsApp Business API integration**
   - Currently the bot runs inside an in-app simulator. To make it work with actual WhatsApp, integrate the [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api) or [Twilio WhatsApp](https://www.twilio.com/whatsapp).
   - Add a webhook endpoint at `/api/whatsapp/webhook` that receives incoming messages and pipes them through the existing `processCustomerMessage()` engine.
   - Replace the simulator's `POST /api/messages` with a real WhatsApp send call.

2. **Authentication & multi-tenant**
   - Add **NextAuth.js** login (email/password or Google).
   - Each shop belongs to a `userId`. Currently the app is single-tenant (one shop per database).
   - Add a subscription/billing layer (Stripe) — free tier, pro tier, etc.

3. **Production database**
   - Swap SQLite for **PostgreSQL** or **MySQL** (just change `DATABASE_URL` and the Prisma `datasource` provider).
   - Add connection pooling (e.g. Prisma Accelerate or PgBouncer) for serverless.

4. **Image uploads for products**
   - Currently `imageUrl` field exists but no UI. Add file upload (S3 / Cloudinary / Vercel Blob) and show product images in the menu.

### Should-Have for Growth

5. **WhatsApp template messages**
   - Pre-approved message templates for order confirmations, delivery updates, abandoned cart reminders.

6. **Broadcast campaigns**
   - Send promotional messages to all customers (with unsubscribe opt-in).

7. **Inventory tracking**
   - Auto-hide out-of-stock items. Low-stock alerts for the shop owner.

8. **Payment integration**
   - UPI / Razorpay / PhonePe links sent in the chat after order placement.

9. **Multi-language support**
   - Currently English-only. Add Hindi, Tamil, Telugu, Marathi, etc. via `next-intl` (already installed).

10. **Analytics export**
    - CSV/PDF reports for tax filing, monthly summaries.

### Nice-to-Have

11. **AI-powered auto-replies**
    - Use the installed `z-ai-web-dev-sdk` to handle off-script questions the flow doesn't cover.

12. **Mobile app for shop owners**
    - React Native or PWA so owners can manage orders from their phone.

13. **Customer feedback / ratings**
    - Post-delivery rating request via the bot.

14. **Loyalty program**
    - Auto-track repeat customers, send discount codes after N orders.

15. **Multi-agent inbox**
    - Multiple staff members handling conversations, with assignment and notes.

---

## 9. Known Limitations

- **Single shop per install** (single-tenant). Add auth + `userId` on `Shop` to make multi-tenant.
- **No real WhatsApp sending** — the simulator mimics WhatsApp but doesn't actually send messages.
- **No file/image sharing** in chat (text only).
- **No real-time push** (uses polling every 2.5–4s). For production scale, switch to WebSocket (a Socket.IO demo is in `examples/websocket/`).
- **No backup/restore UI** — the database file can be backed up manually.
- **Cart quantities default to 1** — customers can't yet say "2 kg of rice" via the bot (would need a quantity-prompt step type).
- **No undo for deletes** — confirmations are in place, but no trash/restore.

---

## 10. FAQ

**Q: I clicked "Load Demo" and lost my changes. Can I undo?**
A: No — "Load Demo" resets everything. Be careful. If you want a fresh shop without losing data, create a new conversation or product instead.

**Q: The bot doesn't respond to my messages. What's wrong?**
A: Check that:
- You have a **Start** node marked (select a Start step → "Set Start" in the toolbar).
- The Start node has a connection to the next step.
- All steps in the chain are connected.
- You're testing from a fresh conversation (use the **Reset** button in Inbox).

**Q: How do I make the bot ask different questions based on the customer's answer?**
A: Use a **Question** step (saves the answer to a variable like `mainChoice`) → connect each option to a different next step → click each connection line and set its **Condition** to match the option value (e.g. `menu`, `hours`, `human`).

**Q: Can a customer order multiple items?**
A: Yes — in a Menu step with "Allow ordering" enabled, customers reply with comma-separated item numbers like "1, 5, 8" to add multiple items. Reply "0" to checkout.

**Q: How do I change the bot's language to Hindi?**
A: Edit the **Message**, **Question**, and **End** step texts in the Flow Builder. The bot engine itself is language-agnostic — it just sends whatever text you put in. A full i18n system is on the roadmap.

**Q: Where is my data stored?**
A: In a local SQLite file at `/home/z/my-project/db/custom.db`. For production, switch to PostgreSQL by changing `DATABASE_URL` and the `provider` in `prisma/schema.prisma`.

---

## 11. Support & Next Steps

For this sandbox build:
- Use the **? Help** button (top-right) for an in-app tour.
- Click **Load Demo** anytime to reset to the sample shop.
- Use **Settings → Reset to Demo Data** to start completely fresh.

For taking this to production:
1. Fork the code, set up a real Postgres database
2. Add NextAuth.js for user authentication
3. Apply for WhatsApp Business API access at https://business.whatsapp.com/
4. Wire the webhook endpoint to the existing bot engine
5. Deploy on Vercel / Railway / your own server

Happy building! 🙏
