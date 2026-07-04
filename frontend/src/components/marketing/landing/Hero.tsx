'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ChatMockup } from '@/components/marketing/ChatMockup'
import { ArrowRight, PlayCircle, Sparkles, CheckCircle2, Star } from 'lucide-react'

const EASE = [0.22, 1, 0.36, 1] as const
const TRUST = ['Scan QR & go live', 'No code', 'Order dashboard', 'Made for India']

const AVATARS = ['RS', 'PV', 'AM', 'LI']

export function Hero() {
  const reduce = useReducedMotion()

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: EASE, delay },
  })

  return (
    <section className="relative overflow-hidden bg-mesh-hero">
      <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-teal-300/25 blur-3xl animate-blob animation-delay-2000" />
      <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-40" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 md:grid-cols-2 md:py-28">
        <div className="space-y-7">
          <motion.div
            {...rise(0)}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/70 px-3 py-1 text-xs font-medium text-emerald-800 shadow-sm backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5" />
            14-day free trial · No credit card
          </motion.div>

          <motion.h1
            {...rise(0.08)}
            className="text-balance text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl"
          >
            Your shop on
            <br />
            <span className="text-gradient">WhatsApp.</span>
            <br />
            <span className="text-slate-700">Orders on autopilot.</span>
          </motion.h1>

          <motion.p
            {...rise(0.16)}
            className="max-w-md text-lg leading-relaxed text-muted-foreground"
          >
            Build a no-code WhatsApp chatbot for your kirana, salon, or tailor shop.
            Take orders, answer questions, and manage customers — automatically.
          </motion.p>

          <motion.div {...rise(0.24)} className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="group h-12 gap-2 bg-emerald-600 px-6 text-base shadow-lg shadow-emerald-600/25 hover:bg-emerald-700"
              asChild
            >
              <Link href="/demo">
                <PlayCircle className="h-4 w-4" />
                Try free demo
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 gap-2 border-slate-300 bg-white/80 px-6 text-base backdrop-blur hover:border-emerald-300 hover:bg-emerald-50"
              asChild
            >
              <Link href="/register">Start free trial</Link>
            </Button>
          </motion.div>

          <motion.div {...rise(0.32)} className="flex flex-wrap items-center gap-4 pt-1">
            <div className="flex -space-x-2">
              {AVATARS.map((a) => (
                <div
                  key={a}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-[10px] font-bold text-white"
                >
                  {a}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>
                <strong className="text-foreground">500+</strong> shops exploring DukaanBot
              </span>
            </div>
          </motion.div>

          <motion.ul {...rise(0.36)} className="flex flex-wrap gap-x-5 gap-y-2">
            {TRUST.map((t) => (
              <li key={t} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> {t}
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 28, scale: reduce ? 1 : 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
          className="relative"
        >
          <div className="absolute -right-4 top-8 z-10 hidden rounded-2xl border border-white/60 bg-white/90 p-3 shadow-xl backdrop-blur md:block">
            <p className="text-[10px] font-medium text-muted-foreground">Today&apos;s orders</p>
            <p className="text-2xl font-bold text-emerald-700">₹4,280</p>
          </div>
          <div className="absolute -left-2 bottom-12 z-10 hidden rounded-2xl border border-white/60 bg-white/90 p-3 shadow-xl backdrop-blur md:block">
            <p className="text-[10px] font-medium text-muted-foreground">Auto-replies</p>
            <p className="text-lg font-bold">24/7 live</p>
          </div>
          <ChatMockup />
        </motion.div>
      </div>
    </section>
  )
}
