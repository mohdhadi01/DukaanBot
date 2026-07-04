import { MarketingNav, MarketingFooter } from '@/components/marketing/MarketingShell'

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />
      <section className="bg-hero-radial py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Terms of Service</h1>
          <p className="mt-3 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-IN')}</p>
        </div>
      </section>
      <main className="mx-auto max-w-3xl flex-1 space-y-4 px-4 py-14 leading-relaxed text-muted-foreground">
        <p>By using DukaanBot you agree to use the service lawfully and comply with WhatsApp Business Policy and Meta Platform Terms.</p>
        <p>Subscriptions renew monthly unless cancelled. Free trial converts to paid plan unless cancelled before trial end. Refunds are handled case-by-case.</p>
        <p>DukaanBot is provided &quot;as is&quot;. We are not liable for lost orders due to WhatsApp API outages beyond our control.</p>
      </main>
      <MarketingFooter />
    </div>
  )
}
