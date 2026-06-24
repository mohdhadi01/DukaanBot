import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const shop = await db.shop.findFirst()
  if (!shop) return NextResponse.json({ customers: [] })

  const customers = await db.customer.findMany({
    where: { shopId: shop.id },
    include: {
      _count: { select: { orders: true, conversations: true } },
      orders: { orderBy: { createdAt: 'desc' }, take: 1, select: { id: true, total: true, createdAt: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
  return NextResponse.json({ customers })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, name, notes, tags } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const customer = await db.customer.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(notes !== undefined && { notes }),
      ...(tags !== undefined && { tags: Array.isArray(tags) ? tags.join(',') : tags }),
    },
  })
  return NextResponse.json({ customer })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await db.customer.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
