import type { cloneDemoState } from './demo-data'

export type DemoState = ReturnType<typeof cloneDemoState>

type FlowNodeType =
  | 'start'
  | 'message'
  | 'menu'
  | 'question'
  | 'collect'
  | 'branch'
  | 'place_order'
  | 'end'

interface FlowNodeData {
  message?: string
  variable?: string
  prompt?: string
  options?: { label: string; value: string }[]
  categoryIds?: string[]
  showPrices?: boolean
  allowOrdering?: boolean
  endMessage?: string
}

interface ParsedFlowNode {
  id: string
  type: FlowNodeType
  title: string
  data: FlowNodeData
  outgoing: ParsedFlowEdge[]
  isStart?: boolean
}

interface ParsedFlowEdge {
  sourceNodeId: string
  targetNodeId: string
  label?: string | null
  condition?: string | null
}

interface FlowGraph {
  nodes: ParsedFlowNode[]
  startNodeId: string | null
}

export interface ConversationContext {
  currentNodeId: string | null
  vars: Record<string, string | number>
  cart: { productId: string; name: string; price: number; quantity: number }[]
  history: string[]
  awaitingOrderId?: boolean
  awaitingItemSelection?: boolean
  lastMenuProducts?: { id: string; name: string; price: number; unit?: string | null }[]
  ended?: boolean
  skipNextInput?: boolean
}

export interface DemoBotReply {
  text: string
  delayMs: number
}

export interface DemoFlowResult {
  replies: DemoBotReply[]
  newContext: ConversationContext
  ended: boolean
}

function loadFlowGraph(state: DemoState): FlowGraph {
  const parsedNodes: ParsedFlowNode[] = state.flowNodes.map((n) => ({
    id: n.id,
    type: n.type as FlowNodeType,
    title: n.title,
    data: (typeof n.data === 'object' ? n.data : {}) as FlowNodeData,
    outgoing: [],
    isStart: n.isStart,
  }))

  const nodeMap = new Map(parsedNodes.map((n) => [n.id, n]))
  for (const edge of state.flowEdges) {
    const src = nodeMap.get(edge.sourceNodeId)
    if (src) {
      src.outgoing.push({
        sourceNodeId: edge.sourceNodeId,
        targetNodeId: edge.targetNodeId,
        label: edge.label,
        condition: edge.condition,
      })
    }
  }

  const startNode =
    parsedNodes.find((n) => n.isStart) || parsedNodes.find((n) => n.type === 'start') || null

  return { nodes: parsedNodes, startNodeId: startNode?.id ?? null }
}

export function parseContext(raw: string | null | undefined): ConversationContext {
  const base: ConversationContext = {
    currentNodeId: null,
    vars: {},
    cart: [],
    history: [],
  }
  if (!raw) return base
  try {
    return { ...base, ...(JSON.parse(raw) as Partial<ConversationContext>) }
  } catch {
    return base
  }
}

export function serializeContext(ctx: ConversationContext): string {
  return JSON.stringify(ctx)
}

function typingDelay(index: number, text: string): number {
  const base = 500 + index * 400
  const reading = Math.min(text.length * 10, 1400)
  return base + reading + Math.floor(Math.random() * 250)
}

function pickNext(node: ParsedFlowNode, condition: string | undefined): string | null {
  if (!node.outgoing.length) return null
  if (condition !== undefined) {
    const lower = condition.toLowerCase().trim()
    const exact = node.outgoing.find((e) => (e.condition || '').toLowerCase() === lower)
    if (exact) return exact.targetNodeId
    const byLabel = node.outgoing.find((e) => (e.label || '').toLowerCase() === lower)
    if (byLabel) return byLabel.targetNodeId
  }
  const noCond = node.outgoing.find((e) => !e.condition && !e.label)
  if (noCond) return noCond.targetNodeId
  return node.outgoing[0].targetNodeId
}

