'use client'

import { useEffect, useState, useMemo } from 'react'
import { api, API, formatINR, formatDate } from '../api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useApp } from '../store'
import {
  Users,
  Search,
  Phone,
  MessageSquare,
  ShoppingBag,
  Pencil,
  Trash2,
  UserPlus,
  IndianRupee,
  Loader2,
} from 'lucide-react'

export function CustomersView() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const { refreshKey } = useApp()
  const { toast } = useToast()

  const load = async () => {
    setLoading(true)
    const { customers } = await api(API.customers)
    setCustomers(customers)
    setLoading(false)
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
    return customers.filter(
      (c) =>
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
    )
  }, [customers, search])

  const handleSave = async (data: any) => {
    try {
      await api(API.customers, {
        method: 'PATCH',
        body: JSON.stringify({ id: editing.id, ...data }),
      })
      toast({ title: 'Customer updated' })
      setEditOpen(false)
      load()
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this customer? Their conversations will remain.')) return
    try {
      await api(`${API.customers}?id=${id}`, { method: 'DELETE' })
      toast({ title: 'Customer deleted' })
      load()
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' })
    }
  }

  const startChat = (c: any) => {
    useApp.getState().setView('inbox')
    setTimeout(async () => {
      try {
        const { conversation } = await api(API.conversations, {
          method: 'POST',
          body: JSON.stringify({ name: c.name, phone: c.phone }),
        })
        useApp.getState().setSelectedConversationId(conversation.id)
        useApp.getState().triggerRefresh()
      } catch (e: any) {
        toast({ title: 'Failed', description: e.message, variant: 'destructive' })
      }
    }, 100)
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Everyone who&apos;s messaged your shop on WhatsApp.
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
          Loading customers...
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium">No customers yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Start a test chat in Inbox to add customers.
            </p>
            <Button
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 gap-1.5"
              onClick={() => useApp.getState().setView('inbox')}
            >
              <MessageSquare className="h-4 w-4" /> Go to Inbox
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((c) => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback className="bg-emerald-600 text-white">
                      {c.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Phone className="h-3 w-3" />
                      {c.phone}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Since {formatDate(c.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
                  <div className="flex items-center gap-1.5">
                    <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-semibold">{c._count?.orders || 0}</p>
                      <p className="text-[10px] text-muted-foreground">orders</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-semibold">{c._count?.conversations || 0}</p>
                      <p className="text-[10px] text-muted-foreground">chats</p>
                    </div>
                  </div>
                </div>

                {c.orders?.[0] && (
                  <div className="mt-2 pt-2 border-t flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Last order</span>
                    <span className="font-semibold">{formatINR(c.orders[0].total)}</span>
                  </div>
                )}

                {c.notes && (
                  <p className="text-xs text-muted-foreground mt-2 italic line-clamp-1">
                    📝 {c.notes}
                  </p>
                )}

                <div className="flex gap-1 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs gap-1"
                    onClick={() => startChat(c)}
                  >
                    <MessageSquare className="h-3 w-3" /> Message
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditing(c)
                      setEditOpen(true)
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 text-rose-600"
                    onClick={() => handleDelete(c.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        {editing && (
          <CustomerDialog customer={editing} onSave={handleSave} />
        )}
      </Dialog>
    </div>
  )
}

function CustomerDialog({
  customer,
  onSave,
}: {
  customer: any
  onSave: (data: any) => void
}) {
  const [name, setName] = useState(customer.name)
  const [notes, setNotes] = useState(customer.notes || '')
  const [tags, setTags] = useState(customer.tags || '')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setSaving(true)
    await onSave({ name, notes, tags })
    setSaving(false)
  }

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Customer</DialogTitle>
        <DialogDescription>Update name, notes, or tags</DialogDescription>
      </DialogHeader>
      <div className="space-y-3 py-2">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input value={customer.phone} disabled className="bg-muted/50" />
          <p className="text-xs text-muted-foreground">Phone numbers cannot be edited.</p>
        </div>
        <div className="space-y-1.5">
          <Label>Tags</Label>
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="vip, regular, wholesale"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Internal notes about this customer..."
          />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={submit} disabled={saving} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
