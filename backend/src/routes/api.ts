import {
  User,
  Shop,
  Subscription,
  PasswordResetToken,
  Category,
  Product,
  Customer,
  Conversation,
  Message,
  Order,
  FlowNode,
  FlowEdge,
  WhatsappSession,
} from '../models'
import { provisionNewUser } from '../lib/auth'
import { handleCustomerMessage } from '../services/bot.service'
import { sendWhatsAppText } from '../lib/whatsapp'
import { seedDefaultFlow } from '../lib/bot-engine'
import { connectWhatsapp, disconnectWhatsapp, getWhatsappStatus } from '../services/whatsapp-gateway'
import { getWhatsappSession, upsertWhatsappSession } from '../services/shop.service'
import { tenantGuard, getUserFromRequest } from '../lib/tenant-express'
import { requireAuth } from '../middleware/auth'
import { Router } from 'express'
import mongoose from 'mongoose'

const router = Router()

async function guard(req: import('express').Request, res: import('express').Response) {
  const result = await tenantGuard(req)
  if (result.error) {
    res.status(result.error.status).json(result.error.body)
    return null
  }
  return result.tenant!
}

function oid(id: string) {
  return new mongoose.Types.ObjectId(id)
}

async function wipeShopData(shopId: string) {
  const sid = oid(shopId)
  const convs = await Conversation.find({ shopId: sid }).select('_id')
  const convIds = convs.map((c) => c._id)
  await Message.deleteMany({ conversationId: { $in: convIds } })
  await Order.deleteMany({ shopId: sid })
  await Conversation.deleteMany({ shopId: sid })
  await FlowEdge.deleteMany({ shopId: sid })
  await FlowNode.deleteMany({ shopId: sid })
  await Product.deleteMany({ shopId: sid })
  await Category.deleteMany({ shopId: sid })
  await Customer.deleteMany({ shopId: sid })
}

router.get('/shops', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  const shop = await Shop.findById(tenant.shopId).lean()
  if (!shop) return res.status(404).json({ error: 'Shop not found' })
  const categories = await Category.find({ shopId: tenant.shopId }).sort({ name: 1 }).lean()
  const [products, orders, customers, conversations] = await Promise.all([
    Product.countDocuments({ shopId: tenant.shopId }),
    Order.countDocuments({ shopId: tenant.shopId }),
    Customer.countDocuments({ shopId: tenant.shopId }),
    Conversation.countDocuments({ shopId: tenant.shopId }),
  ])
  return res.json({
    shop: {
      ...shop,
      id: String(shop._id),
      categories: categories.map((c) => ({ ...c, id: String(c._id) })),
      _count: { products, orders, customers, conversations },
    },
  })
})

router.post('/shops', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  if (!tenant.userId) return res.status(403).json({ error: 'Sign up to create your own shop' })
  const existing = await Shop.findOne({ userId: tenant.userId, isDemo: false })
  if (existing) return res.status(400).json({ error: 'Shop already exists' })
  const body = req.body
  const shop = await Shop.create({
    userId: tenant.userId,
    name: body.name || 'My Shop',
    type: body.type || 'kirana',
    whatsappNumber: body.whatsappNumber || '+91 98765 43210',
    ownerName: body.ownerName || 'Shop Owner',
    description: body.description || '',
    address: body.address || '',
    hours: body.hours || '9 AM - 9 PM',
    currency: body.currency || '₹',
    language: body.language || 'en',
    primaryColor: body.primaryColor || '#16a34a',
  })
  return res.json({ shop: shop.toJSON() })
})

router.patch('/shops', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  const body = req.body
  const shop = await Shop.findByIdAndUpdate(tenant.shopId, body, { new: true })
  if (!shop) return res.status(404).json({ error: 'Shop not found' })
  return res.json({ shop: shop.toJSON() })
})

router.get('/products', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  const products = await Product.find({ shopId: tenant.shopId }).populate('categoryId').sort({ name: 1 }).lean()
  return res.json({
    products: products.map((p) => ({
      ...p,
      id: String(p._id),
      category: p.categoryId && typeof p.categoryId === 'object' ? { ...p.categoryId, id: String((p.categoryId as any)._id) } : null,
      categoryId: p.categoryId ? String((p.categoryId as any)._id || p.categoryId) : null,
    })),
  })
})

