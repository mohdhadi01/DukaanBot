'use client'

import { useEffect, useState, useMemo } from 'react'
import { api, API, formatINR, formatDate, getStatusMeta, ORDER_STATUSES } from '../api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useToast } from '@/hooks/use-toast'
import { useApp } from '../store'
import {
  ShoppingCart,
  Search,
  Phone,
  MapPin,
  Clock,
  IndianRupee,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Loader2,
  Filter,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'ready', 'delivered']

export function OrdersView() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const { refreshKey } = useApp()
  const { toast } = useToast()

  const load = async () => {
    setLoading(true)
    try {
      const { orders } = await api(API.orders)
      setOrders(orders)
    } catch (e) {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (cancelled) return
      await load()
    })()
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (filterStatus !== 'all' && o.status !== filterStatus) return false
      if (search) {
        const s = search.toLowerCase()
        return (
          o.customer?.name.toLowerCase().includes(s) ||
          o.customer?.phone.includes(s) ||
          o.id.toLowerCase().includes(s)
        )
      }
      return true
    })
  }, [orders, search, filterStatus])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length }
    for (const o of orders) c[o.status] = (c[o.status] || 0) + 1
    return c
  }, [orders])

  const updateStatus = async (orderId: string, status: string) => {
    try {
      const { order } = await api(API.orders, {
        method: 'PATCH',
        body: JSON.stringify({ id: orderId, status }),
      })
      setOrders((os) => os.map((o) => (o.id === orderId ? order : o)))
      setSelectedOrder(order)
      toast({ title: `Order marked as ${getStatusMeta(status).label}` })
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track and fulfill orders coming through your WhatsApp bot.
        </p>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        <FilterChip
          label="All"
          count={counts.all || 0}
          active={filterStatus === 'all'}
          onClick={() => setFilterStatus('all')}
        />
        {ORDER_STATUSES.map((s) => (
          <FilterChip
            key={s.value}
            label={s.label}
            count={counts[s.value] || 0}
            active={filterStatus === s.value}
            onClick={() => setFilterStatus(s.value)}
          />
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by customer, phone, or order ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
          Loading orders...
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium">No orders found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {orders.length === 0
                ? 'When customers order via WhatsApp, orders will appear here.'
                : 'Try adjusting your filters.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              onClick={() => setSelectedOrder(o)}
              onAdvance={() => {
                const idx = STATUS_FLOW.indexOf(o.status)
                if (idx >= 0 && idx < STATUS_FLOW.length - 1) {
                  updateStatus(o.id, STATUS_FLOW[idx + 1])
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Order detail sheet */}
      <Sheet open={!!selectedOrder} onOpenChange={(o) => !o && setSelectedOrder(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selectedOrder && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  Order #{selectedOrder.id.slice(-6).toUpperCase()}
                </SheetTitle>
                <SheetDescription>
                  Placed {formatDate(selectedOrder.createdAt)}
                </SheetDescription>
              </SheetHeader>
              <div className="px-4 pb-6 space-y-4">
                {/* Customer */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Customer
                  </p>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-emerald-600 text-white text-xs">
                        {selectedOrder.customer?.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{selectedOrder.customer?.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedOrder.customer?.phone}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Status
                  </p>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(v) => updateStatus(selectedOrder.id, v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Delivery */}
                {selectedOrder.address && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                      Delivery Address
                    </p>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <p>{selectedOrder.address}</p>
                    </div>
                  </div>
                )}

                {selectedOrder.notes && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                      Notes
                    </p>
                    <p className="text-sm p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}

                {/* Items */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Items ({selectedOrder.items.length})
                  </p>
                  <div className="space-y-1.5">
                    {selectedOrder.items.map((it: any) => (
                      <div
                        key={it.id}
                        className="flex items-center justify-between p-2 rounded-md bg-muted/30"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs bg-emerald-100 text-emerald-700 rounded px-1.5 py-0.5 font-semibold">
                            {it.quantity}×
                          </span>
                          <span className="text-sm truncate">{it.name}</span>
                        </div>
                        <span className="text-sm font-semibold">{formatINR(it.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t pt-3 space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatINR(selectedOrder.total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="text-emerald-600">Free</span>
                  </div>
                  <div className="flex items-center justify-between text-base font-bold pt-1 border-t">
                    <span>Total</span>
                    <span>{formatINR(selectedOrder.total)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                    <>
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                        onClick={() => {
                          const idx = STATUS_FLOW.indexOf(selectedOrder.status)
                          if (idx >= 0 && idx < STATUS_FLOW.length - 1) {
                            updateStatus(selectedOrder.id, STATUS_FLOW[idx + 1])
                          }
                        }}
                      >
                        {nextStatusLabel(selectedOrder.status)}
                      </Button>
                      <Button
                        variant="outline"
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        onClick={() => updateStatus(selectedOrder.id, 'cancelled')}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  {(selectedOrder.status === 'delivered' || selectedOrder.status === 'cancelled') && (
                    <Button
                      variant="outline"
                      className="w-full gap-1.5"
                      onClick={() => updateStatus(selectedOrder.id, 'pending')}
                    >
                      Reopen Order
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function nextStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Confirm Order'
    case 'confirmed':
      return 'Mark Preparing'
    case 'preparing':
      return 'Mark Ready'
    case 'ready':
      return 'Mark Delivered'
    default:
      return 'Update'
  }
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
        active
          ? 'bg-emerald-600 text-white border-emerald-600'
          : 'bg-background hover:bg-muted/70 border-border'
      )}
    >
      {label}
      <span
        className={cn(
          'text-[10px] px-1.5 py-0 rounded-full',
          active ? 'bg-white/20' : 'bg-muted'
        )}
      >
        {count}
      </span>
    </button>
  )
}

function OrderCard({
  order,
  onClick,
  onAdvance,
}: {
  order: any
  onClick: () => void
  onAdvance: () => void
}) {
  const meta = getStatusMeta(order.status)
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-emerald-600 text-white text-xs">
                {order.customer?.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{order.customer?.name}</p>
              <p className="text-[10px] text-muted-foreground">
                #{order.id.slice(-6).toUpperCase()} · {formatDate(order.createdAt)}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={cn('text-xs shrink-0', meta.color)}>
            {meta.label}
          </Badge>
        </div>

        <div className="text-xs text-muted-foreground">
          {order.items.length} item{order.items.length !== 1 ? 's' : ''} ·{' '}
          {order.items.reduce((s: number, i: any) => s + i.quantity, 0)} units
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-base font-bold">{formatINR(order.total)}</span>
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
              onClick={(e) => {
                e.stopPropagation()
                onAdvance()
              }}
            >
              {nextStatusLabel(order.status)}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
