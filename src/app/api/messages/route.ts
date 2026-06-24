import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { processCustomerMessage, serializeContext, parseContext } from '@/lib/bot-engine'

// POST a customer message; returns bot replies
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { conversationId, text } = body
  if (!conversationId || !text) {
    return NextResponse.json({ error: 'conversationId and text required' }, { status: 400 })
  }

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: { shop: true, customer: true },
  })
  if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

  // Persist customer message
  await db.message.create({
    data: {
      conversationId,
      sender: 'customer',
      text,
      type: 'text',
    },
  })

  // Run the bot engine
  const ctx = parseContext(conversation.context)
  ctx.vars.__customerId = conversation.customerId
  ctx.vars.__conversationId = conversationId
  ctx.vars.shopName = conversation.shop.name
  ctx.vars.name = ctx.vars.name || conversation.customer.name

  const result = await processCustomerMessage(conversation.shopId, {
    id: conversationId,
    context: serializeContext(ctx),
    currentNodeId: conversation.currentNodeId,
  }, text)

  // Persist bot messages
  const createdMessages = []
  for (const m of result.botMessages) {
    const msg = await db.message.create({
      data: {
        conversationId,
        sender: 'bot',
        text: m.text,
        type: m.type || 'text',
        metadata: m.metadata ? JSON.stringify(m.metadata) : null,
      },
    })
    createdMessages.push(msg)
  }

  // Update conversation context
  const newCtx = result.newContext
  newCtx.vars.__customerId = conversation.customerId
  newCtx.vars.__conversationId = conversationId
  newCtx.vars.shopName = conversation.shop.name
  newCtx.vars.name = newCtx.vars.name || conversation.customer.name

  await db.conversation.update({
    where: { id: conversationId },
    data: {
      context: serializeContext(newCtx),
      currentNodeId: newCtx.currentNodeId,
      status: result.ended ? 'resolved' : 'active',
      updatedAt: new Date(),
    },
  })

  return NextResponse.json({
    messages: createdMessages,
    ended: result.ended,
  })
}

// Shop owner replies manually
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { conversationId, text } = body
  if (!conversationId || !text) {
    return NextResponse.json({ error: 'conversationId and text required' }, { status: 400 })
  }
  const msg = await db.message.create({
    data: {
      conversationId,
      sender: 'shop',
      text,
      type: 'text',
    },
  })
  await db.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  })
  return NextResponse.json({ message: msg })
}

// GET messages of a conversation
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const conversationId = searchParams.get('conversationId')
  if (!conversationId) return NextResponse.json({ messages: [] })

  const messages = await db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json({
    messages: messages.map((m) => ({
      ...m,
      metadata: m.metadata ? JSON.parse(m.metadata) : null,
    })),
  })
}