router.post('/products', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  const body = req.body
  const product = await Product.create({
    shopId: tenant.shopId,
    name: body.name,
    description: body.description || null,
    price: parseFloat(body.price),
    unit: body.unit || null,
    categoryId: body.categoryId || null,
    isAvailable: body.isAvailable !== false,
    tags: Array.isArray(body.tags) ? body.tags.join(',') : body.tags || null,
  })
  await product.populate('categoryId')
  return res.json({ product: product.toJSON() })
})

router.patch('/products', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  const { id, ...data } = req.body
  if (!id) return res.status(400).json({ error: 'id required' })
  const existing = await Product.findOne({ _id: id, shopId: tenant.shopId })
  if (!existing) return res.status(404).json({ error: 'Not found' })
  if (data.price !== undefined) data.price = parseFloat(data.price)
  if (data.tags !== undefined) data.tags = Array.isArray(data.tags) ? data.tags.join(',') : data.tags || null
  const product = await Product.findByIdAndUpdate(id, data, { new: true }).populate('categoryId')
  return res.json({ product: product?.toJSON() })
})

router.delete('/products', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  const id = req.query.id as string
  if (!id) return res.status(400).json({ error: 'id required' })
  await Product.deleteOne({ _id: id, shopId: tenant.shopId })
  return res.json({ ok: true })
})

router.get('/categories', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  const categories = await Category.find({ shopId: tenant.shopId }).sort({ name: 1 }).lean()
  const withCounts = await Promise.all(
    categories.map(async (c) => ({
      ...c,
      id: String(c._id),
      _count: { products: await Product.countDocuments({ categoryId: c._id }) },
    }))
  )
  return res.json({ categories: withCounts })
})

router.post('/categories', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  const { name, emoji } = req.body
  const category = await Category.create({ shopId: tenant.shopId, name, emoji })
  return res.json({ category: category.toJSON() })
})

router.patch('/categories', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  const { id, name, emoji } = req.body
  if (!id) return res.status(400).json({ error: 'id required' })
  const category = await Category.findOneAndUpdate({ _id: id, shopId: tenant.shopId }, { name, emoji }, { new: true })
  if (!category) return res.status(404).json({ error: 'Not found' })
  return res.json({ category: category.toJSON() })
})

router.delete('/categories', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  const id = req.query.id as string
  await Category.deleteOne({ _id: id, shopId: tenant.shopId })
  return res.json({ ok: true })
})

router.get('/orders', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  const filter: Record<string, unknown> = { shopId: tenant.shopId }
  if (req.query.status) filter.status = req.query.status
  const orders = await Order.find(filter).populate('customerId').sort({ createdAt: -1 }).limit(200).lean()
  return res.json({
    orders: orders.map((o) => ({
      ...o,
      id: String(o._id),
      customer: o.customerId && typeof o.customerId === 'object' ? { ...o.customerId, id: String((o.customerId as any)._id) } : o.customerId,
      customerId: String(o.customerId),
    })),
  })
})

router.patch('/orders', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  const { id, status, notes } = req.body
  const order = await Order.findOneAndUpdate({ _id: id, shopId: tenant.shopId }, { status, notes }, { new: true })
  if (!order) return res.status(404).json({ error: 'Not found' })
  return res.json({ order: order.toJSON() })
})

router.get('/customers', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  const customers = await Customer.find({ shopId: tenant.shopId }).sort({ createdAt: -1 }).limit(200).lean()
  const enriched = await Promise.all(
    customers.map(async (c) => {
      const [orderCount, convCount, latestOrder] = await Promise.all([
        Order.countDocuments({ customerId: c._id }),
        Conversation.countDocuments({ customerId: c._id }),
        Order.findOne({ customerId: c._id }).sort({ createdAt: -1 }).lean(),
      ])
      return {
        ...c,
        id: String(c._id),
        _count: { orders: orderCount, conversations: convCount },
        orders: latestOrder ? [{ ...latestOrder, id: String(latestOrder._id) }] : [],
      }
    })
  )
  return res.json({ customers: enriched })
})

