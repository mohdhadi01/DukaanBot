'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { MarketingNav, MarketingFooter } from '@/components/marketing/MarketingShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

import { API_BASE } from '@/components/providers/AuthProvider'

function ResetForm() {
  const params = useSearchParams()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const router = useRouter()
  const { toast } = useToast()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast({ title: 'Failed', description: data.error, variant: 'destructive' })
      return
    }
    toast({ title: 'Password updated' })
    router.push('/login')
  }

  if (!token) {
    return <p className="text-sm text-destructive">Invalid reset link.</p>
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label>New password</Label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
      </div>
      <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">Reset password</Button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border shadow-lg p-8 space-y-4">
          <h1 className="text-2xl font-bold">Reset password</h1>
          <Suspense fallback={<p>Loading...</p>}>
            <ResetForm />
          </Suspense>
          <Link href="/login" className="text-sm text-emerald-700 hover:underline">Back to login</Link>
        </div>
      </div>
      <MarketingFooter />
    </div>
  )
}
