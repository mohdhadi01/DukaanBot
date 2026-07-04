'use client'

import { Reveal } from '@/components/marketing/motion'
import { Store, Scissors, Shirt, UtensilsCrossed, Pill, Smartphone } from 'lucide-react'

const SHOPS = [
  { icon: Store, label: 'Kirana' },
  { icon: Scissors, label: 'Salon' },
  { icon: Shirt, label: 'Tailor' },
  { icon: UtensilsCrossed, label: 'Restaurant' },
  { icon: Pill, label: 'Pharmacy' },
  { icon: Smartphone, label: 'Electronics' },
]

export function LogoStrip() {
  return (
    <section className="border-y border-slate-200/80 bg-white/50 py-10 backdrop-blur">
      <Reveal className="mx-auto max-w-5xl px-4 text-center">
        <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Built for every small shop in India
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {SHOPS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-sm text-slate-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Icon className="h-5 w-5" />
              </div>
              <span className="font-medium">{label}</span>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