router.patch('/customers', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  const { id, name, notes, tags } = req.body
  const customer = await Customer.findOneAndUpdate(
    { _id: id, shopId: tenant.shopId },
    { name, notes, tags: tags !== undefined ? (Array.isArray(tags) ? tags.join(',') : tags) : undefined },
    { new: true }
  )
  if (!customer) return res.status(404).json({ error: 'Not found' })
  return res.json({ customer: customer.toJSON() })
})

router.delete('/customers', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  await Customer.deleteOne({ _id: req.query.id, shopId: tenant.shopId })
  return res.json({ ok: true })
})

router.get('/conversations', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  const conversationId = req.query.conversationId as string | undefined
  if (conversationId) {
    const conversation = await Conversation.findOne({ _id: conversationId, shopId: tenant.shopId })
      .populate('customerId')
      .lean()
    if (!conversation) return res.json({ conversation: null })
    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 }).lean()
    return res.json({
      conversation: {
        ...conversation,
        id: String(conversation._id),
        customer: conversation.customerId,
        messages: messages.map((m) => ({ ...m, id: String(m._id), metadata: m.metadata ? JSON.parse(m.metadata) : null })),
      },
    })
  }
  const conversations = await Conversation.find({ shopId: tenant.shopId }).populate('customerId').sort({ updatedAt: -1 }).limit(100).lean()
  const result = await Promise.all(
    conversations.map(async (c) => {
      const [lastMsg, count] = await Promise.all([
        Message.findOne({ conversationId: c._id }).sort({ createdAt: -1 }).lean(),
        Message.countDocuments({ conversationId: c._id }),
      ])
      return {
        ...c,
        id: String(c._id),
        customer: c.customerId,
        messages: lastMsg ? [{ ...lastMsg, id: String(lastMsg._id) }] : [],
        _count: { messages: count },
      }
    })
  )
  return res.json({ conversations: result })
})

router.post('/conversations', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  const { phone, name } = req.body
  if (!phone) return res.status(400).json({ error: 'phone required' })
  let customer = await Customer.findOne({ shopId: tenant.shopId, phone })
  if (!customer) {
    customer = await Customer.create({ shopId: tenant.shopId, phone, name: name || phone })
  }
  const conversation = await Conversation.create({
    shopId: tenant.shopId,
    customerId: customer._id,
    channel: 'simulator',
    status: 'active',
  })
  await conversation.populate('customerId')
  return res.json({ conversation: { ...conversation.toJSON(), customer: customer.toJSON() } })
})

router.get('/messages', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  const conversationId = req.query.conversationId as string
  if (!conversationId) return res.json({ messages: [] })
  const messages = await Message.find({ conversationId }).sort({ createdAt: 1 }).lean()
  return res.json({
    messages: messages.map((m) => ({ ...m, id: String(m._id), metadata: m.metadata ? JSON.parse(m.metadata) : null })),
  })
})

router.post('/messages', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  const { conversationId, text } = req.body
  if (!conversationId || !text) return res.status(400).json({ error: 'conversationId and text required' })
  const conversation = await Conversation.findOne({ _id: conversationId, shopId: tenant.shopId }).populate('customerId')
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' })
  const shop = await Shop.findById(tenant.shopId)
  const result = await handleCustomerMessage(tenant.shopId, conversationId, text, {
    channel: conversation.channel,
    relayWhatsApp: conversation.channel === 'whatsapp' && !!shop?.whatsappConnected,
    customerPhone: (conversation.customerId as any)?.phone,
  })
  return res.json({ messages: result.messages, ended: result.ended })
})

router.patch('/messages', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  const { conversationId, text } = req.body
  const conversation = await Conversation.findOne({ _id: conversationId, shopId: tenant.shopId }).populate('customerId')
  if (!conversation) return res.status(404).json({ error: 'Not found' })
  const shop = await Shop.findById(tenant.shopId)
  const msg = await Message.create({ conversationId, sender: 'shop', text, type: 'text' })
  if (conversation.channel === 'whatsapp' && shop?.whatsappConnected) {
    await sendWhatsAppText(tenant.shopId, (conversation.customerId as any).phone, text)
  }
  await Conversation.findByIdAndUpdate(conversationId, { updatedAt: new Date() })
  return res.json({ message: msg.toJSON() })
})

