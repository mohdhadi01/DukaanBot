import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { seedDefaultFlow } from '@/lib/bot-engine'

export async function POST() {
  // Reset
  await db.message.deleteMany()
  await db.orderItem.deleteMany()
  await db.order.deleteMany()
  await db.conversation.deleteMany()
  await db.flowEdge.deleteMany()
  await db.flowNode.deleteMany()
  await db.product.deleteMany()
  await db.category.deleteMany()
  await db.customer.deleteMany()
  await db.shop.deleteMany()

  // Create shop: "Sharma Kirana Store"
  const shop = await db.shop.create({
    data: {
      name: 'Sharma Kirana Store',
      type: 'kirana',
      whatsappNumber: '+91 98765 43210',
      ownerName: 'Ramesh Sharma',
      description: 'Your friendly neighborhood kirana — fresh groceries, daily essentials, and home delivery within 2 km.',
      address: '12, Main Bazaar Road, Sector 7, New Delhi 110001',
      hours: 'Mon–Sun: 7:00 AM – 10:00 PM',
      currency: '₹',
      language: 'en',
      isOpen: true,
      primaryColor: '#16a34a',
    },
  })

  // Categories
  const groceries = await db.category.create({ data: { shopId: shop.id, name: 'Groceries', emoji: '🛒' } })
  const dairy = await db.category.create({ data: { shopId: shop.id, name: 'Dairy & Eggs', emoji: '🥛' } })
  const snacks = await db.category.create({ data: { shopId: shop.id, name: 'Snacks & Beverages', emoji: '🥤' } })
  const fresh = await db.category.create({ data: { shopId: shop.id, name: 'Fresh Produce', emoji: '🥬' } })
  const household = await db.category.create({ data: { shopId: shop.id, name: 'Household', emoji: '🧼' } })

  // Products
  const products = [
    ['Aashirvaad Atta (Whole Wheat)', 280, '5 kg', groceries.id, 'Premium quality stone-ground wheat flour for soft rotis.'],
    ['Tata Salt', 28, '1 kg', groceries.id, 'Iodised table salt for everyday cooking.'],
    ['India Gate Basmati Rice', 220, '1 kg', groceries.id, 'Long grain aged basmati rice — perfect for biryani & pulao.'],
    ['Fortune Sunflower Oil', 145, '1 L', groceries.id, 'Refined sunflower oil, light & heart-healthy.'],
    ['Tata Toor Dal', 165, '1 kg', groceries.id, 'Premium unpolished toor dal — rich in protein.'],
    ['Sugar', 50, '1 kg', groceries.id, 'Refined white sugar.'],

    ['Amul Gold Milk', 34, '500 ml', dairy.id, 'Full-cream pasteurized milk in a tamper-proof pack.'],
    ['Amul Butter', 56, '100 g', dairy.id, 'Pasteurized salted butter — India\'s favorite.'],
    ['Farm Fresh Eggs', 84, '12 pcs', dairy.id, 'Free-range brown eggs, packed daily.'],
    ['Amul Cheese Slices', 135, '200 g', dairy.id, 'Processed cheese slices — perfect for sandwiches.'],

    ['Coca-Cola', 40, '750 ml', snacks.id, 'Chilled cola — refresh yourself anytime.'],
    ['Lays Magic Masala', 20, '52 g', snacks.id, 'Crispy potato chips with tangy masala flavor.'],
    ['Haldiram Aloo Bhujia', 55, '200 g', snacks.id, 'Crunchy spicy bhujia — goes great with chai.'],
    ['Tata Tea Premium', 95, '250 g', snacks.id, 'Strong & refreshing tea — perfect morning cup.'],
    ['Nescafe Classic Coffee', 175, '50 g', snacks.id, 'Instant coffee — rich aroma & smooth taste.'],

    ['Tomatoes', 30, '1 kg', fresh.id, 'Farm-fresh ripe tomatoes — hand-picked daily.'],
    ['Onions', 35, '1 kg', fresh.id, 'Fresh dry onions, essential for every Indian kitchen.'],
    ['Potatoes', 25, '1 kg', fresh.id, 'Premium quality potatoes.'],
    ['Bananas', 60, '1 dozen', fresh.id, 'Sweet ripe bananas, perfect for breakfast.'],
    ['Green Coriander', 10, '1 bunch', fresh.id, 'Freshly cut dhania for garnishing.'],

    ['Surf Excel Detergent', 95, '500 g', household.id, 'Powerful stain removal in every wash.'],
    ['Lifebuoy Soap', 35, '4 pcs', household.id, 'Germ-protection soap for the whole family.'],
    ['Colgate Toothpaste', 90, '200 g', household.id, 'Cavity protection with minty freshness.'],
    ['Harpic Toilet Cleaner', 99, '1 L', household.id, 'Kills 99.9% germs — sparkling clean toilet.'],
  ]

  for (const [name, price, unit, categoryId, description] of products) {
    await db.product.create({
      data: {
        shopId: shop.id,
        name: name as string,
        price: price as number,
        unit: unit as string,
        categoryId: categoryId as string,
        description: description as string,
        isAvailable: true,
      },
    })
  }

  // Seed default flow
  await seedDefaultFlow(shop.id)

  // Create some demo customers + orders + conversations
  const demoCustomers = [
    { name: 'Priya Verma', phone: '+91 90000 11111' },
    { name: 'Arjun Mehta', phone: '+91 90000 22222' },
    { name: 'Lakshmi Iyer', phone: '+91 90000 33333' },
    { name: 'Rahul Gupta', phone: '+91 90000 44444' },
  ]

  for (const c of demoCustomers) {
    await db.customer.create({ data: { shopId: shop.id, name: c.name, phone: c.phone } })
  }

  // Create demo orders
  const allCustomers = await db.customer.findMany({ where: { shopId: shop.id } })
  const allProducts = await db.product.findMany({ where: { shopId: shop.id } })

  const sampleOrders = [
    { customerIdx: 0, status: 'delivered', daysAgo: 5, items: [0, 5, 17] },
    { customerIdx: 1, status: 'delivered', daysAgo: 4, items: [3, 11] },
    { customerIdx: 2, status: 'ready', daysAgo: 1, items: [0, 6, 8, 12] },
    { customerIdx: 3, status: 'preparing', daysAgo: 0, items: [10, 13, 18] },
    { customerIdx: 0, status: 'delivered', daysAgo: 2, items: [22, 23] },
    { customerIdx: 1, status: 'pending', daysAgo: 0, items: [4, 5, 14] },
    { customerIdx: 2, status: 'delivered', daysAgo: 6, items: [1, 6, 7] },
    { customerIdx: 3, status: 'delivered', daysAgo: 3, items: [16, 17, 19] },
  ]

  for (const so of sampleOrders) {
    const customer = allCustomers[so.customerIdx]
    const items = so.items.map((i) => allProducts[i])
    const total = items.reduce((s, p) => s + p.price * 2, 0)
    const created = new Date(Date.now() - so.daysAgo * 24 * 60 * 60 * 1000)
    await db.order.create({
      data: {
        shopId: shop.id,
        customerId: customer.id,
        status: so.status,
        total,
        type: 'delivery',
        address: 'Demo address, Sector 7',
        createdAt: created,
        updatedAt: created,
        items: {
          create: items.map((p) => ({
            name: p.name,
            price: p.price,
            quantity: 2,
            total: p.price * 2,
            productId: p.id,
          })),
        },
      },
    })
  }

  return NextResponse.json({ ok: true, shop })
}
