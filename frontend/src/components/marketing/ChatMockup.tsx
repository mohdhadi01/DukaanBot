'use client'

import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Check, CheckCheck } from 'lucide-react'

type Bubble = {
  from: 'bot' | 'customer'
  text: string
}

const SCRIPT: Bubble[] = [
  { from: 'bot', text: 'Namaste! 👋 Welcome to Sharma Kirana.\n\n1️⃣ See menu & order\n2️⃣ Shop hours\n3️⃣ Talk to owner' },
  { from: 'customer', text: '1' },
  { from: 'bot', text: '🛒 Today’s menu\n• Aashirvaad Atta — ₹280 / 5kg\n• Tata Salt — ₹28 / kg\n• Amul Milk — ₹34 / 500ml' },
  { from: 'customer', text: 'Atta + 2 milk' },
  { from: 'bot', text: '✅ Added! Total ₹348.\nReply *confirm* to place your order.' },
  { from: 'customer', text: 'confirm' },
  { from: 'bot', text: '🎉 Order #1042 placed! Out for delivery in 30 min.' },
]

const STEP_MS = 1300

export function ChatMockup() {
  const reduce = useReducedMotion()
  const [count, setCount] = useState(reduce ? SCRIPT.length : 1)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (reduce) return
    if (count >= SCRIPT.length) {
      // brief pause, then loop
      const reset = setTimeout(() => setCount(1), 2600)
      return () => clearTimeout(reset)
    }
    const next = setTimeout(() => setCount((c) => c + 1), STEP_MS)
    return () => clearTimeout(next)
  }, [count, reduce])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [count])

  const visible = SCRIPT.slice(0, count)

  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      {/* Phone frame */}
      <div className="rounded-[2rem] border border-slate-200 bg-white p-2 shadow-[0_24px_70px_-24px_rgba(2,6,23,0.35)]">
        <div className="overflow-hidden rounded-[1.6rem] border border-slate-100">
          {/* WhatsApp header */}
          <div className="flex items-center gap-3 bg-emerald-700 px-4 py-3 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold">
              SK
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Sharma Kirana Store</p>
              <p className="text-[11px] text-emerald-100">online</p>
            </div>
          </div>

          {/* Chat area */}
          <div
            ref={scrollRef}
            className="h-[330px] space-y-2 overflow-hidden bg-[#e9e3da] px-3 py-3"
          >
            <AnimatePresence initial={false}>
              {visible.map((b, i) => (
                <motion.div
                  key={i}
                  initial={reduce ? false : { opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className={
                    b.from === 'customer'
                      ? 'ml-auto max-w-[78%] rounded-2xl rounded-tr-sm bg-[#dcf8c6] px-3 py-2 text-[13px] leading-snug text-slate-800 shadow-sm'
                      : 'mr-auto max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 text-[13px] leading-snug text-slate-800 shadow-sm'
                  }
                >
                  <span className="whitespace-pre-line">{b.text}</span>
                  {b.from === 'customer' && (
                    <CheckCheck className="ml-1 inline h-3 w-3 -translate-y-px text-sky-500" />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Input bar (decorative) */}
          <div className="flex items-center gap-2 border-t border-slate-100 bg-white px-3 py-2">
            <div className="h-8 flex-1 rounded-full bg-slate-100" />
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white">
              <Check className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating order toast */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="absolute -right-3 bottom-16 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-medium text-emerald-800 shadow-lg"
      >
        + New order ₹348 🎉
      </motion.div>
    </div>
  )
}
