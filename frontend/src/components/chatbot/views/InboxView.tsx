'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { api, API, formatDate } from '../api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  MessageSquare,
  Send,
  Plus,
  Phone,
  CheckCheck,
  Bot,
  User,
  Store,
  Search,
  Sparkles,
  RotateCcw,
  ShoppingBag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWhatsappStatus } from '@/components/whatsapp/ConnectWhatsApp'
import Link from 'next/link'

function sortMessages<T extends { id: string; createdAt: string }>(msgs: T[]): T[] {
  return [...msgs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

function mergeMessages<T extends { id: string; createdAt: string }>(existing: T[], incoming: T[]): T[] {
  const byId = new Map<string, T>()
  for (const msg of existing) byId.set(msg.id, msg)
  for (const msg of incoming) byId.set(msg.id, msg)
  return sortMessages(Array.from(byId.values()))
}

function messagesEqual(a: { id: string; text?: string }[], b: { id: string; text?: string }[]) {
  return a.length === b.length && a.every((m, i) => m.id === b[i]?.id && m.text === b[i]?.text)
}

export function InboxView() {
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [newChatOpen, setNewChatOpen] = useState(false)
  const { selectedConversationId, setSelectedConversationId, refreshKey } = useApp()
  const { toast } = useToast()
  const waStatus = useWhatsappStatus()

  const load = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const { conversations } = await api(API.conversations)
      setConversations(conversations)
      if (!selectedConversationId && conversations.length > 0) {
        setSelectedConversationId(conversations[0].id)
      }
    } catch {
      // ignore
    } finally {
      if (!silent) setLoading(false)
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

  // Poll conversation list quietly (no loading flash)
  useEffect(() => {
    const id = setInterval(() => load(true), 8000)
    return () => clearInterval(id)
  }, [])

  const filtered = conversations.filter(
    (c) =>
      !search ||
      c.customer?.name.toLowerCase().includes(search.toLowerCase()) ||
      c.customer?.phone.includes(search)
  )

  const handleNewChat = async (data: { name: string; phone: string }) => {
    try {
      const { conversation } = await api(API.conversations, {
        method: 'POST',
        body: JSON.stringify(data),
      })
      setSelectedConversationId(conversation.id)
      setNewChatOpen(false)
      toast({ title: 'New chat started', description: 'Say hi to start the bot flow' })
      load()
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' })
    }
  }

  const selected = conversations.find((c) => c.id === selectedConversationId)

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {waStatus.status !== 'connected' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-900 flex flex-wrap items-center justify-between gap-2">
          <span>
            <strong>Simulator mode</strong> — real customers can&apos;t reach you yet.
          </span>
          <Link href="#" onClick={(e) => { e.preventDefault(); useApp.getState().setView('settings') }} className="font-medium text-emerald-700 hover:underline">
            Connect WhatsApp in Settings →
          </Link>
        </div>
      )}
    <div className="flex flex-1 min-h-0">
      {/* Conversation list */}
      <aside
        className={cn(
          'w-full md:w-80 lg:w-96 shrink-0 border-r bg-background flex flex-col',
          selectedConversationId && 'hidden md:flex'
        )}
      >
        <div className="p-3 border-b space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-emerald-600" />
              Conversations
            </h2>
            <Button
              size="sm"
              className="h-7 gap-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setNewChatOpen(true)}
            >
              <Plus className="h-3 w-3" /> New
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No conversations yet.
              <div className="mt-3">
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                  onClick={() => setNewChatOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" /> Start Test Chat
                </Button>
              </div>
            </div>
          ) : (
            filtered.map((c) => (
              <ConversationListItem
                key={c.id}
                conversation={c}
                active={c.id === selectedConversationId}
                onClick={() => setSelectedConversationId(c.id)}
              />
            ))
          )}
        </div>
      </aside>

      {/* Chat panel */}
      <div className={cn('flex-1 min-w-0', !selectedConversationId && 'hidden md:block')}>
        {selected ? (
          <ChatPanel conversationId={selected.id} customer={selected.customer} onBack={() => setSelectedConversationId(null)} onConversationChanged={load} />
        ) : (
          <div className="h-full flex items-center justify-center bg-muted/20">
            <div className="text-center text-muted-foreground p-6">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">Select a conversation</p>
              <p className="text-xs mt-1">Or start a new one to test your bot flow</p>
              <Button
                className="mt-4 bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                onClick={() => setNewChatOpen(true)}
              >
                <Plus className="h-4 w-4" /> Start New Chat
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New chat dialog */}
      <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
        <NewChatDialog onCreate={handleNewChat} />
      </Dialog>
    </div>
    </div>
  )
}

