import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const shop = await db.shop.findFirst()
  if (!shop) return NextResponse.json({ categories: [] })
  const categories = await db.category.findMany({
    where: { shopId: shop.id },
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ categories })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const shop = await db.shop.findFirst()
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const category = await db.category.create({
    data: {
      shopId: shop.id,
      name: body.name,
      emoji: body.emoji || null,
    },
  })
  return NextResponse.json({ category })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...data } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const category = await db.category.update({
    where: { id },
    data: { name: data.name, emoji: data.emoji },
  })
  return NextResponse.json({ category })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await db.category.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
