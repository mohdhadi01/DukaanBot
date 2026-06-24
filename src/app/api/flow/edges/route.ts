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

  // Prevent duplicate edges
  const existing = await db.flowEdge.findFirst({
    where: {
      shopId: shop.id,
      sourceNodeId: body.sourceNodeId,
      targetNodeId: body.targetNodeId,
      condition: body.condition || null,
    },
  })
  if (existing) return NextResponse.json({ edge: existing })

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

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, label, condition } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const update: any = {}
  if (label !== undefined) update.label = label || null
  if (condition !== undefined) update.condition = condition || null

  const edge = await db.flowEdge.update({ where: { id }, data: update })
  return NextResponse.json({ edge })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await db.flowEdge.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
