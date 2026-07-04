'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MarketingNav, MarketingFooter } from '@/components/marketing/MarketingShell'
import { Button } from '@/components/ui/button'
import { PLANS, type PlanId } from '@/lib/stripe-plans'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth, API_BASE } from '@/components/providers/AuthProvider'
import { Reveal } from '@/components/marketing/motion'

export default function PricingPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState<PlanId | null>(null)

  const subscribe = async (plan: PlanId) => {
    if (!user) {
      window.location.href = '/register'
      return
    }
    setLoading(plan)
    try {
      const res = await fetch(`${API_BASE}/api/stripe/checkout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error || 'Checkout unavailable — configure Stripe keys')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />
      <section className="bg-hero-radial py-20">
        <Reveal className="mx-auto max-w-4xl px-4 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-600">Pricing</p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Simple, honest pricing</h1>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            14-day free trial on every plan. No credit card required to start.
          </p>
        </Reveal>
      </section>
      <section className="px-4 pb-24">
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {(Object.keys(PLANS) as PlanId[]).map((id, i) => {
            const plan = PLANS[id]
            const popular = 'popular' in plan && plan.popular
            return (
              <Reveal key={id} delay={i * 0.08}>
                <div
                  className={cn(
                    'lift relative flex h-full flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-8',
                    popular && 'border-2 border-emerald-600 shadow-lg shadow-emerald-600/10'
                  )}
                >
                  {popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white shadow-sm">
                      Most popular
                    </span>
                  )}
                  <div>
                    <h2 className="text-xl font-bold">{plan.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                    <p className="mt-4 text-4xl font-bold">
                      {plan.priceLabel}
                      <span className="text-base font-normal text-muted-foreground">{plan.period}</span>
                    </p>
                  </div>
                  <ul className="flex-1 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    size="lg"
                    className={cn('w-full', popular ? 'bg-emerald-600 hover:bg-emerald-700' : '')}
                    variant={popular ? 'default' : 'outline'}
                    onClick={() => subscribe(id)}
                    disabled={loading === id}
                  >
                    {loading === id ? <Loader2 className="h-4 w-4 animate-spin" /> : user ? 'Subscribe' : 'Start free trial'}
                  </Button>
                </div>
              </Reveal>
            )
          })}
        </div>
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Not sure yet?{' '}
          <Link href="/demo" className="font-medium text-emerald-700 hover:underline">
            Try the live demo first
          </Link>
        </p>
      </section>
      <MarketingFooter />
    </div>
  )
}
