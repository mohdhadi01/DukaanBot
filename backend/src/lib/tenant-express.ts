import type { Request } from 'express'
import { Shop } from '../models'
import { verifyAuthToken, COOKIE_NAME, type AuthTokenPayload } from '../lib/jwt'
import { userHasActiveSubscription } from '../services/billing.service'

export type TenantContext = {
  shopId: string
  userId?: string
  isDemo: boolean
}

export async function getUserFromRequest(req: Request): Promise<AuthTokenPayload | null> {
  const cookieToken = req.cookies?.[COOKIE_NAME]
  const header = req.headers.authorization
  const bearer = header?.startsWith('Bearer ') ? header.slice(7) : null
  const token = cookieToken || bearer
  if (!token) return null
  return verifyAuthToken(token)
}

export async function resolveTenantFromRequest(req: Request): Promise<TenantContext | null> {
  const user = await getUserFromRequest(req)
  if (user?.id) {
    const shop = await Shop.findOne({ userId: user.id, isDemo: false }).sort({ createdAt: 1 })
    if (shop) return { shopId: String(shop._id), userId: user.id, isDemo: false }
  }
  return null
}

export async function tenantGuard(req: Request): Promise<
  | { error: null; tenant: TenantContext }
  | { error: { status: number; body: object }; tenant: null }
> {
  const tenant = await resolveTenantFromRequest(req)
  if (!tenant) {
    return { error: { status: 401, body: { error: 'Unauthorized' } }, tenant: null }
  }

  if (tenant.userId) {
    const active = await userHasActiveSubscription(tenant.userId)
    if (!active) {
      return {
        error: {
          status: 402,
          body: {
            error: 'Subscription expired',
            code: 'SUBSCRIPTION_EXPIRED',
            redirect: '/pricing',
          },
        },
        tenant: null,
      }
    }
  }

  return { error: null, tenant }
}
