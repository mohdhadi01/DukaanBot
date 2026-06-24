import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const shop = await db.shop.findFirst()
  if (!shop) return NextResponse.json({ products: [] })
  const products = await db.product.findMany({
    where: { shopId: shop.id },
    include: { category: true },
    orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
  })
  return NextResponse.json({ products })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const shop = await db.shop.findFirst()
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const product = await db.product.create({
    data: {
      shopId: shop.id,
      name: body.name,
      description: body.description || null,
      price: parseFloat(body.price),
      unit: body.unit || null,
      categoryId: body.categoryId || null,
      isAvailable: body.isAvailable !== false,
      tags: Array.isArray(body.tags) ? body.tags.join(',') : body.tags || null,
    },
    include: { category: true },
  })
  return NextResponse.json({ product })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...data } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const update: any = {}
  if (data.name !== undefined) update.name = data.name
  if (data.description !== undefined) update.description = data.description
  if (data.price !== undefined) update.price = parseFloat(data.price)
  if (data.unit !== undefined) update.unit = data.unit
  if (data.categoryId !== undefined) update.categoryId = data.categoryId || null
  if (data.isAvailable !== undefined) update.isAvailable = data.isAvailable
  if (data.tags !== undefined) {
    update.tags = Array.isArray(data.tags) ? data.tags.join(',') : data.tags || null
  }

  const product = await db.product.update({
    where: { id },
    data: update,
    include: { category: true },
  })
  return NextResponse.json({ product })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await db.product.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
