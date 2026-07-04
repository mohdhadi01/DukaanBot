'use client'

import { Reveal, Stagger, StaggerItem } from '@/components/marketing/motion'
import { Quote } from 'lucide-react'

const TESTIMONIALS = [
  {
    name: 'Ramesh Sharma',
    shop: 'Sharma Kirana, Delhi',
    quote: 'Pehle har customer ko manually reply karna padta tha. Ab bot orders le leta hai — main bas delivery pe focus karta hoon.',
    quoteEn: 'The bot takes orders while I focus on delivery.',
  },
  {
    name: 'Priya Verma',
    shop: 'Glow Salon, Pune',
    quote: 'QR scan karke 5 minute mein live ho gaye. Customers ko slot book karne mein bahut help mili.',
    quoteEn: 'Live in 5 minutes after scanning QR.',
  },
  {
    name: 'Arjun Mehta',
    shop: 'Mehta Tailors, Ahmedabad',
    quote: 'Simple dashboard, Hindi-friendly flow. Mere customers WhatsApp pe hi order dete hain ab.',
    quoteEn: 'Customers order on WhatsApp — no app needed.',
  },
]

export function Testimonials() {
  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="mb-12 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-emerald-600">Testimonials</p>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Shop owners love it</h2>
        </Reveal>
        <Stagger className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <StaggerItem key={t.name}>
              <div className="glass-card flex h-full flex-col gap-4 rounded-2xl p-6">
                <Quote className="h-8 w-8 text-emerald-200" />
                <p className="flex-1 text-sm leading-relaxed text-slate-700">&ldquo;{t.quote}&rdquo;</p>
                <p className="text-xs text-muted-foreground">{t.quoteEn}</p>
                <div className="border-t pt-4">
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.shop}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
