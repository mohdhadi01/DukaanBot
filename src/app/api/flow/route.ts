import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const shop = await db.shop.findFirst()
  if (!shop) return NextResponse.json({ nodes: [], edges: [] })
  const [nodes, edges] = await Promise.all([
    db.flowNode.findMany({ where: { shopId: shop.id }, orderBy: { createdAt: 'asc' } }),
    db.flowEdge.findMany({ where: { shopId: shop.id } }),
  ])
  return NextResponse.json({
    nodes: nodes.map((n) => ({
      ...n,
      data: n.data ? JSON.parse(n.data) : {},
    })),
    edges,
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const shop = await db.shop.findFirst()
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const node = await db.flowNode.create({
    data: {
      shopId: shop.id,
      type: body.type || 'message',
      title: body.title || 'New Step',
      data: JSON.stringify(body.data || {}),
      positionX: body.positionX ?? 100,
      positionY: body.positionY ?? 100,
      isStart: body.isStart || false,
    },
  })

  // If marked as start, unset others
  if (body.isStart) {
    await db.flowNode.updateMany({
      where: { shopId: shop.id, id: { not: node.id } },
      data: { isStart: false },
    })
  }

  return NextResponse.json({ node: { ...node, data: JSON.parse(node.data) } })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...data } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const update: any = {}
  if (data.type !== undefined) update.type = data.type
  if (data.title !== undefined) update.title = data.title
  if (data.data !== undefined) update.data = JSON.stringify(data.data)
  if (data.positionX !== undefined) update.positionX = data.positionX
  if (data.positionY !== undefined) update.positionY = data.positionY
  if (data.isStart !== undefined) {
    update.isStart = data.isStart
    if (data.isStart) {
      const shop = await db.flowNode.findUnique({ where: { id } })
      if (shop) {
        await db.flowNode.updateMany({
          where: { shopId: shop.shopId, id: { not: id } },
          data: { isStart: false },
        })
      }
    }
  }

  const node = await db.flowNode.update({ where: { id }, data: update })
  return NextResponse.json({ node: { ...node, data: JSON.parse(node.data) } })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // Delete connected edges
  await db.flowEdge.deleteMany({
    where: { OR: [{ sourceNodeId: id }, { targetNodeId: id }] },
  })
  await db.flowNode.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
