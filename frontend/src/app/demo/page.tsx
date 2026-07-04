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
import Link from 'next/link'

export default function DemoPage() {
  const view = useApp((s) => s.view)

  return (
    <ErrorBoundary>
      <div className="sticky top-0 z-40 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-center text-sm text-emerald-900">
        <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
        <span>
          You&apos;re exploring the <strong>free demo</strong> — runs in your browser, no signup needed.
        </span>
        <Link href="/register" className="font-semibold text-emerald-700 hover:underline">
          Start your free trial →
        </Link>
      </div>
      <AppShell mode="demo">
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
