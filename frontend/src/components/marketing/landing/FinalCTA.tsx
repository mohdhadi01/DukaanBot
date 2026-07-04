'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/marketing/motion'
import { ArrowRight } from 'lucide-react'

export function FinalCTA() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-5xl px-4">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-emerald-700 px-6 py-16 text-center text-white md:px-16">
            <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-[0.12]" />
            <div className="relative space-y-6">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Put your shop on WhatsApp today
              </h2>
              <p className="mx-auto max-w-xl text-emerald-100">
                Try the full demo in 60 seconds — no signup. Or start your 14-day free trial now.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="h-12 bg-white px-7 text-base text-emerald-800 hover:bg-emerald-50"
                  asChild
                >
                  <Link href="/register">Start free trial</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="group h-12 gap-2 border-white/40 bg-transparent px-7 text-base text-white hover:bg-white/10 hover:text-white"
                  asChild
                >
                  <Link href="/demo">
                    Try live demo
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
