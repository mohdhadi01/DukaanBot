import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const shop = await db.shop.findFirst()
  if (!shop) return NextResponse.json({ orders: [] })

  const where: any = { shopId: shop.id }
  if (status) where.status = status

  const orders = await db.order.findMany({
    where,
    include: {
      customer: true,
      items: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
  return NextResponse.json({ orders })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, status, notes } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const update: any = {}
  if (status !== undefined) update.status = status
  if (notes !== undefined) update.notes = notes

  const order = await db.order.update({
    where: { id },
    data: update,
    include: { customer: true, items: true },
  })
  return NextResponse.json({ order })
}
