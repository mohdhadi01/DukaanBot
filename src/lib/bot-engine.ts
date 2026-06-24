import { db } from './db'

// ============================================================================
// Flow Engine: interprets a shop's flow graph and walks customers through it
// ============================================================================

export type FlowNodeType =
  | 'start'
  | 'message'
  | 'menu'
  | 'question'
  | 'collect'
  | 'branch'
  | 'place_order'
  | 'end'

export interface FlowNodeData {
  message?: string
  variable?: string
  prompt?: string
  options?: { label: string; value: string }[]
  inputType?: 'text' | 'phone' | 'number' | 'name'
  categoryIds?: string[]
  showPrices?: boolean
  allowOrdering?: boolean
  confirmText?: string
  endMessage?: string
}

export interface ParsedFlowNode {
  id: string
  type: FlowNodeType
  title: string
  data: FlowNodeData
  positionX: number
  positionY: number
  isStart: boolean
  outgoing: ParsedFlowEdge[]
}

export interface ParsedFlowEdge {
  id: string
  sourceNodeId: string
  targetNodeId: string
  label?: string | null
  condition?: string | null
}

export interface FlowGraph {
  nodes: ParsedFlowNode[]
  edges: ParsedFlowEdge[]
  startNodeId: string | null
}

export interface ConversationContext {
  currentNodeId: string | null
  vars: Record<string, string | number>
  cart: { productId: string; name: string; price: number; quantity: number }[]
  history: string[]
  awaitingOrderId?: boolean
  awaitingItemSelection?: boolean
  awaitingQuantity?: boolean
  lastMenuProducts?: { id: string; name: string; price: number; unit?: string | null }[]
  ended?: boolean
  skipNextInput?: boolean
}

