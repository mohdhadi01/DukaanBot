'use client'

import { Reveal } from '@/components/marketing/motion'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const FAQ = [
  {
    q: 'Do I need a Meta developer account?',
    a: 'No. Connect your shop WhatsApp by scanning a QR code — just like WhatsApp Web. No Meta Business verification required to get started.',
  },
  {
    q: 'Can I try before signing up?',
    a: 'Yes! Open the free demo — it runs entirely in your browser with sample kirana store data. No database or backend setup needed.',
  },
  {
    q: 'How much does it cost?',
    a: 'Starter plan is ₹499/month after a 14-day free trial. Pro plan adds more conversations and priority support. No credit card required to start.',
  },
  {
    q: 'Will customers know it is a bot?',
    a: 'The bot replies instantly with your menu, prices, and order flow. You can always jump in from the Inbox to reply manually.',
  },
  {
    q: 'What do I need to run the full app?',
    a: 'For your real shop: PostgreSQL, the Express API backend, and optionally the WhatsApp worker for live QR connect. Docker Compose runs everything together.',
  },
]

export function FAQSection() {
  return (
    <section className="border-t bg-slate-50 py-24">
      <div className="mx-auto max-w-2xl px-4">
        <Reveal className="mb-10 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-emerald-600">FAQ</p>
          <h2 className="text-3xl font-bold tracking-tight">Common questions</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <Accordion type="single" collapsible className="w-full">
            {FAQ.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-sm font-medium">{item.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  )
}
