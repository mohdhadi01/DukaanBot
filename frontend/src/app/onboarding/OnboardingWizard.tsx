'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth, API_BASE } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { SHOP_TYPES } from '@/components/chatbot/api'
import {
  CheckCircle2,
  MessageCircle,
  Store,
  Workflow,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { ConnectWhatsApp } from '@/components/whatsapp/ConnectWhatsApp'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 0, title: 'Welcome', icon: Sparkles },
  { id: 1, title: 'Your shop', icon: Store },
  { id: 2, title: 'WhatsApp', icon: MessageCircle },
  { id: 3, title: 'Your bot flow', icon: Workflow },
  { id: 4, title: 'Choose plan', icon: CreditCard },
]

export default function OnboardingWizard() {
  const { user, refresh, updateLocal } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [shopForm, setShopForm] = useState({
    name: '',
    type: 'kirana',
    ownerName: '',
    whatsappNumber: '',
    description: '',
    hours: '9 AM - 9 PM',
    address: '',
  })
  const [waForm, setWaForm] = useState({
    whatsappPhoneNumberId: '',
    whatsappAccessToken: '',
    whatsappVerifyToken: 'dukaanbot_verify',
  })

  useEffect(() => {
    const s = params.get('step')
    if (s) setStep(parseInt(s, 10) || 0)
    fetch(`${API_BASE}/api/onboarding`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.onboardingStep) setStep(d.user.onboardingStep)
        if (d.user?.shop) {
          setShopForm({
            name: d.user.shop.name || '',
            type: d.user.shop.type || 'kirana',
            ownerName: d.user.shop.ownerName || d.user.name || '',
            whatsappNumber: d.user.shop.whatsappNumber || '',
            description: d.user.shop.description || '',
            hours: d.user.shop.hours || '9 AM - 9 PM',
            address: d.user.shop.address || '',
          })
          setWaForm({
            whatsappPhoneNumberId: d.user.shop.whatsappPhoneNumberId || '',
            whatsappAccessToken: '',
            whatsappVerifyToken: d.user.shop.whatsappVerifyToken || 'dukaanbot_verify',
          })
        } else if (d.user?.name) {
          setShopForm((f) => ({ ...f, ownerName: d.user.name }))
        }
      })
      .catch(() => {})
  }, [params])

  const saveStep = async (nextStep: number) => {
    setLoading(true)
    try {
      const body: Record<string, unknown> = { onboardingStep: nextStep, shop: shopForm }
      if (nextStep >= 2 && waForm.whatsappPhoneNumberId) {
        body.shop = {
          ...shopForm,
          ...waForm,
          whatsappConnected: !!(waForm.whatsappPhoneNumberId && waForm.whatsappAccessToken),
        }
      }
      await fetch(`${API_BASE}/api/onboarding`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      setStep(nextStep)
    } catch {
      toast({ title: 'Failed to save', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const finish = async (subscribe = false) => {
    setLoading(true)
    try {
      if (subscribe) {
        const res = await fetch(`${API_BASE}/api/stripe/checkout`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: 'starter' }),
        })
        const data = await res.json()
        if (data.url) {
          window.location.href = data.url
          return
        }
      }
      await fetch(`${API_BASE}/api/onboarding`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboardingDone: true, onboardingStep: 5 }),
      })
      updateLocal({ onboardingDone: true })
      toast({ title: "You're all set!", description: 'Welcome to DukaanBot.' })
      router.push('/app')
      router.refresh()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50">
      <header className="border-b bg-white/90 backdrop-blur px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold">
          <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-xs">DB</div>
          DukaanBot Setup
        </div>
        <span className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const done = i < step
            const active = i === step
            return (
              <div key={s.id} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={cn(
                    'h-9 w-9 rounded-full flex items-center justify-center text-xs',
                    done && 'bg-emerald-600 text-white',
                    active && 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-600',
                    !done && !active && 'bg-muted text-muted-foreground'
                  )}
                >
                  {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className="text-[10px] text-muted-foreground hidden sm:block">{s.title}</span>
              </div>
            )
          })}
        </div>

        <div className="bg-white rounded-2xl border shadow-lg p-6 md:p-8 space-y-6">
          {step === 0 && (
            <>
              <div className="text-center space-y-3">
                <h1 className="text-2xl font-bold">Welcome, {user?.name?.split(' ')[0] || 'there'}! 👋</h1>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  This quick setup walks you through creating your WhatsApp shop bot in about 10 minutes.
                </p>
              </div>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => saveStep(1)} disabled={loading}>
                Let&apos;s go <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="text-xl font-bold">Tell us about your shop</h2>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Shop name</Label>
                  <Input value={shopForm.name} onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Shop type</Label>
                  <Select value={shopForm.type} onValueChange={(v) => setShopForm({ ...shopForm, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SHOP_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.emoji} {t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Owner name</Label>
                  <Input value={shopForm.ownerName} onChange={(e) => setShopForm({ ...shopForm, ownerName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp number</Label>
                  <Input value={shopForm.whatsappNumber} onChange={(e) => setShopForm({ ...shopForm, whatsappNumber: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Textarea value={shopForm.address} onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })} rows={2} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(0)}><ArrowLeft className="h-4 w-4" /></Button>
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => saveStep(2)} disabled={loading}>Continue</Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-bold">Connect WhatsApp</h2>
              <p className="text-sm text-muted-foreground">
                Scan QR code with your shop phone — same as WhatsApp Web. Bot goes live in 2 minutes.
              </p>
              <ConnectWhatsApp />
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4" /></Button>
                <Button variant="outline" className="flex-1" onClick={() => saveStep(3)} disabled={loading}>Skip for now</Button>
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => saveStep(3)} disabled={loading}>Continue</Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-xl font-bold">Your bot flow is ready</h2>
              <p className="text-sm text-muted-foreground">Default flow: welcome → menu → order → address → place order.</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="h-4 w-4" /></Button>
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => saveStep(4)} disabled={loading}>Continue to plans</Button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="text-xl font-bold">Choose your plan</h2>
              <p className="text-sm text-muted-foreground">14-day free trial included. Subscribe now or continue with trial.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="border rounded-xl p-4 space-y-3">
                  <p className="font-bold">Starter — ₹499/mo</p>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => finish(true)} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Subscribe'}
                  </Button>
                </div>
                <div className="border-2 border-emerald-600 rounded-xl p-4 space-y-3">
                  <p className="font-bold">Continue free trial</p>
                  <Button variant="outline" className="w-full" onClick={() => finish(false)} disabled={loading}>Go to dashboard</Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
