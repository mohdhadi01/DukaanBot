import { Router } from 'express'
import Stripe from 'stripe'
import { User, Subscription } from '../models'
import { requireAuth } from '../middleware/auth'
import { createPortalSession } from '../services/billing.service'
import { getStripe, getStripePriceId, type PlanId } from '../lib/stripe-plans'

const router = Router()

router.post('/checkout', requireAuth, async (req, res) => {
  const stripe = getStripe()
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe is not configured. Add STRIPE_SECRET_KEY to your environment.' })
  }

  const { plan } = req.body
  const planId = (plan || 'starter') as PlanId
  const priceId = getStripePriceId(planId)
  if (!priceId) return res.status(503).json({ error: `Price ID not configured for ${planId} plan` })

  const user = await User.findById(req.user!.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  const sub = await Subscription.findOne({ userId: user._id })

  let customerId = sub?.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: { userId: String(user._id) },
    })
    customerId = customer.id
    await Subscription.findOneAndUpdate(
      { userId: user._id },
      { stripeCustomerId: customerId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
  }

  const origin = req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:3000'
  const checkout = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/onboarding?step=5&checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
    subscription_data: {
      trial_period_days: sub?.status === 'trialing' ? undefined : 14,
      metadata: { userId: String(user._id), plan: planId },
    },
    metadata: { userId: String(user._id), plan: planId },
  })

  return res.json({ url: checkout.url })
})

router.post('/portal', requireAuth, async (req, res) => {
  const origin = req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:3000'
  try {
    const url = await createPortalSession(req.user!.id, origin)
    return res.json({ url })
  } catch {
    return res.status(503).json({ error: 'Stripe portal unavailable' })
  }
})

export function createStripeWebhookRouter() {
  const webhookRouter = Router()
  webhookRouter.post('/webhook', async (req, res) => {
    const stripe = getStripe()
    if (!stripe) return res.status(503).json({ error: 'Stripe not configured' })

    const sig = req.headers['stripe-signature'] as string
    const secret = process.env.STRIPE_WEBHOOK_SECRET
    if (!secret) return res.status(503).json({ error: 'Webhook secret not configured' })

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, secret)
    } catch (e) {
      return res.status(400).json({ error: `Webhook Error: ${e instanceof Error ? e.message : 'invalid'}` })
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      const plan = session.metadata?.plan || 'starter'
      if (userId) {
        await Subscription.findOneAndUpdate(
          { userId },
          {
            plan,
            status: 'active',
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
      }
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.userId
      if (userId) {
        const periodEnd = (sub as { current_period_end?: number }).current_period_end
        await Subscription.findOneAndUpdate(
          { userId },
          {
            status: sub.status === 'active' ? 'active' : sub.status === 'trialing' ? 'trialing' : 'cancelled',
            stripeSubscriptionId: sub.id,
            currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
          }
        )
      }
    }

    return res.json({ received: true })
  })
  return webhookRouter
}

export default router
