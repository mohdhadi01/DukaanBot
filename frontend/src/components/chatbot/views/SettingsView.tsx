'use client'

import { useEffect, useState } from 'react'
import { api, API, SHOP_TYPES } from '../api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useApp } from '../store'
import { ConnectWhatsApp } from '@/components/whatsapp/ConnectWhatsApp'
import {
  Store,
  Phone,
  Clock,
  MapPin,
  Save,
  Loader2,
  MessageCircle,
  Sparkles,
  RotateCcw,
  Trash2,
} from 'lucide-react'

const COLORS = [
  { name: 'Emerald', value: '#16a34a' },
  { name: 'Teal', value: '#0d9488' },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Orange', value: '#ea580c' },
  { name: 'Purple', value: '#9333ea' },
  { name: 'Cyan', value: '#0891b2' },
  { name: 'Slate', value: '#475569' },
]

export function SettingsView() {
  const [shop, setShop] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({})
  const { refreshKey, triggerRefresh } = useApp()
  const { toast } = useToast()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { shop } = await api(API.shop)
      if (mounted) {
        setShop(shop)
        setForm(shop || {})
        setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [refreshKey])

  const update = (k: string, v: any) => setForm({ ...form, [k]: v })

  const handleSave = async () => {
    setSaving(true)
    try {
      await api(API.shop, {
        method: 'PATCH',
        body: JSON.stringify(form),
      })
      toast({ title: 'Settings saved', description: 'Your shop details have been updated.' })
      triggerRefresh()
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('Reset everything? This deletes all products, orders, conversations, and flow. Demo data will be reloaded.')) return
    try {
      await api(API.seed, { method: 'POST' })
      toast({ title: 'Shop reset to demo data' })
      triggerRefresh()
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' })
    }
  }

  if (loading || !shop) {
    return <div className="p-6 text-sm text-muted-foreground">Loading...</div>
  }

  const shopType = SHOP_TYPES.find((t) => t.value === form.type) || SHOP_TYPES[0]

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your shop profile, WhatsApp number, and branding.
        </p>
      </div>

      {/* Shop profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Store className="h-4 w-4 text-emerald-600" />
            Shop Profile
          </CardTitle>
          <CardDescription>Basic information shown to customers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Shop Name *</Label>
              <Input value={form.name || ''} onChange={(e) => update('name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Shop Type</Label>
              <Select value={form.type || 'kirana'} onValueChange={(v) => update('type', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHOP_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.emoji} {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Owner Name</Label>
              <Input value={form.ownerName || ''} onChange={(e) => update('ownerName', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp Number</Label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={form.whatsappNumber || ''}
                  onChange={(e) => update('whatsappNumber', e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={form.description || ''}
              onChange={(e) => update('description', e.target.value)}
              rows={3}
              placeholder="A short tagline shown to customers when they first message you."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Opening Hours</Label>
              <div className="relative">
                <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={form.hours || ''}
                  onChange={(e) => update('hours', e.target.value)}
                  className="pl-9"
                  placeholder="Mon-Sun: 9 AM - 9 PM"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Currency Symbol</Label>
              <Input
                value={form.currency || '₹'}
                onChange={(e) => update('currency', e.target.value)}
                maxLength={3}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Address</Label>
            <div className="relative">
              <MapPin className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                value={form.address || ''}
                onChange={(e) => update('address', e.target.value)}
                rows={2}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branding & availability */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            Branding & Availability
          </CardTitle>
          <CardDescription>Visual identity and shop status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Primary Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => update('primaryColor', c.value)}
                  className={`h-9 w-9 rounded-lg border-2 transition-all ${form.primaryColor === c.value ? 'border-slate-900 scale-110' : 'border-transparent hover:scale-105'}`}
                  style={{ background: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <Label className="text-sm cursor-pointer" htmlFor="open">Shop is Open</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                When closed, customers see a &quot;we&apos;re closed&quot; message.
              </p>
            </div>
            <Switch
              id="open"
              checked={form.isOpen !== false}
              onCheckedChange={(c) => update('isOpen', c)}
            />
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp QR connect */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-green-600" />
            WhatsApp Connection
          </CardTitle>
          <CardDescription>
            Scan QR with your shop phone to receive real customer messages and auto-replies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConnectWhatsApp />
        </CardContent>
      </Card>

      {/* WhatsApp preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-emerald-600" />
            WhatsApp Preview
          </CardTitle>
          <CardDescription>How your shop appears in WhatsApp</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-[#e5ddd5] rounded-lg p-4 max-w-sm">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
                  style={{ background: form.primaryColor || '#16a34a' }}
                >
                  {form.name?.charAt(0) || 'S'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{form.name || 'Your Shop'}</p>
                  <p className="text-xs text-muted-foreground truncate">{shopType.emoji} {shopType.label}</p>
                  <Badge
                    variant="outline"
                    className={`mt-1 text-[9px] ${form.isOpen !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}
                  >
                    {form.isOpen !== false ? '● Online' : '● Closed'}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-slate-700 mt-3">{form.description || 'Your description will appear here.'}</p>
              <p className="text-xs text-slate-500 mt-2">🕘 {form.hours || 'Hours not set'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleSave} disabled={saving} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </Button>
        <Button variant="outline" onClick={handleReset} className="gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50">
          <RotateCcw className="h-4 w-4" />
          Reset to Demo Data
        </Button>
      </div>
    </div>
  )
}
