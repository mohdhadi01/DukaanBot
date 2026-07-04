'use client'

import { Reveal, Stagger, StaggerItem } from '@/components/marketing/motion'

const STEPS = [
  { n: '01', title: 'Sign up free', desc: '14-day trial. No credit card to start.' },
  { n: '02', title: 'Build your menu', desc: 'Add products, prices, and categories in minutes.' },
  { n: '03', title: 'Design your bot', desc: 'Use the visual canvas — or start from our kirana template.' },
  { n: '04', title: 'Scan QR & go live', desc: 'Link your shop WhatsApp by scanning a QR code — bot live in 2 minutes.' },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-slate-200 bg-slate-50 py-24">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-600">
            Live in under an hour
          </p>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Four steps. No developer.</h2>
        </Reveal>

        <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <StaggerItem key={s.n}>
              <div className="relative h-full rounded-2xl border border-slate-200 bg-white p-6">
                <span className="text-3xl font-bold text-emerald-600/30">{s.n}</span>
                <h3 className="mt-2 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <span className="absolute right-5 top-7 hidden text-slate-300 lg:block">→</span>
                )}
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
