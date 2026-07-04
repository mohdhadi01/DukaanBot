import { MarketingNav, MarketingFooter } from '@/components/marketing/MarketingShell'
import { Hero } from '@/components/marketing/landing/Hero'
import { LogoStrip } from '@/components/marketing/landing/LogoStrip'
import { Features } from '@/components/marketing/landing/Features'
import { HowItWorks } from '@/components/marketing/landing/HowItWorks'
import { Testimonials } from '@/components/marketing/landing/Testimonials'
import { PricingTeaser } from '@/components/marketing/landing/PricingTeaser'
import { FAQSection } from '@/components/marketing/landing/FAQSection'
import { FinalCTA } from '@/components/marketing/landing/FinalCTA'

const STATS = [
  { value: '5 min', label: 'to first auto-reply' },
  { value: '₹499', label: 'a month, all-in' },
  { value: '14 days', label: 'free, no card' },
  { value: '0', label: 'lines of code' },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />

      <Hero />
      <LogoStrip />

      <section className="border-y border-slate-200/80 bg-white">
        <div className="mx-auto grid max-w-5xl grid-cols-2 divide-x divide-slate-100 px-4 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="px-4 py-8 text-center">
              <p className="text-2xl font-bold text-emerald-700 md:text-3xl">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <Features />
      <HowItWorks />
      <Testimonials />
      <PricingTeaser />
      <FAQSection />
      <FinalCTA />

      <MarketingFooter />
    </div>
  )
}
