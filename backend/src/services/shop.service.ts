import { Shop, WhatsappSession } from '../models'

export type TenantContext = {
  shopId: string
  userId?: string
  isDemo: boolean
}

export async function getShopByTenant(tenant: TenantContext) {
  const shop = await Shop.findById(tenant.shopId)
  if (!shop) return null
  const categories = await import('../models').then((m) => m.Category.find({ shopId: tenant.shopId }).sort({ name: 1 }))
  const session = await WhatsappSession.findOne({ shopId: tenant.shopId })
  const [products, orders, customers, conversations] = await Promise.all([
    import('../models').then((m) => m.Product.countDocuments({ shopId: tenant.shopId })),
    import('../models').then((m) => m.Order.countDocuments({ shopId: tenant.shopId })),
    import('../models').then((m) => m.Customer.countDocuments({ shopId: tenant.shopId })),
    import('../models').then((m) => m.Conversation.countDocuments({ shopId: tenant.shopId })),
  ])
  return {
    ...shop.toJSON(),
    categories,
    whatsappSession: session?.toJSON(),
    _count: { products, orders, customers, conversations },
  }
}

export async function updateShop(shopId: string, data: Record<string, unknown>) {
  return Shop.findByIdAndUpdate(shopId, data, { new: true })
}

export async function getWhatsappSession(shopId: string) {
  return WhatsappSession.findOne({ shopId }).lean()
}

export async function upsertWhatsappSession(
  shopId: string,
  data: {
    status?: string
    linkedPhone?: string | null
    qrDataUrl?: string | null
    sessionBlob?: string | null
    lastSeenAt?: Date
    errorMessage?: string | null
  }
) {
  const connected = data.status === 'connected'
  await Shop.findByIdAndUpdate(shopId, { whatsappConnected: connected })
  return WhatsappSession.findOneAndUpdate({ shopId }, data, { upsert: true, new: true })
}
