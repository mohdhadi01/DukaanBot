function id(prefix: string, n: number) {
  return `demo-${prefix}-${n}`
}

const now = Date.now()
const daysAgo = (d: number) => new Date(now - d * 86400000).toISOString()

export const DEMO_SHOP = {
  id: id('shop', 1),
  isDemo: true,
  name: 'Sharma Kirana Store',
  type: 'kirana',
  whatsappNumber: '+91 98765 43210',
  ownerName: 'Ramesh Sharma',
  description:
    'Your friendly neighborhood kirana — fresh groceries, daily essentials, and home delivery within 2 km.',
  address: '12, Main Bazaar Road, Sector 7, New Delhi 110001',
  hours: 'Mon–Sun: 7:00 AM – 10:00 PM',
  currency: '₹',
  language: 'en',
  isOpen: true,
  primaryColor: '#16a34a',
  whatsappConnected: false,
  createdAt: daysAgo(30),
  updatedAt: daysAgo(0),
  _count: { products: 24, orders: 8, customers: 4, conversations: 2 },
}

export const DEMO_CATEGORIES = [
  { id: id('cat', 1), shopId: DEMO_SHOP.id, name: 'Groceries', emoji: '🛒', _count: { products: 6 } },
  { id: id('cat', 2), shopId: DEMO_SHOP.id, name: 'Dairy & Eggs', emoji: '🥛', _count: { products: 4 } },
  { id: id('cat', 3), shopId: DEMO_SHOP.id, name: 'Snacks & Beverages', emoji: '🥤', _count: { products: 5 } },
  { id: id('cat', 4), shopId: DEMO_SHOP.id, name: 'Fresh Produce', emoji: '🥬', _count: { products: 5 } },
  { id: id('cat', 5), shopId: DEMO_SHOP.id, name: 'Household', emoji: '🧼', _count: { products: 4 } },
]

const productRows: [string, number, string, number, string][] = [
  ['Aashirvaad Atta (Whole Wheat)', 280, '5 kg', 1, 'Premium quality stone-ground wheat flour.'],
  ['Tata Salt', 28, '1 kg', 1, 'Iodised table salt.'],
  ['India Gate Basmati Rice', 220, '1 kg', 1, 'Long grain aged basmati rice.'],
  ['Fortune Sunflower Oil', 145, '1 L', 1, 'Refined sunflower oil.'],
  ['Tata Toor Dal', 165, '1 kg', 1, 'Premium unpolished toor dal.'],
  ['Sugar', 50, '1 kg', 1, 'Refined white sugar.'],
  ['Amul Gold Milk', 34, '500 ml', 2, 'Full-cream pasteurized milk.'],
  ['Amul Butter', 56, '100 g', 2, 'Pasteurized salted butter.'],
  ['Farm Fresh Eggs', 84, '12 pcs', 2, 'Free-range brown eggs.'],
  ['Amul Cheese Slices', 135, '200 g', 2, 'Processed cheese slices.'],
  ['Coca-Cola', 40, '750 ml', 3, 'Chilled cola.'],
  ['Lays Magic Masala', 20, '52 g', 3, 'Crispy potato chips.'],
  ['Haldiram Aloo Bhujia', 55, '200 g', 3, 'Crunchy spicy bhujia.'],
  ['Tata Tea Premium', 95, '250 g', 3, 'Strong & refreshing tea.'],
  ['Nescafe Classic Coffee', 175, '50 g', 3, 'Instant coffee.'],
  ['Tomatoes', 30, '1 kg', 4, 'Farm-fresh ripe tomatoes.'],
  ['Onions', 35, '1 kg', 4, 'Fresh dry onions.'],
  ['Potatoes', 25, '1 kg', 4, 'Premium quality potatoes.'],
  ['Bananas', 60, '1 dozen', 4, 'Sweet ripe bananas.'],
  ['Green Coriander', 10, '1 bunch', 4, 'Freshly cut dhania.'],
  ['Surf Excel Detergent', 95, '500 g', 5, 'Powerful stain removal.'],
  ['Lifebuoy Soap', 35, '4 pcs', 5, 'Germ-protection soap.'],
  ['Colgate Toothpaste', 90, '200 g', 5, 'Cavity protection.'],
  ['Harpic Toilet Cleaner', 99, '1 L', 5, 'Kills 99.9% germs.'],
]

export const DEMO_PRODUCTS = productRows.map((row, i) => {
  const catIdx = row[3] - 1
  const cat = DEMO_CATEGORIES[catIdx]
  return {
    id: id('prod', i + 1),
    shopId: DEMO_SHOP.id,
    name: row[0],
    price: row[1],
    unit: row[2],
    description: row[4],
    categoryId: cat.id,
    category: cat,
    isAvailable: true,
    tags: null,
    createdAt: daysAgo(20),
    updatedAt: daysAgo(20),
  }
})

