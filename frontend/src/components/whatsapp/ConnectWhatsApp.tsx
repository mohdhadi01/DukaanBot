'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Loader2, MessageCircle, QrCode, CheckCircle2, Unplug } from 'lucide-react'
import { api, API, isDemoMode } from '@/components/chatbot/api'

type WaStatus = {
  status: string
  linkedPhone?: string | null
  qrDataUrl?: string | null
  errorMessage?: string | null
}

export function ConnectWhatsApp({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<WaStatus>({ status: 'disconnected' })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const demo = isDemoMode()

  const poll = useCallback(async () => {
    try {
      const data = await api<WaStatus>(API.whatsappStatus)
      setStatus(data)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    poll()
  }, [poll])

  useEffect(() => {
    if (!open) return
    const id = setInterval(poll, 2000)
    return () => clearInterval(id)
  }, [open, poll])

  const connect = async () => {
    if (demo) {
      toast({ title: 'Demo mode', description: 'Sign up to connect your real WhatsApp number.', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      await api(API.whatsappConnect, { method: 'POST' })
      setOpen(true)
      await poll()
    } catch (e) {
      toast({
        title: 'Connection failed',
        description: e instanceof Error ? e.message : 'Make sure the WhatsApp worker is running',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const disconnect = async () => {
    setLoading(true)
    try {
      await api(API.whatsappDisconnect, { method: 'POST' })
      setStatus({ status: 'disconnected' })
      toast({ title: 'WhatsApp disconnected' })
    } finally {
      setLoading(false)
    }
  }

  const connected = status.status === 'connected'

  useEffect(() => {
    if (!open || !connected) return
    const timeout = window.setTimeout(() => setOpen(false), 1500)
    return () => window.clearTimeout(timeout)
  }, [open, connected])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className={
            connected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }
        >
          {connected ? (
            <>
              <CheckCircle2 className="mr-1 h-3 w-3" /> Live on WhatsApp
            </>
          ) : (
            <>
              <MessageCircle className="mr-1 h-3 w-3" /> Not connected
            </>
          )}
        </Badge>
        {connected && status.linkedPhone && (
          <span className="text-xs text-muted-foreground">{status.linkedPhone}</span>
        )}
      </div>

      {!connected ? (
        <Button
          onClick={connect}
          disabled={loading || demo}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          size={compact ? 'sm' : 'default'}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
          Connect WhatsApp
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={disconnect} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unplug className="h-4 w-4" />}
          Disconnect
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan QR with WhatsApp</DialogTitle>
            <DialogDescription>
              Open WhatsApp on your shop phone → Linked devices → Link a device → scan this code.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {connected ? (
              <div className="flex h-56 w-56 flex-col items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-center text-emerald-700">
                <CheckCircle2 className="h-12 w-12" />
                <p className="mt-3 text-sm font-medium">Connected successfully!</p>
                {status.linkedPhone && (
                  <p className="mt-1 text-xs text-emerald-700/80">{status.linkedPhone}</p>
                )}
              </div>
            ) : status.qrDataUrl ? (
              <img src={status.qrDataUrl} alt="WhatsApp QR code" className="h-56 w-56 rounded-lg border" />
            ) : (
              <div className="flex h-56 w-56 items-center justify-center rounded-lg border bg-muted">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            {status.errorMessage && (
              <p className="text-sm text-destructive">{status.errorMessage}</p>
            )}
            {!connected && <p className="text-sm text-muted-foreground">Waiting for QR scan confirmation...</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function useWhatsappStatus() {
  const [status, setStatus] = useState<WaStatus>({ status: 'disconnected' })
  useEffect(() => {
    api<WaStatus>(API.whatsappStatus)
      .then(setStatus)
      .catch(() => setStatus({ status: 'disconnected' }))
  }, [])
  return status
}