router.get('/flow', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  const [nodes, edges] = await Promise.all([
    FlowNode.find({ shopId: tenant.shopId }).lean(),
    FlowEdge.find({ shopId: tenant.shopId }).lean(),
  ])
  return res.json({
    nodes: nodes.map((n) => ({ ...n, id: String(n._id), data: n.data ? JSON.parse(n.data) : {} })),
    edges: edges.map((e) => ({
      ...e,
      id: String(e._id),
      sourceNodeId: String(e.sourceNodeId),
      targetNodeId: String(e.targetNodeId),
    })),
  })
})

router.post('/flow', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  const body = req.body
  if (body.isStart) await FlowNode.updateMany({ shopId: tenant.shopId }, { isStart: false })
  const node = await FlowNode.create({
    shopId: tenant.shopId,
    type: body.type || 'message',
    title: body.title || 'New node',
    data: JSON.stringify(body.data || {}),
    positionX: body.positionX ?? 0,
    positionY: body.positionY ?? 0,
    isStart: body.isStart || false,
  })
  return res.json({ node: { ...node.toJSON(), data: body.data || {} } })
})

router.patch('/flow', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  const { id, type, title, data, positionX, positionY, isStart } = req.body
  if (isStart) await FlowNode.updateMany({ shopId: tenant.shopId }, { isStart: false })
  const update: Record<string, unknown> = {}
  if (type !== undefined) update.type = type
  if (title !== undefined) update.title = title
  if (data !== undefined) update.data = JSON.stringify(data)
  if (positionX !== undefined) update.positionX = positionX
  if (positionY !== undefined) update.positionY = positionY
  if (isStart !== undefined) update.isStart = isStart
  const node = await FlowNode.findByIdAndUpdate(id, update, { new: true })
  return res.json({ node: { ...node?.toJSON(), data: data ?? (node?.data ? JSON.parse(node.data) : {}) } })
})

router.delete('/flow', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  const id = req.query.id as string
  await FlowEdge.deleteMany({ shopId: tenant.shopId, $or: [{ sourceNodeId: id }, { targetNodeId: id }] })
  await FlowNode.deleteOne({ _id: id })
  return res.json({ ok: true })
})

router.get('/flow/edges', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  const edges = await FlowEdge.find({ shopId: tenant.shopId }).lean()
  return res.json({ edges: edges.map((e) => ({ ...e, id: String(e._id) })) })
})

router.post('/flow/edges', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  const { sourceNodeId, targetNodeId, label, condition } = req.body
  const existing = await FlowEdge.findOne({ shopId: tenant.shopId, sourceNodeId, targetNodeId })
  if (existing) return res.json({ edge: existing.toJSON() })
  const edge = await FlowEdge.create({ shopId: tenant.shopId, sourceNodeId, targetNodeId, label, condition })
  return res.json({ edge: edge.toJSON() })
})

router.patch('/flow/edges', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  const { id, label, condition } = req.body
  const edge = await FlowEdge.findByIdAndUpdate(id, { label, condition }, { new: true })
  return res.json({ edge: edge?.toJSON() })
})

router.delete('/flow/edges', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  await FlowEdge.deleteOne({ _id: req.query.id })
  return res.json({ ok: true })
})