export const DEMO_CUSTOMERS = [
  { id: id('cust', 1), shopId: DEMO_SHOP.id, name: 'Priya Verma', phone: '+91 90000 11111', notes: null, tags: null, createdAt: daysAgo(10), _count: { orders: 2, conversations: 1 }, orders: [] },
  { id: id('cust', 2), shopId: DEMO_SHOP.id, name: 'Arjun Mehta', phone: '+91 90000 22222', notes: null, tags: null, createdAt: daysAgo(8), _count: { orders: 2, conversations: 1 }, orders: [] },
  { id: id('cust', 3), shopId: DEMO_SHOP.id, name: 'Lakshmi Iyer', phone: '+91 90000 33333', notes: null, tags: null, createdAt: daysAgo(6), _count: { orders: 2, conversations: 0 }, orders: [] },
  { id: id('cust', 4), shopId: DEMO_SHOP.id, name: 'Rahul Gupta', phone: '+91 90000 44444', notes: null, tags: null, createdAt: daysAgo(5), _count: { orders: 2, conversations: 0 }, orders: [] },
]

function makeOrder(idx: number, customerIdx: number, status: string, days: number, productIdxs: number[]) {
  const customer = DEMO_CUSTOMERS[customerIdx]
  const items = productIdxs.map((pi) => {
    const p = DEMO_PRODUCTS[pi]
    return {
      id: id('oitem', idx * 10 + pi),
      name: p.name,
      price: p.price,
      quantity: 2,
      total: p.price * 2,
      productId: p.id,
    }
  })
  const total = items.reduce((s, it) => s + it.total, 0)
  const created = daysAgo(days)
  return {
    id: id('order', idx),
    shopId: DEMO_SHOP.id,
    customerId: customer.id,
    customer,
    status,
    total,
    type: 'delivery',
    address: 'Demo address, Sector 7',
    notes: null,
    items,
    createdAt: created,
    updatedAt: created,
  }
}

export const DEMO_ORDERS = [
  makeOrder(1, 0, 'delivered', 5, [0, 5, 17]),
  makeOrder(2, 1, 'delivered', 4, [3, 11]),
  makeOrder(3, 2, 'ready', 1, [0, 6, 8, 12]),
  makeOrder(4, 3, 'preparing', 0, [10, 13, 18]),
  makeOrder(5, 0, 'delivered', 2, [22, 23]),
  makeOrder(6, 1, 'pending', 0, [4, 5, 14]),
  makeOrder(7, 2, 'delivered', 6, [1, 6, 7]),
  makeOrder(8, 3, 'delivered', 3, [16, 17, 19]),
]

export const DEMO_CONVERSATIONS = [
  {
    id: id('conv', 1),
    shopId: DEMO_SHOP.id,
    customerId: DEMO_CUSTOMERS[0].id,
    customer: DEMO_CUSTOMERS[0],
    channel: 'simulator',
    status: 'active',
    currentNodeId: null,
    context: null,
    updatedAt: daysAgo(0),
    messages: [],
    _count: { messages: 0 },
  },
  {
    id: id('conv', 2),
    shopId: DEMO_SHOP.id,
    customerId: DEMO_CUSTOMERS[1].id,
    customer: DEMO_CUSTOMERS[1],
    channel: 'simulator',
    status: 'active',
    currentNodeId: null,
    context: null,
    updatedAt: daysAgo(1),
    messages: [],
    _count: { messages: 0 },
  },
]

