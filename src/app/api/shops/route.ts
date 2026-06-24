import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { seedDefaultFlow } from '@/lib/bot-engine'

// Get current shop (single-tenant for this build)
export async function GET() {
  const shop = await db.shop.findFirst({
    orderBy: { createdAt: 'asc' },
    include: {
      categories: { orderBy: { name: 'asc' } },
      _count: {
        select: { products: true, orders: true, customers: true, conversations: true },
      },
    },
  })
  return NextResponse.json({ shop })
}

// Create a shop
export async function POST(req: NextRequest) {
  const body = await req.json()
  const existing = await db.shop.findFirst()
  if (existing) {
    return NextResponse.json({ error: 'Shop already exists' }, { status: 400 })
  }
  const shop = await db.shop.create({
    data: {
      name: body.name || 'My Shop',
      type: body.type || 'kirana',
      whatsappNumber: body.whatsappNumber || '+91 98765 43210',
      ownerName: body.ownerName || 'Shop Owner',
      description: body.description || '',
      address: body.address || '',
      hours: body.hours || '9 AM - 9 PM',
      currency: body.currency || '₹',
      language: body.language || 'en',
      primaryColor: body.primaryColor || '#16a34a',
    },
  })
  await seedDefaultFlow(shop.id)
  return NextResponse.json({ shop })
}

// Update shop
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const shop = await db.shop.findFirst()
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
  const updated = await db.shop.update({
    where: { id: shop.id },
    data: {
      name: body.name,
      type: body.type,
      whatsappNumber: body.whatsappNumber,
      ownerName: body.ownerName,
      description: body.description,
      address: body.address,
      hours: body.hours,
      currency: body.currency,
      language: body.language,
      primaryColor: body.primaryColor,
      isOpen: body.isOpen,
    },
  })
  return NextResponse.json({ shop: updated })
}