export async function loadFlowGraph(shopId: string): Promise<FlowGraph> {
  const [nodes, edges] = await Promise.all([
    db.flowNode.findMany({ where: { shopId } }),
    db.flowEdge.findMany({ where: { shopId } }),
  ])

  const parsedNodes: ParsedFlowNode[] = nodes.map((n) => ({
    id: n.id,
    type: n.type as FlowNodeType,
    title: n.title,
    data: safeParse<FlowNodeData>(n.data, {}),
    positionX: n.positionX,
    positionY: n.positionY,
    isStart: n.isStart,
    outgoing: [],
  }))

  const parsedEdges: ParsedFlowEdge[] = edges.map((e) => ({
    id: e.id,
    sourceNodeId: e.sourceNodeId,
    targetNodeId: e.targetNodeId,
    label: e.label,
    condition: e.condition,
  }))

  const nodeMap = new Map(parsedNodes.map((n) => [n.id, n]))
  for (const edge of parsedEdges) {
    const src = nodeMap.get(edge.sourceNodeId)
    if (src) src.outgoing.push(edge)
  }

  const startNode =
    parsedNodes.find((n) => n.isStart) || parsedNodes.find((n) => n.type === 'start') || null

  return {
    nodes: parsedNodes,
    edges: parsedEdges,
    startNodeId: startNode?.id ?? null,
  }
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

// Advance the flow from the current node, returning bot messages to send.
// `customerInput` is the customer's latest message text (if any).
export interface FlowStepResult {
  botMessages: { text: string; type?: string; metadata?: any }[]
  newContext: ConversationContext
  ended: boolean
}

export async function processCustomerMessage(
  shopId: string,
  conversation: { id: string; context: string | null; currentNodeId: string | null },
  customerInput: string
): Promise<FlowStepResult> {
  const graph = await loadFlowGraph(shopId)
  const ctx = parseContext(conversation.context)
  ctx.currentNodeId = conversation.currentNodeId

  const botMessages: { text: string; type?: string; metadata?: any }[] = []

  // If flow already ended, send fallback
  if (ctx.ended || !graph.startNodeId) {
    botMessages.push({
      text: "Thanks for reaching out! Our team will get back to you shortly. Type 'menu' to see our offerings again.",
    })
    return { botMessages, newContext: ctx, ended: true }
  }

  // The customer's input is treated as a *response* to the current waiting node
  // ONLY if we already had a current node set (i.e., the bot was waiting for input).
  // On the very first message (currentNodeId is null), the input just triggers the flow.
  const wasWaiting = !!ctx.currentNodeId

  // Handle cart-building state OR awaiting order confirmation
  if (ctx.awaitingItemSelection || ctx.awaitingOrderId) {
    const handled = await handleItemSelection(ctx, customerInput, botMessages, graph)
    if (handled) return { botMessages, newContext: ctx, ended: false }
    // If handleItemSelection returned false but set skipNextInput (cart confirm),
    // we continue to walkFlow below with empty input.
  }

  if (ctx.awaitingQuantity) {
    const handled = handleQuantityInput(ctx, customerInput, botMessages, graph)
    if (handled) return { botMessages, newContext: ctx, ended: false }
  }

  // If no current node, start the flow
  if (!ctx.currentNodeId) {
    ctx.currentNodeId = graph.startNodeId
  }

  // If the previous step flagged to skip the customer's input as a response
  // (e.g., after cart confirmation), don't pass it to walkFlow.
  const effectiveInput = ctx.skipNextInput ? '' : (wasWaiting ? customerInput : '')
  ctx.skipNextInput = false

  // Process current node and walk forward
  await walkFlow(ctx, graph, effectiveInput, botMessages, shopId)

  return { botMessages, newContext: ctx, ended: !!ctx.ended }
}

async function walkFlow(
  ctx: ConversationContext,
  graph: FlowGraph,
  customerInput: string,
  botMessages: { text: string; type?: string; metadata?: any }[],
  shopId: string
) {
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]))
  let steps = 0
  let currentNode = ctx.currentNodeId ? nodeMap.get(ctx.currentNodeId) : null

  // For the FIRST step (when customer just started), we may want to advance based on the start node.
  // For subsequent steps, the customer's input maps to a branch option.
  while (currentNode && steps < 10) {
    steps++
    ctx.history.push(currentNode.id)
    if (ctx.history.length > 50) ctx.history.shift()

    switch (currentNode.type) {
      case 'start': {
        // Move to first outgoing edge
        const next = pickNext(currentNode, undefined)
        if (!next) {
          ctx.ended = true
          botMessages.push({ text: "Welcome! Type anything to get started." })
          return
        }
        currentNode = nodeMap.get(next)
        break
      }

      case 'message': {
        botMessages.push({ text: renderTemplate(currentNode.data.message || '', ctx) })
        const next = pickNext(currentNode, undefined)
        if (!next) {
          ctx.ended = true
          return
        }
        currentNode = nodeMap.get(next)
        break
      }

      case 'menu': {
        const menuMsg = await buildMenuMessage(shopId, currentNode.data, ctx)
        botMessages.push(menuMsg)
        if (currentNode.data.allowOrdering) {
          ctx.awaitingItemSelection = true
          ctx.lastMenuProducts = menuMsg.metadata?.products || []
          ctx.currentNodeId = currentNode.id
          return
        }
        const next = pickNext(currentNode, undefined)
        if (!next) {
          ctx.ended = true
          return
        }
        currentNode = nodeMap.get(next)
        break
      }

      case 'question': {
        // If we already collected the answer (customerInput exists and not from menu), branch
        const options = currentNode.data.options || []
        if (options.length > 0) {
          // Send the question with options
          const optsText = options
            .map((o, i) => `${i + 1}. ${o.label}`)
            .join('\n')
          botMessages.push({
            text: `${currentNode.data.prompt || currentNode.title}\n\n${optsText}`,
            type: 'question',
            metadata: { options },
          })
          ctx.currentNodeId = currentNode.id
          // Save the variable if user already typed something we can match
          if (customerInput) {
            const match = matchOption(customerInput, options)
            if (match) {
              if (currentNode.data.variable) {
                ctx.vars[currentNode.data.variable] = match.label
              }
              const next = pickNext(currentNode, match.value)
              if (!next) {
                ctx.ended = true
                return
              }
              currentNode = nodeMap.get(next)
              customerInput = '' // consume
              break
            }
            // No match — ask again
            botMessages.push({
              text: "Sorry, I didn't get that. Please reply with the option number (e.g. '1').",
            })
            return
          }
          // Wait for input
          return
        }
        // Open-ended question
        botMessages.push({
          text: currentNode.data.prompt || currentNode.title,
        })
        ctx.currentNodeId = currentNode.id
        if (customerInput) {
          if (currentNode.data.variable) {
            ctx.vars[currentNode.data.variable] = customerInput
          }
          const next = pickNext(currentNode, undefined)
          if (!next) {
            ctx.ended = true
            return
          }
          currentNode = nodeMap.get(next)
          customerInput = ''
        } else {
          return
        }
        break
      }

      case 'collect': {
        botMessages.push({
          text: currentNode.data.prompt || 'Please enter your response:',
        })
        ctx.currentNodeId = currentNode.id
        if (customerInput) {
          if (currentNode.data.variable) {
            ctx.vars[currentNode.data.variable] = customerInput
          }
          const next = pickNext(currentNode, undefined)
          if (!next) {
            ctx.ended = true
            return
          }
          currentNode = nodeMap.get(next)
          customerInput = ''
        } else {
          return
        }
        break
      }

      case 'branch': {
        // Evaluate based on a variable
        const variable = currentNode.data.variable || ''
        const value = String(ctx.vars[variable] || '').toLowerCase()
        const next = pickNext(currentNode, value) || pickNext(currentNode, undefined)
        if (!next) {
          ctx.ended = true
          return
        }
        currentNode = nodeMap.get(next)
        break
      }

      case 'place_order': {
        // Build order from cart, persist
        if (ctx.cart.length === 0) {
          botMessages.push({
            text: "Your cart is empty. Please pick items from the menu first.",
          })
          const next = pickNext(currentNode, undefined)
          if (!next) {
            ctx.ended = true
            return
          }
          currentNode = nodeMap.get(next)
          break
        }
        const total = ctx.cart.reduce((s, i) => s + i.price * i.quantity, 0)
        const order = await db.order.create({
          data: {
            shopId,
            customerId: ctx.vars.__customerId as string,
            conversationId: ctx.vars.__conversationId as string,
            status: 'pending',
            total,
            type: String(ctx.vars.deliveryType || 'delivery'),
            address: ctx.vars.address ? String(ctx.vars.address) : null,
            notes: ctx.vars.notes ? String(ctx.vars.notes) : null,
            items: {
              create: ctx.cart.map((i) => ({
                name: i.name,
                price: i.price,
                quantity: i.quantity,
                total: i.price * i.quantity,
                productId: i.productId,
              })),
            },
          },
        })
        const summary = ctx.cart
          .map((i) => `• ${i.quantity}× ${i.name} — ₹${(i.price * i.quantity).toFixed(2)}`)
          .join('\n')
        botMessages.push({
          text:
            `🧾 *Order #${order.id.slice(-6).toUpperCase()}*\n${summary}\n\n` +
            `*Total: ₹${total.toFixed(2)}*\n\n` +
            `We've received your order! You'll get a confirmation shortly. Type 'status' to check progress.`,
          type: 'order',
          metadata: { orderId: order.id, total },
        })
        ctx.vars.__lastOrderId = order.id
        ctx.cart = []
        const next = pickNext(currentNode, undefined)
        if (!next) {
          ctx.ended = true
          return
        }
        currentNode = nodeMap.get(next)
        break
      }

      case 'end': {
        botMessages.push({
          text: renderTemplate(currentNode.data.endMessage || 'Thank you! See you soon. 🙏', ctx),
        })
        ctx.ended = true
        ctx.currentNodeId = currentNode.id
        return
      }

      default: {
        ctx.ended = true
        return
      }
    }
  }

  ctx.currentNodeId = currentNode?.id || null
}