function matchOption(input: string, options: { label: string; value: string }[]) {
  const t = input.trim().toLowerCase()
  const num = parseInt(t, 10)
  if (!Number.isNaN(num) && num >= 1 && num <= options.length) return options[num - 1]
  return options.find((o) => o.value.toLowerCase() === t || o.label.toLowerCase() === t) || null
}

function renderTemplate(text: string, ctx: ConversationContext): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => String(ctx.vars[k] ?? ''))
}

function buildMenuMessage(state: DemoState, data: FlowNodeData, ctx: ConversationContext) {
  let products = state.products.filter((p) => p.isAvailable)
  if (data.categoryIds?.length) {
    products = products.filter((p) => data.categoryIds!.includes(p.categoryId))
  }
  products = products.slice(0, 12)

  const lines: string[] = [data.message || '🛒 *Our Menu*']
  products.forEach((p, i) => {
    const price = data.showPrices === false ? '' : ` — ₹${p.price}`
    lines.push(`${i + 1}. ${p.name}${price}${p.unit ? ` / ${p.unit}` : ''}`)
  })
  lines.push('')
  if (data.allowOrdering) {
    lines.push('_Reply with item numbers like "2, 3, 5" to add to cart, or "0" to checkout._')
  }

  ctx.lastMenuProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    unit: p.unit,
  }))

  return lines.join('\n')
}

function handleItemSelection(
  state: DemoState,
  ctx: ConversationContext,
  input: string,
  graph: FlowGraph,
  texts: string[]
): boolean {
  const t = input.trim().toLowerCase()
  if (!t) return false

  if (t === '0' || t === 'checkout' || t === 'done') {
    ctx.awaitingItemSelection = false
    if (ctx.cart.length === 0) {
      texts.push('Your cart is empty. Reply with item numbers or type "menu" to see options again.')
      ctx.awaitingItemSelection = true
      return true
    }
    const summary = ctx.cart
      .map((i) => `• ${i.quantity}× ${i.name} — ₹${(i.price * i.quantity).toFixed(0)}`)
      .join('\n')
    const total = ctx.cart.reduce((s, i) => s + i.price * i.quantity, 0)
    texts.push(
      `🛍️ *Your Cart*\n${summary}\n\n*Total: ₹${total.toFixed(0)}*\n\nType *confirm* to place your order, or send more item numbers to add.`
    )
    ctx.awaitingOrderId = true
    return true
  }

  if (t === 'menu' || t === 'start') {
    ctx.awaitingItemSelection = false
    ctx.awaitingOrderId = false
    return false
  }

  if (ctx.awaitingOrderId && (t === 'confirm' || t === 'yes' || t === 'ok' || t === 'place order')) {
    ctx.awaitingOrderId = false
    ctx.awaitingItemSelection = false
    const menuNode = graph.nodes.find((n) => n.id === ctx.currentNodeId)
    if (menuNode) {
      const nextId = pickNext(menuNode, undefined)
      if (nextId) ctx.currentNodeId = nextId
    }
    texts.push('✅ Great! Your order is noted. Let me collect delivery details…')
    ctx.skipNextInput = true
    return false
  }

  const nums = t
    .split(/[,\s]+/)
    .map((x) => parseInt(x, 10))
    .filter((n) => !Number.isNaN(n) && n >= 1)

  if (nums.length === 0) return false

  const products = ctx.lastMenuProducts || []
  const added: string[] = []
  for (const n of nums) {
    const p = products[n - 1]
    if (!p) continue
    const existing = ctx.cart.find((c) => c.productId === p.id)
    if (existing) {
      existing.quantity += 1
      added.push(`${existing.quantity}× ${p.name}`)
    } else {
      ctx.cart.push({ productId: p.id, name: p.name, price: p.price, quantity: 1 })
      added.push(`1× ${p.name}`)
    }
  }

  if (added.length === 0) {
    texts.push('Sorry, those item numbers are not on the menu. Try again (e.g. "2, 3, 5").')
    return true
  }

  texts.push(`✅ Added: ${added.join(', ')}\n\nSend more numbers to add items, or *0* to checkout.`)
  return true
}

