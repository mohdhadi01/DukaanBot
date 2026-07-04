'use client'

import { Reveal, Stagger, StaggerItem } from '@/components/marketing/motion'
import {
  MessageCircle,
  Workflow,
  ShoppingCart,
  BarChart3,
  Smartphone,
  Store,
  type LucideIcon,
} from 'lucide-react'

type Feature = {
  icon: LucideIcon
  title: string
  desc: string
  /** spans 2 columns on lg in the bento grid */
  wide?: boolean
}

const FEATURES: Feature[] = [
  {
    icon: Workflow,
    title: 'Visual flow builder',
    desc: 'Drag-and-drop auto-replies — welcome messages, menus, branching, address collection. No coding.',
    wide: true,
  },
  {
    icon: MessageCircle,
    title: 'Scan QR & go live',
    desc: 'Link your shop WhatsApp in 2 minutes — no Meta developer account. Customers message for real; the bot replies instantly.',
  },
  {
    icon: ShoppingCart,
    title: 'Order management',
    desc: 'Orders land in your dashboard. Track pending → delivered in one click.',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    desc: 'Revenue charts, top products, customer insight — know what sells before you restock.',
  },
  {
    icon: Store,
    title: 'Menu builder',
    desc: 'Products with prices, units, categories. Out-of-stock items hide automatically.',
  },
  {
    icon: Smartphone,
    title: 'Works on mobile',
    desc: 'Run your shop from phone or desktop. Built for busy owners on the go.',
    wide: true,
  },
]

export function Features() {
  return (
    <section id="features" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-600">
            Everything in one place
          </p>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Your whole shop, running on WhatsApp
          </h2>
          <p className="mt-4 text-muted-foreground">
            Inspired by WeChat mini-programs — built for India’s small merchants who already live on WhatsApp.
          </p>
        </Reveal>

        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <StaggerItem key={f.title} className={f.wide ? 'lg:col-span-2' : ''}>
              <div className="glass-card lift h-full rounded-2xl p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-600/20">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1.5 font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
