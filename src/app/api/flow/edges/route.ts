import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const shop = await db.shop.findFirst()
  if (!shop) return NextResponse.json({ edges: [] })
  const edges = await db.flowEdge.findMany({ where: { shopId: shop.id } })
  return NextResponse.json({ edges })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const shop = await db.shop.findFirst()
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const edge = await db.flowEdge.create({
    data: {
      shopId: shop.id,
      sourceNodeId: body.sourceNodeId,
      targetNodeId: body.targetNodeId,
      label: body.label || null,
      condition: body.condition || null,
    },
  })
  return NextResponse.json({ edge })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await db.flowEdge.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
