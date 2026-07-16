'use client'

import { AppShell } from '@/components/chatbot/AppShell'
import { ErrorBoundary } from '@/components/chatbot/ErrorBoundary'
import { useApp } from '@/components/chatbot/store'
import { DashboardView } from '@/components/chatbot/views/DashboardView'
import { MenuView } from '@/components/chatbot/views/MenuView'
import { FlowView } from '@/components/chatbot/views/FlowView'
import { InboxView } from '@/components/chatbot/views/InboxView'
import { OrdersView } from '@/components/chatbot/views/OrdersView'
import { CustomersView } from '@/components/chatbot/views/CustomersView'
import { SettingsView } from '@/components/chatbot/views/SettingsView'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

export default function AppDashboardPage() {
  const view = useApp((s) => s.view)
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?callbackUrl=/app')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
          <p className="text-sm">Verifying session...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <ErrorBoundary>
      <AppShell mode="app">
        {view === 'dashboard' && <DashboardView />}
        {view === 'menu' && <MenuView />}
        {view === 'flow' && <FlowView />}
        {view === 'inbox' && <InboxView />}
        {view === 'orders' && <OrdersView />}
        {view === 'customers' && <CustomersView />}
        {view === 'settings' && <SettingsView />}
      </AppShell>
    </ErrorBoundary>
  )
}