router.get('/analytics', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  const shopId = tenant.shopId
  const now = new Date()
  const last30Days = new Date(now.getTime() - 30 * 86400000)
  const [allOrders, orders30, customers, conversations, products] = await Promise.all([
    Order.find({ shopId }).lean(),
    Order.find({ shopId, createdAt: { $gte: last30Days } }).populate('customerId').sort({ createdAt: -1 }).lean(),
    Customer.countDocuments({ shopId }),
    Conversation.countDocuments({ shopId }),
    Product.countDocuments({ shopId }),
  ])
  const totalRevenue = allOrders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)
  const statusBreakdown: Record<string, number> = {}
  for (const o of allOrders) statusBreakdown[o.status] = (statusBreakdown[o.status] || 0) + 1
  const productCounts: Record<string, { name: string; count: number; revenue: number }> = {}
  for (const o of allOrders) {
    if (o.status === 'cancelled') continue
    for (const it of o.items) {
      const key = it.productId || it.name
      if (!productCounts[key]) productCounts[key] = { name: it.name, count: 0, revenue: 0 }
      productCounts[key].count += it.quantity
      productCounts[key].revenue += it.total
    }
  }
  const dailyRevenue = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    const day = d.toISOString().slice(0, 10)
    const dayOrders = allOrders.filter((o) => new Date(o.createdAt).toISOString().slice(0, 10) === day && o.status !== 'cancelled')
    dailyRevenue.push({ date: day, revenue: dayOrders.reduce((s, o) => s + o.total, 0), orders: dayOrders.length })
  }
  return res.json({
    analytics: {
      totalOrders: allOrders.length,
      totalRevenue,
      totalCustomers: customers,
      totalConversations: conversations,
      totalProducts: products,
      statusBreakdown,
      topProducts: Object.values(productCounts).sort((a, b) => b.count - a.count).slice(0, 5),
      dailyRevenue,
      recentOrders: orders30.slice(0, 5).map((o) => ({
        id: String(o._id),
        customerName: (o.customerId as any)?.name || 'Unknown',
        total: o.total,
        status: o.status,
        createdAt: o.createdAt,
      })),
      avgOrderValue: allOrders.length ? totalRevenue / allOrders.length : 0,
      last30Days: {
        orders: orders30.length,
        revenue: orders30.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0),
      },
    },
  })
})

router.post('/seed', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  await wipeShopData(tenant.shopId)
  await seedDefaultFlow(tenant.shopId)
  const shop = await Shop.findById(tenant.shopId)
  return res.json({ ok: true, shop: shop?.toJSON() })
})

router.post('/whatsapp/connect', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  try {
    return res.json(await connectWhatsapp(tenant.shopId))
  } catch {
    return res.status(503).json({ error: 'WhatsApp worker unavailable' })
  }
})

router.post('/whatsapp/disconnect', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  try {
    await disconnectWhatsapp(tenant.shopId)
    return res.json({ ok: true })
  } catch {
    return res.status(503).json({ error: 'WhatsApp worker unavailable' })
  }
})

router.get('/whatsapp/status', async (req, res) => {
  const tenant = await guard(req, res)
  if (!tenant) return
  try {
    return res.json(await getWhatsappStatus(tenant.shopId))
  } catch {
    const session = await getWhatsappSession(tenant.shopId)
    return res.json({
      status: session?.status || 'disconnected',
      linkedPhone: session?.linkedPhone,
      qrDataUrl: session?.qrDataUrl,
      errorMessage: session?.errorMessage,
    })
  }
})

router.get('/whatsapp/webhook', (req, res) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge)
  }
  return res.status(403).json({ error: 'Forbidden' })
})

router.post('/whatsapp/webhook', (_req, res) => {
  return res.json({ ok: true, message: 'Use QR connect via /api/whatsapp/connect' })
})

router.get('/onboarding', requireAuth, async (req, res) => {
  const user = await User.findById(req.user!.id).lean()
  const subscription = await Subscription.findOne({ userId: req.user!.id }).lean()
  const shop = await Shop.findOne({ userId: req.user!.id, isDemo: false }).lean()
  return res.json({
    user: {
      id: String(user?._id),
      name: user?.name,
      email: user?.email,
      onboardingStep: user?.onboardingStep ?? 0,
      onboardingDone: user?.onboardingDone ?? false,
      subscription,
      shop: shop ? { ...shop, id: String(shop._id) } : null,
    },
  })
})

router.patch('/onboarding', requireAuth, async (req, res) => {
  const body = req.body
  const data: Record<string, unknown> = {}
  if (body.onboardingStep !== undefined) data.onboardingStep = body.onboardingStep
  if (body.onboardingDone !== undefined) data.onboardingDone = body.onboardingDone
  if (body.tutorialDismissed !== undefined) data.tutorialDismissed = body.tutorialDismissed
  if (body.name !== undefined) data.name = body.name
  const user = await User.findByIdAndUpdate(req.user!.id, data, { new: true })
  if (body.shop) {
    await Shop.findOneAndUpdate({ userId: req.user!.id, isDemo: false }, body.shop)
  }
  return res.json({ ok: true, user: user?.toJSON() })
})

export default router
