---
Task ID: 1
Agent: main
Task: Build production-level WhatsApp Chatbot Builder for small shops (China WeChat mini-program concept, tiny version) — no-code menu + auto-reply flow builder, WhatsApp simulator, order management, customers, analytics.

Work Log:
- Loaded fullstack-dev skill, initialized Next.js 16 project
- Designed Prisma schema with Shop, Category, Product, FlowNode, FlowEdge, Customer, Conversation, Message, Order, OrderItem models
- Built bot-engine.ts that interprets the flow graph and walks customers through it (start → message → menu → question → collect → branch → place_order → end), with cart management and order persistence
- Created REST API routes: /api/shops, /api/products, /api/categories, /api/flow, /api/flow/edges, /api/conversations, /api/messages (bot engine entry), /api/orders, /api/customers, /api/analytics, /api/seed
- Built 7 main views with Zustand store + shadcn/ui: Dashboard (revenue/orders charts), Menu Builder (CRUD products + categories), Flow Builder (visual canvas with drag/drop nodes, SVG edges, palette of 8 node types), Inbox (WhatsApp-style chat with polling), Orders (status pipeline with detail sheet), Customers (directory), Settings (shop profile, branding, WhatsApp preview)
- Seeded demo shop "Sharma Kirana Store" with 25 products across 5 categories, 4 customers, 8 demo orders, and a default flow (start → welcome → question with 3 options → menu/hours/human branches → collect address → collect notes → place_order → end)
- Fixed bot engine bugs: (1) "Hi" was being treated as a question response on first contact; (2) cart confirm flow wasn't advancing past menu node; (3) `graph` was undefined inside handleItemSelection
- Verified end-to-end with Agent Browser: loaded demo → started test chat → sent "Hi" → bot asked question → chose option 1 → menu displayed → added items 1, 5 → checkout "0" → confirmed → entered address → "no" for notes → order placed → appeared in Orders view → marked as pending ₹340
- Verified mobile (390x844) and desktop (1280x800) responsive layouts
- Lint passes clean; no runtime errors in dev.log

Stage Summary:
- Production-grade Next.js 16 app with 7 fully-functional views
- Custom visual flow builder (no external libraries — pure SVG + React state)
- WhatsApp simulator with realistic chat UX (typing indicators, chat bubbles, conversation list, polling)
- Bot engine handles complex flows with branching, cart, order placement, address collection
- Demo data loads via "Load Demo" button → instant onboarding
- All views tested and working in browser; order pipeline tested end-to-end