export const DEMO_FLOW_NODES = [
  { id: id('node', 1), shopId: DEMO_SHOP.id, type: 'start', title: 'Start', data: {}, positionX: 80, positionY: 80, isStart: true },
  {
    id: id('node', 2),
    shopId: DEMO_SHOP.id,
    type: 'message',
    title: 'Welcome',
    data: { message: '🙏 Namaste! Welcome to {{shopName}}. How can I help you today?' },
    positionX: 360,
    positionY: 80,
    isStart: false,
  },
  {
    id: id('node', 3),
    shopId: DEMO_SHOP.id,
    type: 'question',
    title: 'Main Menu Choice',
    data: {
      prompt: 'Please choose an option:',
      variable: 'mainChoice',
      options: [
        { label: 'See Menu / Order', value: 'menu' },
        { label: 'Shop Timings', value: 'hours' },
        { label: 'Talk to Shop Owner', value: 'human' },
      ],
    },
    positionX: 640,
    positionY: 80,
    isStart: false,
  },
  {
    id: id('node', 4),
    shopId: DEMO_SHOP.id,
    type: 'menu',
    title: 'Show Menu',
    data: { message: '🛒 *Our Menu*', showPrices: true, allowOrdering: true },
    positionX: 920,
    positionY: 40,
    isStart: false,
  },
  {
    id: id('node', 5),
    shopId: DEMO_SHOP.id,
    type: 'message',
    title: 'Shop Hours',
    data: { message: '🕘 We are open every day from 9:00 AM to 9:00 PM. Type "menu" to start an order.' },
    positionX: 920,
    positionY: 220,
    isStart: false,
  },
  {
    id: id('node', 6),
    shopId: DEMO_SHOP.id,
    type: 'message',
    title: 'Human Handoff',
    data: { message: '📞 Sure! Our shop owner will reach out to you shortly. For urgent queries please call us directly.' },
    positionX: 920,
    positionY: 380,
    isStart: false,
  },
  {
    id: id('node', 7),
    shopId: DEMO_SHOP.id,
    type: 'collect',
    title: 'Collect Address',
    data: { prompt: '📍 Please share your delivery address:', variable: 'address' },
    positionX: 1200,
    positionY: 40,
    isStart: false,
  },
  {
    id: id('node', 8),
    shopId: DEMO_SHOP.id,
    type: 'collect',
    title: 'Collect Notes',
    data: {
      prompt: '📝 Any special instructions? (e.g. "ring twice" / "no onions"). Reply "no" to skip.',
      variable: 'notes',
    },
    positionX: 1480,
    positionY: 40,
    isStart: false,
  },
  {
    id: id('node', 9),
    shopId: DEMO_SHOP.id,
    type: 'place_order',
    title: 'Place Order',
    data: {},
    positionX: 1480,
    positionY: 220,
    isStart: false,
  },
  {
    id: id('node', 10),
    shopId: DEMO_SHOP.id,
    type: 'end',
    title: 'Thank You',
    data: { endMessage: '🎉 Thank you for your order, {{name}}! We will confirm it shortly. Have a great day! 🙏' },
    positionX: 1480,
    positionY: 380,
    isStart: false,
  },
]

export const DEMO_FLOW_EDGES = [
  { id: id('edge', 1), shopId: DEMO_SHOP.id, sourceNodeId: id('node', 1), targetNodeId: id('node', 2), label: null, condition: null },
  { id: id('edge', 2), shopId: DEMO_SHOP.id, sourceNodeId: id('node', 2), targetNodeId: id('node', 3), label: null, condition: null },
  { id: id('edge', 3), shopId: DEMO_SHOP.id, sourceNodeId: id('node', 3), targetNodeId: id('node', 4), label: 'Menu/Order', condition: 'menu' },
  { id: id('edge', 4), shopId: DEMO_SHOP.id, sourceNodeId: id('node', 3), targetNodeId: id('node', 5), label: 'Hours', condition: 'hours' },
  { id: id('edge', 5), shopId: DEMO_SHOP.id, sourceNodeId: id('node', 3), targetNodeId: id('node', 6), label: 'Human', condition: 'human' },
  { id: id('edge', 6), shopId: DEMO_SHOP.id, sourceNodeId: id('node', 4), targetNodeId: id('node', 7), label: null, condition: null },
  { id: id('edge', 7), shopId: DEMO_SHOP.id, sourceNodeId: id('node', 7), targetNodeId: id('node', 8), label: null, condition: null },
  { id: id('edge', 8), shopId: DEMO_SHOP.id, sourceNodeId: id('node', 8), targetNodeId: id('node', 9), label: null, condition: null },
  { id: id('edge', 9), shopId: DEMO_SHOP.id, sourceNodeId: id('node', 9), targetNodeId: id('node', 10), label: null, condition: null },
  { id: id('edge', 10), shopId: DEMO_SHOP.id, sourceNodeId: id('node', 5), targetNodeId: id('node', 3), label: null, condition: null },
  { id: id('edge', 11), shopId: DEMO_SHOP.id, sourceNodeId: id('node', 6), targetNodeId: id('node', 10), label: null, condition: null },
]

export function cloneDemoState() {
  return {
    shop: JSON.parse(JSON.stringify({ ...DEMO_SHOP, categories: DEMO_CATEGORIES })),
    categories: JSON.parse(JSON.stringify(DEMO_CATEGORIES)),
    products: JSON.parse(JSON.stringify(DEMO_PRODUCTS)),
    customers: JSON.parse(JSON.stringify(DEMO_CUSTOMERS)),
    orders: JSON.parse(JSON.stringify(DEMO_ORDERS)),
    conversations: JSON.parse(JSON.stringify(DEMO_CONVERSATIONS)),
    flowNodes: JSON.parse(JSON.stringify(DEMO_FLOW_NODES)),
    flowEdges: JSON.parse(JSON.stringify(DEMO_FLOW_EDGES)),
    nextId: 10000,
  }
}
