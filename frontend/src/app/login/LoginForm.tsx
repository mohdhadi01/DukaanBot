'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { MarketingNav, MarketingFooter } from '@/components/marketing/MarketingShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MessageCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/components/providers/AuthProvider'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const params = useSearchParams()
  const { toast } = useToast()
  const { login, user, loading } = useAuth()
  const callbackUrl = params.get('callbackUrl') || '/app'

  console.log('[LoginForm] user:', user, 'loading:', loading)

  useEffect(() => {
    if (user) {
      router.push(callbackUrl)
    }
  }, [user, router, callbackUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      router.push(callbackUrl)
      router.refresh()
    } catch {
      toast({ title: 'Login failed', description: 'Invalid email or password', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-hero-radial">
      <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-50" />
      <MarketingNav />
      <div className="relative flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="space-y-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/30">
              <MessageCircle className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to manage your WhatsApp shop</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            No account?{' '}
            <Link href="/register" className="text-emerald-700 font-medium hover:underline">
              Start free trial
            </Link>
          </p>
          <p className="text-center text-xs text-muted-foreground">
            <Link href="/demo" className="hover:underline">Try the live demo</Link> without signing up
          </p>
        </div>
      </div>
      <MarketingFooter />
    </div>
  )
}
