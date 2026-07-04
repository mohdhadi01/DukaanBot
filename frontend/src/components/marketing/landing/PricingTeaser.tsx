'use client'

import Link from 'next/link'
import { Reveal } from '@/components/marketing/motion'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'
import { PLANS, type PlanId } from '@/lib/stripe-plans'

export function PricingTeaser() {
  const plans = (['starter', 'pro'] as PlanId[]).map((planId) => ({ planId, ...PLANS[planId] }))

  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-4">
        <Reveal className="mb-12 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-emerald-600">Pricing</p>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Start free, scale when ready</h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">14-day trial on every plan. No credit card to start.</p>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-2">
          {plans.map((plan, i) => (
            <Reveal key={plan.planId} delay={i * 0.08}>
              <div
                className={`glass-card flex h-full flex-col gap-5 rounded-2xl p-8 ${
                  'popular' in plan && plan.popular ? 'ring-2 ring-emerald-600' : ''
                }`}
              >
                <div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                  <p className="mt-4 text-4xl font-bold">
                    {plan.priceLabel}
                    <span className="text-base font-normal text-muted-foreground">{plan.period}</span>
                  </p>
                </div>
                <ul className="flex-1 space-y-2">
                  {plan.features.slice(0, 4).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={('popular' in plan && plan.popular) ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                  variant={('popular' in plan && plan.popular) ? 'default' : 'outline'}
                  asChild
                >
                  <Link href="/pricing">View plan</Link>
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