function pickNext(
  node: ParsedFlowNode,
  condition: string | undefined
): string | null {
  if (!node.outgoing.length) return null
  if (condition !== undefined) {
    const lower = condition.toLowerCase().trim()
    // Try exact match on condition field
    const exact = node.outgoing.find((e) => (e.condition || '').toLowerCase() === lower)
    if (exact) return exact.targetNodeId
    // Try matching option values
    const byLabel = node.outgoing.find((e) => (e.label || '').toLowerCase() === lower)
    if (byLabel) return byLabel.targetNodeId
  }
  // Fallback: first edge with no condition
  const noCond = node.outgoing.find((e) => !e.condition && !e.label)
  if (noCond) return noCond.targetNodeId
  return node.outgoing[0].targetNodeId
}

function matchOption(
  input: string,
  options: { label: string; value: string }[]
): { label: string; value: string } | null {
  const t = input.trim().toLowerCase()
  // numeric
  const num = parseInt(t, 10)
  if (!isNaN(num) && num >= 1 && num <= options.length) {
    return options[num - 1]
  }
  // exact
  const m = options.find((o) => o.value.toLowerCase() === t || o.label.toLowerCase() === t)
  return m || null
}

function renderTemplate(text: string, ctx: ConversationContext): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => String(ctx.vars[k] ?? ''))
}

