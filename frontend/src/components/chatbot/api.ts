'use client'

import { API_BASE } from '@/components/providers/AuthProvider'
import { handleDemoApi } from '@/lib/demo-store'

let demoMode = false

export function setDemoMode(enabled: boolean) {
  demoMode = enabled
}

export function isDemoMode() {
  return demoMode
}

export const API = {
  shop: '/api/shops',
  products: '/api/products',
  categories: '/api/categories',
  flow: '/api/flow',
  flowEdges: '/api/flow/edges',
  conversations: '/api/conversations',
  messages: '/api/messages',
  orders: '/api/orders',
  customers: '/api/customers',
  analytics: '/api/analytics',
  seed: '/api/seed',
  whatsappStatus: '/api/whatsapp/status',
  whatsappConnect: '/api/whatsapp/connect',
  whatsappDisconnect: '/api/whatsapp/disconnect',
}

export async function api<T = any>(url: string, options?: RequestInit): Promise<T> {
  if (demoMode) {
    try {
      return (await handleDemoApi(url, options)) as T
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : 'Demo API error')
    }
  }

  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`
  const res = await fetch(fullUrl, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `API error: ${res.status}`)
  }
  return res.json()
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const day = 24 * 60 * 60 * 1000
  if (diff < 60 * 1000) return 'just now'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`
  if (diff < day) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export const SHOP_TYPES = [
  { value: 'kirana', label: 'Kirana / Grocery', emoji: '🛒' },
  { value: 'salon', label: 'Salon / Beauty', emoji: '💇' },
  { value: 'tailor', label: 'Tailor / Boutique', emoji: '👔' },
  { value: 'restaurant', label: 'Restaurant / Cafe', emoji: '🍽️' },
  { value: 'pharmacy', label: 'Pharmacy', emoji: '💊' },
  { value: 'electronics', label: 'Electronics', emoji: '📱' },
  { value: 'other', label: 'Other', emoji: '🏪' },
]

export const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-800' },
  { value: 'preparing', label: 'Preparing', color: 'bg-blue-100 text-blue-800' },
  { value: 'ready', label: 'Ready', color: 'bg-purple-100 text-purple-800' },
  { value: 'delivered', label: 'Delivered', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
]

export function getStatusMeta(status: string) {
  return ORDER_STATUSES.find((s) => s.value === status) || {
    value: status,
    label: status,
    color: 'bg-slate-100 text-slate-800',
  }
}
