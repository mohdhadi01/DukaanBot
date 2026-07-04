'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MarketingNav, MarketingFooter } from '@/components/marketing/MarketingShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

import { API_BASE } from '@/components/providers/AuthProvider'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const { toast } = useToast()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch(`${API_BASE}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setSent(true)
    toast({ title: 'Check your email', description: 'If an account exists, we sent a reset link.' })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border shadow-lg p-8 space-y-4">
          <h1 className="text-2xl font-bold">Forgot password</h1>
          {sent ? (
            <p className="text-sm text-muted-foreground">If that email is registered, you will receive a reset link.</p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">Send reset link</Button>
            </form>
          )}
          <Link href="/login" className="text-sm text-emerald-700 hover:underline">Back to login</Link>
        </div>
      </div>
      <MarketingFooter />
    </div>
  )
}