async function buildMenuMessage(
  shopId: string,
  data: FlowNodeData,
  ctx: ConversationContext
): Promise<{ text: string; type: string; metadata: any }> {
  const where: any = { shopId, isAvailable: true }
  if (data.categoryIds && data.categoryIds.length > 0) {
    where.categoryId = { in: data.categoryIds }
  }
  const products = await db.product.findMany({
    where,
    orderBy: { name: 'asc' },
    take: 30,
  })

  const lines: string[] = []
  lines.push(data.message || `🛒 *Our Menu*\n`)
  products.forEach((p, i) => {
    const price = data.showPrices === false ? '' : ` — ₹${p.price}`
    lines.push(`${i + 1}. ${p.name}${price}${p.unit ? ` /${p.unit}` : ''}`)
  })
  lines.push('')
  if (data.allowOrdering) {
    lines.push('_Reply with item numbers like "1, 3" to add to cart, or "0" to checkout._')
  }
  return {
    text: lines.join('\n'),
    type: 'menu',
    metadata: {
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        unit: p.unit,
      })),
    },
  }
}

async function handleItemSelection(
  ctx: ConversationContext,
  input: string,
  botMessages: { text: string; type?: string; metadata?: any }[],
  graph: FlowGraph
): Promise<boolean> {
  const t = input.trim().toLowerCase()
  if (!t) return false

  // Checkout
  if (t === '0' || t === 'checkout' || t === 'done') {
    ctx.awaitingItemSelection = false
    if (ctx.cart.length === 0) {
      botMessages.push({ text: 'Your cart is empty. Type "menu" to see options again.' })
      return true
    }
    const summary = ctx.cart
      .map((i) => `• ${i.quantity}× ${i.name} — ₹${(i.price * i.quantity).toFixed(2)}`)
      .join('\n')
    const total = ctx.cart.reduce((s, i) => s + i.price * i.quantity, 0)
    botMessages.push({
      text: `🛍️ *Your Cart*\n${summary}\n\n*Total: ₹${total.toFixed(2)}*\n\nType "confirm" to place your order, or "menu" to add more.`,
    })
    ctx.awaitingOrderId = true
    return true
  }

  // Menu request
  if (t === 'menu' || t === 'start') {
    ctx.awaitingItemSelection = false
    ctx.awaitingOrderId = false
    return false
  }

  // Confirm order — advance past the menu node and let walkFlow continue to collect/order placement
  if (ctx.awaitingOrderId && (t === 'confirm' || t === 'yes' || t === 'ok' || t === 'place order')) {
    ctx.awaitingOrderId = false
    ctx.awaitingItemSelection = false
    // Advance ctx.currentNodeId to the next node after the current menu node
    const menuNode = graph.nodes.find((n) => n.id === ctx.currentNodeId)
    if (menuNode) {
      const nextId = pickNext(menuNode, undefined)
      if (nextId) {
        ctx.currentNodeId = nextId
        botMessages.push({
          text: '✅ Order confirmed! Let me collect a few more details.',
        })
      }
    }
    // Returning false lets walkFlow continue from the advanced currentNodeId.
    // The customerInput ('confirm') should NOT be consumed as response to the next node.
    // We handle this by clearing customerInput via a special context flag.
    ctx.skipNextInput = true
    return false
  }

  // Parse item numbers like "1, 3" or "1 3"
  const nums = t
    .split(/[,\s]+/)
    .map((x) => parseInt(x, 10))
    .filter((n) => !isNaN(n) && n >= 1)

  if (nums.length === 0) return false

  const products = ctx.lastMenuProducts || []
  for (const n of nums) {
    const p = products[n - 1]
    if (p) {
      // Ask quantity? For simplicity default to 1 and let user adjust via "2x item"
      ctx.cart.push({
        productId: p.id,
        name: p.name,
        price: p.price,
        quantity: 1,
      })
    }
  }
  const summary = ctx.cart.map((i) => `${i.quantity}× ${i.name}`).join(', ')
  botMessages.push({
    text: `✅ Added to cart: ${summary}\n\nReply with more numbers to add, or "0" to checkout.`,
  })
  return true
}

