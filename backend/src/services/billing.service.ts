import { Subscription, Shop, Conversation, User } from '../models'
import { getStripe, getStripePriceId, type PlanId } from '../lib/stripe-plans'

export async function userHasActiveSubscription(userId: string) {
  const sub = await Subscription.findOne({ userId })
  if (!sub) return false
  if (sub.status === 'active') return true
  if (sub.status === 'trialing' && sub.trialEndsAt && sub.trialEndsAt > new Date()) return true
  return false
}

export async function checkConversationLimit(userId: string, channel: string) {
  if (channel !== 'whatsapp') return { allowed: true }
  const sub = await Subscription.findOne({ userId })
  if (!sub || sub.plan === 'pro' || sub.status === 'active') return { allowed: true }

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const shop = await Shop.findOne({ userId, isDemo: false })
  if (!shop) return { allowed: true }

  const count = await Conversation.countDocuments({
    shopId: shop._id,
    channel: 'whatsapp',
    createdAt: { $gte: startOfMonth },
  })

  const limit = 500
  if (count >= limit) {
    return { allowed: false, reason: `Monthly WhatsApp conversation limit (${limit}) reached. Upgrade to Pro.` }
  }
  return { allowed: true }
}

export async function createCheckoutSession(userId: string, plan: PlanId, origin: string) {
  const stripe = getStripe()
  if (!stripe) throw new Error('Stripe is not configured')

  const priceId = getStripePriceId(plan)
  if (!priceId) throw new Error(`Price ID not configured for ${plan} plan`)

  const user = await User.findById(userId)
  if (!user) throw new Error('User not found')
  const sub = await Subscription.findOne({ userId })

  let customerId = sub?.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: { userId: String(user._id) },
    })
    customerId = customer.id
    await Subscription.findOneAndUpdate(
      { userId },
      { stripeCustomerId: customerId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
  }

  const checkout = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/onboarding?step=5&checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
    subscription_data: { metadata: { userId: String(user._id), plan } },
    metadata: { userId: String(user._id), plan },
  })

  return checkout.url
}

export async function createPortalSession(userId: string, origin: string) {
  const stripe = getStripe()
  if (!stripe) throw new Error('Stripe is not configured')

  const sub = await Subscription.findOne({ userId })
  if (!sub?.stripeCustomerId) throw new Error('No billing account found')

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${origin}/app`,
  })
  return session.url
}
