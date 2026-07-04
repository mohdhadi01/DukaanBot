import Link from 'next/link'
import { MarketingNav, MarketingFooter } from '@/components/marketing/MarketingShell'
import { Button } from '@/components/ui/button'

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />
      <section className="bg-hero-radial py-16">
        <div className="mx-auto max-w-3xl px-4">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-600">Our story</p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">About DukaanBot</h1>
        </div>
      </section>
      <main className="mx-auto max-w-3xl flex-1 space-y-6 px-4 py-14">
        <p className="text-muted-foreground leading-relaxed">
          DukaanBot was built for India&apos;s small shop owners — kirana stores, salons, tailors, tutors, bakeries, and pharmacies —
          who already run their business on WhatsApp but lack the tools to automate orders and replies.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Inspired by WeChat mini-programs in China, we give every merchant a no-code chatbot builder: design your menu,
          build your auto-reply flow, connect your WhatsApp Business number, and start taking orders — without hiring a developer.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          We&apos;re based in India, priced in rupees, and built for the way Indian customers actually shop: on WhatsApp.
        </p>
        <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700" asChild>
          <Link href="/register">Start your free trial</Link>
        </Button>
      </main>
      <MarketingFooter />
    </div>
  )
}
