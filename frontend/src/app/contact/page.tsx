import { MarketingNav, MarketingFooter } from '@/components/marketing/MarketingShell'

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />
      <section className="bg-hero-radial py-16">
        <div className="mx-auto max-w-3xl px-4">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-600">Get in touch</p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Contact us</h1>
          <p className="mt-3 text-muted-foreground">We&apos;d love to hear from you.</p>
        </div>
      </section>
      <main className="mx-auto max-w-3xl flex-1 px-4 py-14">
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 text-sm shadow-sm">
          <p><strong>Email:</strong> support@dukaanbot.com</p>
          <p><strong>WhatsApp:</strong> +91 98765 43210</p>
          <p><strong>Hours:</strong> Mon–Sat, 10 AM – 6 PM IST</p>
        </div>
      </main>
      <MarketingFooter />
    </div>
  )
}
