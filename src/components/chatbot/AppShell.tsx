'use client'

import { useApp, ViewName } from './store'
import { api, API } from './api'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  ShoppingCart,
  Workflow,
  Inbox,
  Package,
  Users,
  Settings,
  Menu as MenuIcon,
  X,
  Sparkles,
  RefreshCw,
  HelpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

const NAV: { id: ViewName; label: string; icon: any; description: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Overview & analytics' },
  { id: 'menu', label: 'Menu Builder', icon: Package, description: 'Manage products & services' },
  { id: 'flow', label: 'Flow Builder', icon: Workflow, description: 'Design auto-reply flow' },
  { id: 'inbox', label: 'Inbox', icon: Inbox, description: 'Customer conversations' },
  { id: 'orders', label: 'Orders', icon: ShoppingCart, description: 'Track & fulfill orders' },
  { id: 'customers', label: 'Customers', icon: Users, description: 'Customer directory' },
  { id: 'settings', label: 'Settings', icon: Settings, description: 'Shop configuration' },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const { view, setView, sidebarCollapsed, toggleSidebar, refreshKey } = useApp()
  const [shop, setShop] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pendingOrders, setPendingOrders] = useState(0)
  const [activeConversations, setActiveConversations] = useState(0)
  const [helpOpen, setHelpOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const { shop } = await api(API.shop)
        if (mounted) setShop(shop)
        if (shop) {
          const { orders } = await api(`${API.orders}?status=pending`)
          if (mounted) setPendingOrders(orders.length)
          const { conversations } = await api(API.conversations)
          if (mounted) setActiveConversations(conversations.filter((c: any) => c.status === 'active').length)
        }
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [refreshKey])

  const handleSeed = async () => {
    try {
      await api(API.seed, { method: 'POST' })
      toast({ title: 'Demo data loaded', description: 'Sample shop, menu, and orders created.' })
      useApp.getState().triggerRefresh()
    } catch (e: any) {
      toast({ title: 'Failed to seed', description: e.message, variant: 'destructive' })
    }
  }

  const currentNav = NAV.find((n) => n.id === view)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
          <p className="text-sm">Loading your shop...</p>
        </div>
      </div>
    )
  }

  if (!shop) {
    return <OnboardingScreen onSeed={handleSeed} />
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* Top bar */}
      <header className="sticky top-0 z-40 h-14 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="h-full flex items-center justify-between px-3 sm:px-5 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <MenuIcon className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ background: shop.primaryColor || '#16a34a' }}
              >
                {shop.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate leading-tight">{shop.name}</p>
                <p className="text-xs text-muted-foreground truncate leading-tight">
                  {currentNav?.label} · {currentNav?.description}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  'gap-1',
                  shop.isOpen ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', shop.isOpen ? 'bg-emerald-500' : 'bg-rose-500')} />
                {shop.isOpen ? 'Open' : 'Closed'}
              </Badge>
            </div>
            <Button onClick={handleSeed} variant="outline" size="sm" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Load Demo</span>
            </Button>
            <Button onClick={() => setHelpOpen(true)} variant="ghost" size="icon" className="h-8 w-8" aria-label="Help">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-60 shrink-0 border-r bg-background flex-col">
          <SidebarContent
            view={view}
            setView={(v) => {
              setView(v)
              setMobileOpen(false)
            }}
            pendingOrders={pendingOrders}
            activeConversations={activeConversations}
            shop={shop}
          />
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="relative w-72 bg-background border-r flex flex-col animate-in slide-in-from-left">
              <div className="h-14 flex items-center justify-between px-3 border-b">
                <span className="text-sm font-semibold">Menu</span>
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <SidebarContent
                view={view}
                setView={(v) => {
                  setView(v)
                  setMobileOpen(false)
                }}
                pendingOrders={pendingOrders}
                activeConversations={activeConversations}
                shop={shop}
              />
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
      </div>

      {/* Help dialog */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-emerald-600" />
              How DukaanBot Works
            </DialogTitle>
            <DialogDescription>A 60-second tour of your shop&apos;s WhatsApp chatbot builder</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm py-2">
            <HelpItem
              num="1"
              title="Build your menu"
              body="Go to Menu Builder and add products with prices, units, and categories. Customers will see these when they message you on WhatsApp."
            />
            <HelpItem
              num="2"
              title="Design the auto-reply flow"
              body="In Flow Builder, drag steps onto the canvas. Connect them by dragging from the dark circle on a step's right side. Click a connection line to label it or set a branching condition. The default flow already handles: welcome → menu choice → ordering → address → order placement."
            />
            <HelpItem
              num="3"
              title="Test the bot in Inbox"
              body="Click 'New' in Inbox to start a test chat. Type 'Hi' and the bot will walk you through the flow exactly like a real customer. Try sending '1' to pick menu options, item numbers like '1, 5' to add to cart, '0' to checkout, and 'confirm' to place an order."
            />
            <HelpItem
              num="4"
              title="Fulfill orders"
              body="Orders placed through the bot appear in the Orders view. Click an order to see details and advance it through the pipeline: Pending → Confirmed → Preparing → Ready → Delivered."
            />
            <HelpItem
              num="5"
              title="Personalize with variables"
              body="Use {{name}}, {{shopName}}, {{address}} etc. in Message and End steps. The bot fills these in automatically from what customers shared earlier in the flow."
            />
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800">
              <strong>💡 Tip:</strong> The 'Load Demo' button (top right) resets everything to a sample kirana store with 25 products, demo orders, and a ready-to-use flow — great for exploring or starting over.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function HelpItem({ num, title, body }: { num: string; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <div className="h-7 w-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
        {num}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{body}</p>
      </div>
    </div>
  )
}

function SidebarContent({
  view,
  setView,
  pendingOrders,
  activeConversations,
  shop,
}: {
  view: ViewName
  setView: (v: ViewName) => void
  pendingOrders: number
  activeConversations: number
  shop: any
}) {
  return (
    <div className="flex-1 flex flex-col">
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon
          const active = view === item.id
          const badge =
            item.id === 'orders' && pendingOrders > 0
              ? pendingOrders
              : item.id === 'inbox' && activeConversations > 0
                ? activeConversations
                : null
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                'hover:bg-muted/70',
                active && 'bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-50'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-emerald-600' : 'text-muted-foreground')} />
              <span className="flex-1 text-left truncate">{item.label}</span>
              {badge && (
                <span className="text-[10px] font-bold bg-rose-500 text-white rounded-full px-1.5 py-0.5 min-w-4 text-center">
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>
      <div className="p-3 border-t">
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: shop.primaryColor || '#16a34a' }}
            >
              {shop.ownerName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{shop.ownerName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{shop.whatsappNumber}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function OnboardingScreen({ onSeed }: { onSeed: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-4">
      <div className="max-w-md w-full text-center space-y-6 p-8 bg-white rounded-2xl shadow-xl border">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-emerald-500 flex items-center justify-center text-white">
          <Sparkles className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Welcome to DukaanBot</h1>
          <p className="text-muted-foreground text-sm">
            The no-code WhatsApp chatbot builder for small shops. Set up your menu, design your
            auto-reply flow, and take orders on WhatsApp — just like WeChat mini-programs in China.
          </p>
        </div>
        <Button onClick={onSeed} className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2">
          <Sparkles className="h-4 w-4" />
          Load Demo Shop
        </Button>
        <p className="text-xs text-muted-foreground">
          We&apos;ll create a sample kirana store with products, an auto-reply flow, and demo orders so
          you can explore everything instantly.
        </p>
      </div>
    </div>
  )
}
