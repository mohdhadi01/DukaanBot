export const PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 499,
    priceLabel: '₹499',
    period: '/month',
    description: 'Perfect for single-shop owners getting started on WhatsApp.',
    features: [
      '1 shop · unlimited products',
      'Visual flow builder',
      'WhatsApp Cloud API integration',
      'Order management dashboard',
      'Up to 500 conversations/month',
      'Email support',
    ],
    stripePriceEnv: 'STRIPE_STARTER_PRICE_ID',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 999,
    priceLabel: '₹999',
    period: '/month',
    description: 'For growing businesses with higher volume and priority support.',
    features: [
      'Everything in Starter',
      'Unlimited conversations',
      'Broadcast campaigns',
      'Analytics export (CSV)',
      'Priority support',
      'Multiple staff logins (coming soon)',
    ],
    stripePriceEnv: 'STRIPE_PRO_PRICE_ID',
    popular: true,
  },
} as const

export type PlanId = keyof typeof PLANS