function ConversationListItem({
  conversation,
  active,
  onClick,
}: {
  conversation: any
  active: boolean
  onClick: () => void
}) {
  const lastMsg = conversation.messages?.[0]
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-3 flex gap-3 text-left border-b hover:bg-muted/50 transition-colors',
        active && 'bg-emerald-50 hover:bg-emerald-50'
      )}
    >
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarFallback className={cn('text-xs', active ? 'bg-emerald-600 text-white' : 'bg-muted')}>
          {conversation.customer?.name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold truncate">{conversation.customer?.name}</p>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {formatDate(conversation.updatedAt)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {lastMsg?.text || 'No messages yet'}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <Badge
            variant="outline"
            className={cn(
              'text-[9px] py-0 px-1.5 h-4',
              conversation.status === 'active'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : conversation.status === 'resolved'
                  ? 'bg-slate-100 text-slate-600 border-slate-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
            )}
          >
            {conversation.status}
          </Badge>
          {conversation._count?.messages > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {conversation._count.messages} msgs
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

function ChatPanel({
  conversationId,
  customer,
  onBack,
  onConversationChanged,
}: {
  conversationId: string
  customer: any
  onBack: () => void
  onConversationChanged: () => void
}) {
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [ended, setEnded] = useState(false)
  const [shop, setShop] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const prevMessageCountRef = useRef(0)
  const sendingRef = useRef(false)
  const { toast } = useToast()

  const loadMessages = useCallback(async () => {
    if (sendingRef.current) return
    try {
      const [{ messages: next }, { shop: shopData }, convRes] = await Promise.all([
        api(`${API.messages}?conversationId=${conversationId}`),
        api(API.shop),
        api(`${API.conversations}?conversationId=${conversationId}`),
      ])
      setShop(shopData)
      const sorted = sortMessages(next.filter((m: any) => m.text?.trim()))
      setMessages((prev) => (messagesEqual(prev, sorted) ? prev : sorted))
      setEnded(convRes.conversation?.status === 'resolved')
    } catch {
      // ignore poll errors
    }
  }, [conversationId])

  useEffect(() => {
    void loadMessages()
  }, [loadMessages])

  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevMessageCountRef.current = messages.length
  }, [messages])

  // Poll for new messages without re-render flicker
  useEffect(() => {
    const id = setInterval(loadMessages, 6000)
    return () => clearInterval(id)
  }, [loadMessages])

  const send = async (text?: string) => {
    const message = (text ?? input).trim()
    if (!message || sending) return
    setInput('')
    setSending(true)
    sendingRef.current = true

    const tempId = `temp-${Date.now()}`
    setMessages((m) => [
      ...m,
      { id: tempId, sender: 'customer', text: message, createdAt: new Date().toISOString() },
    ])

    try {
      const res = await api(`${API.messages}`, {
        method: 'POST',
        body: JSON.stringify({ conversationId, text: message }),
      })

      const customerMsg = res.messages?.find((m: any) => m.sender === 'customer') || res.messages?.[0]
      setMessages((prev) =>
        mergeMessages(
          prev.filter((x) => x.id !== tempId),
          customerMsg ? [customerMsg] : []
        )
      )

      const botReplies: any[] = res.botReplies || []
      for (const reply of botReplies) {
        const wait = reply.delayMs ?? 700
        await new Promise((r) => setTimeout(r, wait))
        setMessages((prev) => mergeMessages(prev, [reply]))
      }

      if (res.ended) setEnded(true)
      onConversationChanged()
    } catch (e: any) {
      toast({ title: 'Failed to send', description: e.message, variant: 'destructive' })
      setMessages((m) => m.filter((x) => x.id !== tempId))
    } finally {
      setSending(false)
      sendingRef.current = false
    }
  }

  const resetConversation = async () => {
    if (!confirm('Reset this conversation? This clears the bot context so you can start over.')) return
    // Simulate reset by creating a new conversation with same customer
    try {
      const { conversation } = await api(API.conversations, {
        method: 'POST',
        body: JSON.stringify({ name: customer.name, phone: customer.phone }),
      })
      useApp.getState().setSelectedConversationId(conversation.id)
      onConversationChanged()
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#e5ddd5]/30">
      {/* Header */}
      <div className="bg-emerald-700 text-white px-3 sm:px-4 py-2.5 flex items-center gap-3 shadow-sm">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-emerald-600 md:hidden" onClick={onBack}>
          ←
        </Button>
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-emerald-800 text-white text-xs">
            {customer.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{customer.name}</p>
          <p className="text-[10px] text-emerald-100 truncate flex items-center gap-1">
            <Phone className="h-2.5 w-2.5" />
            {customer.phone} · {ended ? 'Conversation ended' : 'online'}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-emerald-600 gap-1 h-8"
          onClick={resetConversation}
          title="Start a fresh chat with this customer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </Button>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-2"
        style={{
          backgroundColor: '#e5ddd5',
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cpath fill='%23d4cdc4' fill-opacity='0.4' d='M40 40c0-8 6-14 14-14s14 6 14 14-6 14-14 14-14-6-14-14zm-28 0c0-8 6-14 14-14s14 6 14 14-6 14-14 14-14-6-14-14z'/%3E%3C/svg%3E\")",
        }}
      >
        <div className="text-center mb-3">
          <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full shadow-sm">
            🔒 WhatsApp-style simulator · Messages are processed by your bot flow
          </span>
        </div>
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} shopName={shop?.name} />
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-white rounded-lg px-3 py-2 shadow-sm flex items-center gap-1.5">
              <span className="text-xs text-slate-500">Bot is typing</span>
              <div className="flex gap-0.5">
                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick replies */}
      {messages.length <= 6 && !ended && (
        <div className="px-3 sm:px-6 py-2 bg-[#e5ddd5] flex flex-wrap gap-2 border-t border-slate-300/40">
          {['Hi', '1', '2,3,5', '0', 'confirm'].map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={sending}
              className="text-xs bg-white text-slate-700 px-3 py-1.5 rounded-full border hover:bg-emerald-50 hover:border-emerald-300 transition-colors disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="bg-[#f0f0f0] p-3 flex items-end gap-2 border-t border-slate-300/40">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          placeholder={ended ? 'Conversation ended. Click Reset to start over.' : 'Type a message...'}
          disabled={sending || ended}
          rows={1}
          className="flex-1 resize-none bg-white rounded-lg px-3 py-2 text-sm border-0 focus:ring-2 focus:ring-emerald-500 outline-none max-h-24 disabled:bg-slate-100 disabled:text-slate-400"
        />
        <Button
          onClick={() => send()}
          disabled={sending || !input.trim() || ended}
          className="bg-emerald-600 hover:bg-emerald-700 h-10 w-10 p-0 rounded-full"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function MessageBubble({ message, shopName }: { message: any; shopName?: string }) {
  const isCustomer = message.sender === 'customer'
  const isBot = message.sender === 'bot'
  const isShop = message.sender === 'shop'

  if (isCustomer) {
    return (
      <div className="flex justify-end">
        <div className="bg-[#dcf8c6] rounded-lg px-3 py-2 shadow-sm max-w-[80%] sm:max-w-md">
          <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
          <p className="text-[9px] text-slate-500 text-right mt-0.5 flex items-center justify-end gap-0.5">
            {new Date(message.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            <CheckCheck className="h-3 w-3 text-sky-500" />
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="bg-white rounded-lg px-3 py-2 shadow-sm max-w-[80%] sm:max-w-md">
        <div className="flex items-center gap-1 mb-0.5">
          {isBot ? (
            <Bot className="h-3 w-3 text-emerald-600" />
          ) : isShop ? (
            <Store className="h-3 w-3 text-blue-600" />
          ) : (
            <User className="h-3 w-3 text-slate-500" />
          )}
          <span className="text-[10px] font-semibold text-slate-500">
            {isBot ? 'DukaanBot' : shopName || 'Shop'}
          </span>
        </div>
        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
        <p className="text-[9px] text-slate-400 text-right mt-0.5">
          {new Date(message.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

function NewChatDialog({ onCreate }: { onCreate: (d: { name: string; phone: string }) => void }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const presets = [
    { name: 'Priya Sharma', phone: '+91 98765 12345' },
    { name: 'Rahul Verma', phone: '+91 98765 67890' },
    { name: 'Anjali Gupta', phone: '+91 98765 11111' },
  ]

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-600" />
          Start Test Chat
        </DialogTitle>
        <DialogDescription>
          Simulate a customer messaging your shop on WhatsApp. The bot will respond based on your flow.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3 py-2">
        <div className="space-y-1.5">
          <Label>Customer Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Sharma" />
        </div>
        <div className="space-y-1.5">
          <Label>WhatsApp Number</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Quick presets</Label>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.phone}
                onClick={() => {
                  setName(p.name)
                  setPhone(p.phone)
                }}
                className="text-xs bg-muted hover:bg-emerald-50 hover:text-emerald-700 px-2.5 py-1.5 rounded-full border"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button
          onClick={() => onCreate({ name: name || 'Test Customer', phone: phone || '+91 90000 00000' })}
          className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
        >
          <MessageSquare className="h-4 w-4" /> Start Chat
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