function placeDemoOrder(state: DemoState, ctx: ConversationContext, conversationId: string) {
  const conv = state.conversations.find((c) => c.id === conversationId)
  const customer = conv ? state.customers.find((c) => c.id === conv.customerId) : null
  const total = ctx.cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const orderNum = state.orders.length + 1
  const order = {
    id: `demo-order-${orderNum}`,
    shopId: state.shop.id,
    customerId: conv?.customerId || 'demo',
    customer,
    status: 'pending',
    total,
    type: 'delivery',
    address: ctx.vars.address ? String(ctx.vars.address) : 'Address pending',
    notes: ctx.vars.notes ? String(ctx.vars.notes) : null,
    items: ctx.cart.map((i) => ({
      id: `demo-oitem-${orderNum}-${i.productId}`,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      total: i.price * i.quantity,
      productId: i.productId,
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  state.orders.unshift(order)
  return order
}

function walkFlow(
  state: DemoState,
  ctx: ConversationContext,
  graph: FlowGraph,
  customerInput: string,
  texts: string[],
  conversationId: string
) {
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]))
  let steps = 0
  let currentNode = ctx.currentNodeId ? nodeMap.get(ctx.currentNodeId) : null
  let input = customerInput

  while (currentNode && steps < 12) {
    steps++
    ctx.history.push(currentNode.id)
    if (ctx.history.length > 50) ctx.history.shift()

    switch (currentNode.type) {
      case 'start': {
        const next = pickNext(currentNode, undefined)
        if (!next) {
          ctx.ended = true
          texts.push('Welcome! Type anything to get started.')
          return
        }
        currentNode = nodeMap.get(next)!
        break
      }

      case 'message': {
        texts.push(renderTemplate(currentNode.data.message || '', ctx))
        const next = pickNext(currentNode, undefined)
        if (!next) {
          ctx.ended = true
          return
        }
        currentNode = nodeMap.get(next)!
        break
      }

      case 'menu': {
        texts.push(buildMenuMessage(state, currentNode.data, ctx))
        if (currentNode.data.allowOrdering) {
          ctx.awaitingItemSelection = true
          ctx.currentNodeId = currentNode.id
          return
        }
        const next = pickNext(currentNode, undefined)
        if (!next) {
          ctx.ended = true
          return
        }
        currentNode = nodeMap.get(next)!
        break
      }

      case 'question': {
        const options = currentNode.data.options || []
        if (options.length > 0) {
          if (input) {
            const match = matchOption(input, options)
            if (match) {
              if (currentNode.data.variable) ctx.vars[currentNode.data.variable] = match.value
              const next = pickNext(currentNode, match.value)
              if (!next) {
                ctx.ended = true
                return
              }
              currentNode = nodeMap.get(next)!
              input = ''
              break
            }
            texts.push("Sorry, I didn't catch that. Reply with the option number (e.g. *1*).")
            ctx.currentNodeId = currentNode.id
            return
          }
          const optsText = options.map((o, i) => `${i + 1}. ${o.label}`).join('\n')
          texts.push(`${currentNode.data.prompt || currentNode.title}\n\n${optsText}`)
          ctx.currentNodeId = currentNode.id
          return
        }
        texts.push(currentNode.data.prompt || currentNode.title)
        ctx.currentNodeId = currentNode.id
        if (input) {
          if (currentNode.data.variable) ctx.vars[currentNode.data.variable] = input
          const next = pickNext(currentNode, undefined)
          if (!next) {
            ctx.ended = true
            return
          }
          currentNode = nodeMap.get(next)!
          input = ''
        } else {
          return
        }
        break
      }

      case 'collect': {
        if (!input) {
          texts.push(currentNode.data.prompt || 'Please enter your response:')
          ctx.currentNodeId = currentNode.id
          return
        }
        if (currentNode.data.variable) {
          const val = input.trim().toLowerCase() === 'no' ? '' : input
          ctx.vars[currentNode.data.variable] = val
        }
        const next = pickNext(currentNode, undefined)
        if (!next) {
          ctx.ended = true
          return
        }
        currentNode = nodeMap.get(next)!
        input = ''
        break
      }

      case 'branch': {
        const variable = currentNode.data.variable || ''
        const value = String(ctx.vars[variable] || '').toLowerCase()
        const next = pickNext(currentNode, value) || pickNext(currentNode, undefined)
        if (!next) {
          ctx.ended = true
          return
        }
        currentNode = nodeMap.get(next)!
        break
      }

      case 'place_order': {
        if (ctx.cart.length === 0) {
          texts.push('Your cart is empty. Type *menu* to browse and add items first.')
          ctx.ended = false
          return
        }
        const order = placeDemoOrder(state, ctx, conversationId)
        const summary = ctx.cart
          .map((i) => `• ${i.quantity}× ${i.name} — ₹${(i.price * i.quantity).toFixed(0)}`)
          .join('\n')
        const total = ctx.cart.reduce((s, i) => s + i.price * i.quantity, 0)
        texts.push(
          `🧾 *Order #${order.id.slice(-4).toUpperCase()} placed!*\n${summary}\n\n*Total: ₹${total.toFixed(0)}*\n\nWe'll confirm shortly. Type *menu* to order again.`
        )
        ctx.vars.__lastOrderId = order.id
        ctx.cart = []
        const next = pickNext(currentNode, undefined)
        if (!next) {
          ctx.ended = true
          ctx.currentNodeId = currentNode.id
          return
        }
        currentNode = nodeMap.get(next)!
        break
      }

      case 'end': {
        texts.push(renderTemplate(currentNode.data.endMessage || 'Thank you! See you soon. 🙏', ctx))
        ctx.ended = true
        ctx.currentNodeId = currentNode.id
        return
      }

      default:
        ctx.ended = true
        return
    }
  }

  ctx.currentNodeId = currentNode?.id || null
}

export function processDemoFlowMessage(
  state: DemoState,
  conversationId: string,
  customerInput: string,
  existingContext?: string | null,
  existingNodeId?: string | null
): DemoFlowResult {
  const graph = loadFlowGraph(state)
  const ctx = parseContext(existingContext)
  ctx.currentNodeId = existingNodeId ?? ctx.currentNodeId

  if (!ctx.vars.shopName) ctx.vars.shopName = state.shop.name
  if (!ctx.vars.name && state.conversations.find((c) => c.id === conversationId)?.customer?.name) {
    ctx.vars.name = state.conversations.find((c) => c.id === conversationId)!.customer!.name
  }

  const texts: string[] = []

  if (ctx.ended || !graph.startNodeId) {
    texts.push("Thanks for reaching out! Type *menu* to start a new order.")
    return {
      replies: texts.map((text, i) => ({ text, delayMs: typingDelay(i, text) })),
      newContext: ctx,
      ended: true,
    }
  }

  const wasWaiting = !!ctx.currentNodeId
  const trimmed = customerInput.trim()

  if (ctx.awaitingItemSelection || ctx.awaitingOrderId) {
    const handled = handleItemSelection(state, ctx, trimmed, graph, texts)
    if (handled) {
      return {
        replies: texts.map((text, i) => ({ text, delayMs: typingDelay(i, text) })),
        newContext: ctx,
        ended: false,
      }
    }
  }

  if (!ctx.currentNodeId) ctx.currentNodeId = graph.startNodeId

  const effectiveInput = ctx.skipNextInput ? '' : wasWaiting ? trimmed : ''
  ctx.skipNextInput = false

  walkFlow(state, ctx, graph, effectiveInput, texts, conversationId)

  // Extra pause before order confirmation feels human
  const replies = texts.map((text, i) => {
    let delay = typingDelay(i, text)
    if (text.includes('Order #') || text.includes('Thank you')) delay += 900
    return { text, delayMs: delay }
  })

  return { replies, newContext: ctx, ended: !!ctx.ended }
}
