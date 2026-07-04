import { cloneDemoState } from './demo-data'
import { processDemoFlowMessage, serializeContext } from './demo-flow-engine'

type DemoState = ReturnType<typeof cloneDemoState>

let state: DemoState = cloneDemoState()

export function resetDemoStore() {
  state = cloneDemoState()
}

export function getDemoState() {
  return state
}

function newId(prefix: string) {
  state.nextId += 1
  return `demo-${prefix}-${state.nextId}`
}

function parsePath(url: string) {
  const u = url.replace(/^\/api/, '')
  const [path, qs] = u.split('?')
  const params = new URLSearchParams(qs || '')
  return { path, params }
}

export async function handleDemoApi(url: string, options?: RequestInit): Promise<unknown> {
  const method = (options?.method || 'GET').toUpperCase()
  const { path, params } = parsePath(url)
  const body = options?.body ? JSON.parse(options.body as string) : {}

  if (path === '/shops' && method === 'GET') {
    return {
      shop: {
        ...state.shop,
        categories: state.categories,
        _count: {
          products: state.products.length,
          orders: state.orders.length,
          customers: state.customers.length,
          conversations: state.conversations.length,
        },
      },
    }
  }

  if (path === '/shops' && method === 'PATCH') {
    state.shop = { ...state.shop, ...body }
    return { shop: state.shop }
  }

  if (path === '/products') {
    if (method === 'GET') return { products: state.products }
    if (method === 'POST') {
      const product = {
        id: newId('prod'),
        shopId: state.shop.id,
        ...body,
        price: parseFloat(body.price),
        category: state.categories.find((c) => c.id === body.categoryId),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      state.products.push(product)
      return { product }
    }
    if (method === 'PATCH') {
      const idx = state.products.findIndex((p) => p.id === body.id)
      if (idx < 0) throw new Error('Not found')
      state.products[idx] = { ...state.products[idx], ...body, price: body.price !== undefined ? parseFloat(body.price) : state.products[idx].price }
      return { product: state.products[idx] }
    }
    if (method === 'DELETE') {
      state.products = state.products.filter((p) => p.id !== params.get('id'))
      return { ok: true }
    }
  }

  if (path === '/categories') {
    if (method === 'GET') return { categories: state.categories }
    if (method === 'POST') {
      const category = { id: newId('cat'), shopId: state.shop.id, ...body, _count: { products: 0 } }
      state.categories.push(category)
      return { category }
    }
    if (method === 'PATCH') {
      const idx = state.categories.findIndex((c) => c.id === body.id)
      if (idx < 0) throw new Error('Not found')
      state.categories[idx] = { ...state.categories[idx], ...body }
      return { category: state.categories[idx] }
    }
    if (method === 'DELETE') {
      state.categories = state.categories.filter((c) => c.id !== params.get('id'))
      return { ok: true }
    }
  }

  if (path === '/orders') {
    if (method === 'GET') {
      const status = params.get('status')
      const orders = status ? state.orders.filter((o) => o.status === status) : state.orders
      return { orders }
    }
    if (method === 'PATCH') {
      const idx = state.orders.findIndex((o) => o.id === body.id)
      if (idx < 0) throw new Error('Not found')
      state.orders[idx] = { ...state.orders[idx], ...body }
      return { order: state.orders[idx] }
    }
  }

  if (path === '/customers') {
    if (method === 'GET') return { customers: state.customers }
    if (method === 'PATCH') {
      const idx = state.customers.findIndex((c) => c.id === body.id)
      if (idx < 0) throw new Error('Not found')
      state.customers[idx] = { ...state.customers[idx], ...body }
      return { customer: state.customers[idx] }
    }
    if (method === 'DELETE') {
      state.customers = state.customers.filter((c) => c.id !== params.get('id'))
      return { ok: true }
    }
  }

  if (path === '/conversations') {
    if (method === 'GET') {
      const cid = params.get('conversationId')
      if (cid) {
        const conversation = state.conversations.find((c) => c.id === cid)
        return { conversation }
      }
      const conversations = state.conversations.map((c) => ({
        ...c,
        messages: c.messages.slice(-1),
      }))
      return { conversations }
    }
    if (method === 'POST') {
      let customer = state.customers.find((c) => c.phone === body.phone)
      if (!customer) {
        customer = {
          id: newId('cust'),
          shopId: state.shop.id,
          name: body.name || body.phone,
          phone: body.phone,
          notes: null,
          tags: null,
          createdAt: new Date().toISOString(),
          _count: { orders: 0, conversations: 0 },
          orders: [],
        }
        state.customers.push(customer)
      }
      const conversation = {
        id: newId('conv'),
        shopId: state.shop.id,
        customerId: customer.id,
        customer,
        channel: 'simulator',
        status: 'active',
        currentNodeId: null as string | null,
        context: null as string | null,
        updatedAt: new Date().toISOString(),
        messages: [] as typeof state.conversations[0]['messages'],
        _count: { messages: 0 },
      }
      state.conversations.unshift(conversation)
      return { conversation }
    }
  }

  if (path === '/messages') {
    if (method === 'GET') {
      const cid = params.get('conversationId')
      const conv = state.conversations.find((c) => c.id === cid)
      return { messages: conv?.messages || [] }
    }
    if (method === 'POST') {
      const { conversationId, text } = body
      const conv = state.conversations.find((c) => c.id === conversationId)
      if (!conv) throw new Error('Conversation not found')
      const customerMsg = {
        id: newId('msg'),
        conversationId,
        sender: 'customer',
        text,
        type: 'text',
        metadata: null,
        createdAt: new Date().toISOString(),
      }
      conv.messages.push(customerMsg)

      const flowResult = processDemoFlowMessage(
        state,
        conversationId,
        text,
        (conv as { context?: string | null }).context,
        (conv as { currentNodeId?: string | null }).currentNodeId
      )

      ;(conv as { context?: string | null }).context = serializeContext(flowResult.newContext)
      ;(conv as { currentNodeId?: string | null }).currentNodeId = flowResult.newContext.currentNodeId
      if (flowResult.ended) conv.status = 'resolved'

      const botMessages = flowResult.replies.map((r) => ({
        id: newId('msg'),
        conversationId,
        sender: 'bot',
        text: r.text,
        type: 'text',
        metadata: null,
        createdAt: new Date().toISOString(),
        delayMs: r.delayMs,
      }))
      conv.messages.push(...botMessages)
      conv.updatedAt = new Date().toISOString()
      conv._count.messages = conv.messages.length
      return {
        messages: [customerMsg],
        botReplies: botMessages,
        ended: flowResult.ended,
      }
    }
    if (method === 'PATCH') {
      const { conversationId, text } = body
      const conv = state.conversations.find((c) => c.id === conversationId)
      if (!conv) throw new Error('Not found')
      const msg = {
        id: newId('msg'),
        conversationId,
        sender: 'shop',
        text,
        type: 'text',
        metadata: null,
        createdAt: new Date().toISOString(),
      }
      conv.messages.push(msg)
      conv.updatedAt = new Date().toISOString()
      return { message: msg }
    }
  }

  if (path === '/flow') {
    if (method === 'GET') return { nodes: state.flowNodes, edges: state.flowEdges }
    if (method === 'POST') {
      const node = {
        id: newId('node'),
        shopId: state.shop.id,
        type: body.type || 'message',
        title: body.title || 'New node',
        data: body.data || {},
        positionX: body.positionX ?? 0,
        positionY: body.positionY ?? 0,
        isStart: body.isStart || false,
      }
      if (node.isStart) state.flowNodes.forEach((n) => (n.isStart = false))
      state.flowNodes.push(node)
      return { node }
    }
    if (method === 'PATCH') {
      const idx = state.flowNodes.findIndex((n) => n.id === body.id)
      if (idx < 0) throw new Error('Not found')
      if (body.isStart) state.flowNodes.forEach((n) => (n.isStart = false))
      state.flowNodes[idx] = { ...state.flowNodes[idx], ...body, data: body.data ?? state.flowNodes[idx].data }
      return { node: state.flowNodes[idx] }
    }
    if (method === 'DELETE') {
      const nid = params.get('id')
      state.flowEdges = state.flowEdges.filter((e) => e.sourceNodeId !== nid && e.targetNodeId !== nid)
      state.flowNodes = state.flowNodes.filter((n) => n.id !== nid)
      return { ok: true }
    }
  }

  if (path === '/flow/edges') {
    if (method === 'GET') return { edges: state.flowEdges }
    if (method === 'POST') {
      const existing = state.flowEdges.find(
        (e) => e.sourceNodeId === body.sourceNodeId && e.targetNodeId === body.targetNodeId
      )
      if (existing) return { edge: existing }
      const edge = { id: newId('edge'), shopId: state.shop.id, ...body }
      state.flowEdges.push(edge)
      return { edge }
    }
    if (method === 'PATCH') {
      const idx = state.flowEdges.findIndex((e) => e.id === body.id)
      if (idx < 0) throw new Error('Not found')
      state.flowEdges[idx] = { ...state.flowEdges[idx], ...body }
      return { edge: state.flowEdges[idx] }
    }
    if (method === 'DELETE') {
      state.flowEdges = state.flowEdges.filter((e) => e.id !== params.get('id'))
      return { ok: true }
    }
  }

  if (path === '/analytics' && method === 'GET') {
    const allOrders = state.orders
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
    const now = new Date()
    const dailyRevenue: { date: string; revenue: number; orders: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000)
      const day = d.toISOString().slice(0, 10)
      const dayOrders = allOrders.filter((o) => o.createdAt.slice(0, 10) === day && o.status !== 'cancelled')
      dailyRevenue.push({ date: day, revenue: dayOrders.reduce((s, o) => s + o.total, 0), orders: dayOrders.length })
    }
    return {
      analytics: {
        totalOrders: allOrders.length,
        totalRevenue,
        totalCustomers: state.customers.length,
        totalConversations: state.conversations.length,
        totalProducts: state.products.length,
        statusBreakdown,
        topProducts: Object.values(productCounts).sort((a, b) => b.count - a.count).slice(0, 5),
        dailyRevenue,
        recentOrders: allOrders.slice(0, 5).map((o) => ({
          id: o.id,
          customerName: o.customer?.name || 'Unknown',
          total: o.total,
          status: o.status,
          createdAt: o.createdAt,
        })),
        avgOrderValue: allOrders.length ? totalRevenue / allOrders.length : 0,
        last30Days: { orders: allOrders.length, revenue: totalRevenue },
      },
    }
  }

  if (path === '/seed' && method === 'POST') {
    resetDemoStore()
    return { ok: true, shop: state.shop }
  }

  if (path === '/whatsapp/status') {
    return { status: 'disconnected', errorMessage: 'Demo mode — sign up to connect real WhatsApp' }
  }

  if (path === '/whatsapp/connect') {
    throw new Error('Sign up to connect WhatsApp')
  }

  throw new Error(`Demo API not implemented: ${method} ${path}`)
}
