'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MarketingNav, MarketingFooter } from '@/components/marketing/MarketingShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MessageCircle, Loader2, Sparkles, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { API_BASE } from '@/components/providers/AuthProvider'
import { useAuth } from '@/components/providers/AuthProvider'

const BENEFITS = [
  'Free for 14 days — no credit card',
  'Visual no-code flow builder',
  'Scan QR & go live on WhatsApp',
  'Orders + customers dashboard',
]

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', shopName: '' })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { refresh } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')

      await refresh()
      toast({ title: 'Welcome to DukaanBot!', description: 'Your 14-day free trial has started.' })
      router.push('/onboarding')
      router.refresh()
    } catch (e: any) {
      toast({ title: 'Registration failed', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-hero-radial">
      <MarketingNav />
      <div className="flex flex-1 items-center justify-center p-4 py-12">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl md:grid-cols-2">
          <div className="relative hidden flex-col justify-between bg-emerald-700 p-10 text-white md:flex">
            <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-[0.12]" />
            <div className="relative space-y-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold leading-tight">Your shop on WhatsApp, live today.</h2>
              <p className="text-sm text-emerald-100">
                Join small merchants across India automating orders and replies — no developer needed.
              </p>
            </div>
            <ul className="relative space-y-3 pt-8">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-center gap-2 text-sm text-emerald-50">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-200" /> {b}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-5 p-8 md:p-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                <Sparkles className="h-3 w-3" /> 14-day free trial
              </div>
              <h1 className="text-2xl font-bold">Create your account</h1>
              <p className="text-sm text-muted-foreground">Set up your WhatsApp shop in under an hour</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-2">
                <Label>Your name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Shop name</Label>
                <Input value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} placeholder="e.g. Sharma Kirana" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Phone (WhatsApp)</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
              </div>
              <div className="space-y-2">
                <Label>Password (min 8 chars)</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Start free trial'}
              </Button>
            </form>
            <p className="text-center text-xs text-muted-foreground">
              By signing up you agree to our{' '}
              <Link href="/terms" className="underline">Terms</Link> and{' '}
              <Link href="/privacy" className="underline">Privacy Policy</Link>.
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-emerald-700 font-medium hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
      <MarketingFooter />
    </div>
  )
}
