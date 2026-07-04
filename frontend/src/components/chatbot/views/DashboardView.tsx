'use client'

import { useEffect, useState } from 'react'
import { api, API, formatINR, formatDate, getStatusMeta } from '../api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  ShoppingBag,
  Users,
  MessageSquare,
  Package,
  IndianRupee,
  ArrowUpRight,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useApp } from '../store'
import { ConnectWhatsApp, useWhatsappStatus } from '@/components/whatsapp/ConnectWhatsApp'
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts'

export function DashboardView() {
  const [data, setData] = useState<any>(null)
  const [shop, setShop] = useState<any>(null)
  const { refreshKey } = useApp()
  const waStatus = useWhatsappStatus()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const [a, s] = await Promise.all([api(API.analytics), api(API.shop)])
      if (mounted) {
        setData(a.analytics)
        setShop(s.shop)
      }
    })()
    return () => {
      mounted = false
    }
  }, [refreshKey])

  if (!data || !shop) {
    return <div className="p-6 text-sm text-muted-foreground">Loading analytics...</div>
  }

  const dailyRevenue = data.dailyRevenue.map((d: any) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' }),
  }))

  const topProducts = data.topProducts.map((p: any, i: number) => ({
    ...p,
    fill: ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0'][i],
  }))

  const stats = [
    {
      label: 'Total Revenue',
      value: formatINR(data.totalRevenue),
      icon: IndianRupee,
      sub: `${formatINR(data.avgOrderValue)} avg order`,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Total Orders',
      value: data.totalOrders,
      icon: ShoppingBag,
      sub: `${data.last30Days.orders} in last 30 days`,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Customers',
      value: data.totalCustomers,
      icon: Users,
      sub: 'Across all conversations',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Conversations',
      value: data.totalConversations,
      icon: MessageSquare,
      sub: `${shop.isOpen ? 'Shop is open' : 'Shop closed'}`,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Good day, {shop.ownerName.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening at {shop.name} today.
          </p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 gap-2"
          onClick={() => useApp.getState().setView('inbox')}
        >
          <MessageSquare className="h-4 w-4" />
          Open Inbox
        </Button>
      </div>

      {waStatus.status !== 'connected' && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-amber-900">WhatsApp not connected yet</p>
              <p className="text-sm text-amber-800/80">
                Customers can&apos;t message your shop until you scan the QR code.
              </p>
            </div>
            <ConnectWhatsApp compact />
          </CardContent>
        </Card>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="relative overflow-hidden">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      {s.label}
                    </p>
                    <p className="text-xl sm:text-2xl font-bold mt-1 truncate">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{s.sub}</p>
                  </div>
                  <div className={`h-9 w-9 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Revenue This Week</CardTitle>
                <CardDescription>Daily order revenue (excludes cancelled)</CardDescription>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                <TrendingUp className="h-3 w-3" />
                {formatINR(dailyRevenue.reduce((s: number, d: any) => s + d.revenue, 0))}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyRevenue} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#16a34a" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                    formatter={(v: any) => [formatINR(v), 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Products</CardTitle>
            <CardDescription>By units sold</CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No sales yet. Open the simulator to try ordering.
              </p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p: any, i: number) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.count} sold · {formatINR(p.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order status + recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Status</CardTitle>
            <CardDescription>Current distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data.statusBreakdown).map(([status, count]: [string, any]) => {
              const meta = getStatusMeta(status)
              const pct = data.totalOrders > 0 ? Math.round((count / data.totalOrders) * 100) : 0
              return (
                <div key={status}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={`px-2 py-0.5 rounded-full border text-xs ${meta.color}`}>
                      {meta.label}
                    </span>
                    <span className="text-muted-foreground">
                      {count} · {pct}%
                    </span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              )
            })}
            {Object.keys(data.statusBreakdown).length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No orders yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Orders</CardTitle>
                <CardDescription>Latest activity</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="gap-1 text-emerald-600" onClick={() => useApp.getState().setView('orders')}>
                View all <ArrowUpRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No orders yet. Open the WhatsApp simulator in Inbox to test.
              </p>
            ) : (
              data.recentOrders.map((o: any) => {
                const meta = getStatusMeta(o.status)
                return (
                  <div
                    key={o.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                      {o.customerName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{o.customerName}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatINR(o.total)}</p>
                      <Badge variant="outline" className={`text-xs mt-0.5 ${meta.color}`}>
                        {meta.label}
                      </Badge>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Quick Actions
          </CardTitle>
          <CardDescription>Jump back into building</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <QuickAction
            icon={Package}
            title="Add Product"
            desc="Add a new item to your menu"
            color="bg-emerald-50 text-emerald-600"
            onClick={() => useApp.getState().setView('menu')}
          />
          <QuickAction
            icon={Sparkles}
            title="Edit Flow"
            desc="Customize the auto-reply flow"
            color="bg-purple-50 text-purple-600"
            onClick={() => useApp.getState().setView('flow')}
          />
          <QuickAction
            icon={MessageSquare}
            title="Test on WhatsApp"
            desc="See the bot from a customer's view"
            color="bg-amber-50 text-amber-600"
            onClick={() => useApp.getState().setView('inbox')}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function QuickAction({
  icon: Icon,
  title,
  desc,
  color,
  onClick,
}: {
  icon: any
  title: string
  desc: string
  color: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-3 p-4 rounded-lg border hover:border-emerald-300 hover:bg-muted/30 transition-colors text-left"
    >
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </button>
  )
}
