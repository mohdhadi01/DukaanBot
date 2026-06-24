import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const conversationId = searchParams.get('conversationId')
  const shop = await db.shop.findFirst()
  if (!shop) return NextResponse.json({ conversations: [] })

  if (conversationId) {
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        customer: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
    })
    return NextResponse.json({ conversation })
  }

  const conversations = await db.conversation.findMany({
    where: { shopId: shop.id },
    include: {
      customer: true,
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  })
  return NextResponse.json({ conversations })
}

export async function POST(req: NextRequest) {
  // Create a new conversation (start chat from simulator)
  const body = await req.json()
  const shop = await db.shop.findFirst()
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  // Find or create customer
  let customer = await db.customer.findFirst({
    where: { shopId: shop.id, phone: body.phone },
  })
  if (!customer) {
    customer = await db.customer.create({
      data: {
        shopId: shop.id,
        name: body.name || 'Customer',
        phone: body.phone,
      },
    })
  }

  const conversation = await db.conversation.create({
    data: {
      shopId: shop.id,
      customerId: customer.id,
      status: 'active',
    },
    include: { customer: true },
  })

  return NextResponse.json({ conversation })
}
