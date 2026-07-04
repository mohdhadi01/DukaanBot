'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MessageCircle, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
]

export function MarketingNav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-slate-200 bg-white/80 shadow-sm backdrop-blur-lg'
          : 'border-b border-transparent bg-white/0'
      )}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/30">
            <MessageCircle className="h-5 w-5" />
          </div>
          <span>DukaanBot</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn('hover:text-emerald-700 transition-colors', pathname === l.href && 'text-emerald-700')}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/demo">Try demo</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
            <Link href="/register">Start free trial</Link>
          </Button>
        </div>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {open && (
        <div className="md:hidden border-t px-4 py-4 space-y-3 bg-white">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="block text-sm" onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" asChild>
              <Link href="/register">Start trial</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-14 grid sm:grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-bold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-xs text-white shadow-sm shadow-emerald-600/30">
              DB
            </div>
            DukaanBot
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            WhatsApp chatbot builder for India&apos;s small shops. No code. Real orders. Real customers.
          </p>
        </div>
        <div>
          <p className="font-semibold mb-3">Product</p>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link href="/#features" className="hover:text-emerald-700">Features</Link></li>
            <li><Link href="/pricing" className="hover:text-emerald-700">Pricing</Link></li>
            <li><Link href="/demo" className="hover:text-emerald-700">Live demo</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold mb-3">Company</p>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link href="/about" className="hover:text-emerald-700">About us</Link></li>
            <li><Link href="/contact" className="hover:text-emerald-700">Contact</Link></li>
            <li><Link href="/privacy" className="hover:text-emerald-700">Privacy</Link></li>
            <li><Link href="/terms" className="hover:text-emerald-700">Terms</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold mb-3">Get started</p>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link href="/register" className="hover:text-emerald-700">14-day free trial</Link></li>
            <li><Link href="/login" className="hover:text-emerald-700">Sign in</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} DukaanBot. Built for kirana stores, salons, tailors & small businesses across India.
      </div>
    </footer>
  )
}
