import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const shop = await db.shop.findFirst()
  if (!shop) return NextResponse.json({ analytics: { totalOrders: 0, totalRevenue: 0, totalCustomers: 0, totalConversations: 0, statusBreakdown: {}, recentOrders: [], topProducts: [], dailyRevenue: [] } })

  const now = new Date()
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [orders, customers, conversations, products] = await Promise.all([
    db.order.findMany({
      where: { shopId: shop.id, createdAt: { gte: last30Days } },
      include: { items: true, customer: true },
      orderBy: { createdAt: 'desc' },
    }),
    db.customer.count({ where: { shopId: shop.id } }),
    db.conversation.count({ where: { shopId: shop.id } }),
    db.product.findMany({ where: { shopId: shop.id }, include: { orderItems: true } }),
  ])

  const allOrders = await db.order.findMany({
    where: { shopId: shop.id },
    include: { items: true },
  })

  const totalRevenue = allOrders
    .filter((o) => o.status !== 'cancelled')
    .reduce((s, o) => s + o.total, 0)

  // Status breakdown
  const statusBreakdown: Record<string, number> = {}
  for (const o of allOrders) {
    statusBreakdown[o.status] = (statusBreakdown[o.status] || 0) + 1
  }

  // Top products
  const productCounts: Record<string, { name: string; count: number; revenue: number }> = {}
  for (const o of allOrders) {
    if (o.status === 'cancelled') continue
    for (const it of o.items) {
      const key = it.productId || it.name
      if (!productCounts[key]) {
        productCounts[key] = { name: it.name, count: 0, revenue: 0 }
      }
      productCounts[key].count += it.quantity
      productCounts[key].revenue += it.total
    }
  }
  const topProducts = Object.values(productCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Daily revenue (last 7 days)
  const dailyRevenue: { date: string; revenue: number; orders: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
    const dayOrders = allOrders.filter(
      (o) => o.createdAt >= dayStart && o.createdAt < dayEnd && o.status !== 'cancelled'
    )
    dailyRevenue.push({
      date: dayStart.toISOString().slice(0, 10),
      revenue: dayOrders.reduce((s, o) => s + o.total, 0),
      orders: dayOrders.length,
    })
  }

  const recentOrders = orders.slice(0, 5).map((o) => ({
    id: o.id,
    customerName: o.customer?.name || 'Unknown',
    total: o.total,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
  }))

  return NextResponse.json({
    analytics: {
      totalOrders: allOrders.length,
      totalRevenue,
      totalCustomers: customers,
      totalConversations: conversations,
      totalProducts: products.length,
      statusBreakdown,
      topProducts,
      dailyRevenue,
      recentOrders,
      avgOrderValue: allOrders.length ? totalRevenue / allOrders.length : 0,
      last30Days: {
        orders: orders.length,
        revenue: orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0),
      },
    },
  })
}