function handleQuantityInput(
  ctx: ConversationContext,
  input: string,
  botMessages: { text: string; type?: string; metadata?: any }[],
  _graph: FlowGraph
): boolean {
  return false // currently unused; quantities default to 1
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

// ============================================================================
// Flow seed: create a default flow for a new shop
// ============================================================================

export async function seedDefaultFlow(shopId: string) {
  // Check if any flow exists
  const existing = await db.flowNode.count({ where: { shopId } })
  if (existing > 0) return

  const nodes = [
    { type: 'start', title: 'Start', data: {}, x: 80, y: 80, isStart: true },
    {
      type: 'message',
      title: 'Welcome',
      data: { message: '🙏 Namaste! Welcome to {{shopName}}. How can I help you today?' },
      x: 360,
      y: 80,
    },
    {
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
      x: 640,
      y: 80,
    },
    {
      type: 'menu',
      title: 'Show Menu',
      data: {
        message: '🛒 *Our Menu*',
        showPrices: true,
        allowOrdering: true,
      },
      x: 920,
      y: 40,
    },
    {
      type: 'message',
      title: 'Shop Hours',
      data: { message: '🕘 We are open every day from 9:00 AM to 9:00 PM. Type "menu" to start an order.' },
      x: 920,
      y: 220,
    },
    {
      type: 'message',
      title: 'Human Handoff',
      data: { message: '📞 Sure! Our shop owner will reach out to you shortly. For urgent queries please call us directly.' },
      x: 920,
      y: 380,
    },
    {
      type: 'collect',
      title: 'Collect Address',
      data: {
        prompt: '📍 Please share your delivery address:',
        variable: 'address',
      },
      x: 1200,
      y: 40,
    },
    {
      type: 'collect',
      title: 'Collect Notes',
      data: {
        prompt: '📝 Any special instructions? (e.g. "ring twice" / "no onions"). Reply "no" to skip.',
        variable: 'notes',
      },
      x: 1480,
      y: 40,
    },
    {
      type: 'place_order',
      title: 'Place Order',
      data: {},
      x: 1480,
      y: 220,
    },
    {
      type: 'end',
      title: 'Thank You',
      data: { endMessage: '🎉 Thank you for your order, {{name}}! We will confirm it shortly. Have a great day! 🙏' },
      x: 1480,
      y: 380,
    },
  ]

  const created = await db.$transaction(
    nodes.map((n) =>
      db.flowNode.create({
        data: {
          shopId,
          type: n.type,
          title: n.title,
          data: JSON.stringify(n.data),
          positionX: n.x,
          positionY: n.y,
          isStart: n.isStart ?? false,
        },
      })
    )
  )

  const [
    startNode,
    welcomeNode,
    questionNode,
    menuNode,
    hoursNode,
    humanNode,
    addressNode,
    notesNode,
    placeOrderNode,
    endNode,
  ] = created

  const edges = [
    { src: startNode.id, tgt: welcomeNode.id },
    { src: welcomeNode.id, tgt: questionNode.id },
    { src: questionNode.id, tgt: menuNode.id, cond: 'menu', label: 'Menu/Order' },
    { src: questionNode.id, tgt: hoursNode.id, cond: 'hours', label: 'Hours' },
    { src: questionNode.id, tgt: humanNode.id, cond: 'human', label: 'Human' },
    { src: menuNode.id, tgt: addressNode.id },
    { src: addressNode.id, tgt: notesNode.id },
    { src: notesNode.id, tgt: placeOrderNode.id },
    { src: placeOrderNode.id, tgt: endNode.id },
    { src: hoursNode.id, tgt: questionNode.id },
    { src: humanNode.id, tgt: endNode.id },
  ]

  await db.$transaction(
    edges.map((e) =>
      db.flowEdge.create({
        data: {
          shopId,
          sourceNodeId: e.src,
          targetNodeId: e.tgt,
          condition: e.cond,
          label: e.label,
        },
      })
    )
  )
}
