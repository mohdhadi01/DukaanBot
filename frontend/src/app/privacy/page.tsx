import { MarketingNav, MarketingFooter } from '@/components/marketing/MarketingShell'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />
      <section className="bg-hero-radial py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Privacy Policy</h1>
          <p className="mt-3 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-IN')}</p>
        </div>
      </section>
      <main className="mx-auto max-w-3xl flex-1 space-y-4 px-4 py-14 leading-relaxed text-muted-foreground">
        <p>DukaanBot collects account information (name, email, phone) and shop data you provide. Customer messages and orders are stored to operate your chatbot service.</p>
        <p>We do not sell your data. WhatsApp message content is processed solely to run your bot. You may request data deletion by emailing support@dukaanbot.com.</p>
      </main>
      <MarketingFooter />
    </div>
  )
}
