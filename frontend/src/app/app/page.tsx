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

export default function AppDashboardPage() {
  const view = useApp((s) => s.view)

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
