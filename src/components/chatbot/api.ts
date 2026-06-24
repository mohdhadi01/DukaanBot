'use client'

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
}

export async function api<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...options,
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

export const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'preparing', label: 'Preparing', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'ready', label: 'Ready', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { value: 'delivered', label: 'Delivered', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-rose-100 text-rose-700 border-rose-200' },
]

export function getStatusMeta(value: string) {
  return ORDER_STATUSES.find((s) => s.value === value) || ORDER_STATUSES[0]
}

export const SHOP_TYPES = [
  { value: 'kirana', label: 'Kirana / Grocery', emoji: '🛒' },
  { value: 'restaurant', label: 'Restaurant', emoji: '🍽️' },
  { value: 'bakery', label: 'Bakery', emoji: '🥐' },
  { value: 'tailor', label: 'Tailor / Boutique', emoji: '🧵' },
  { value: 'tutor', label: 'Tutor / Coaching', emoji: '📚' },
  { value: 'salon', label: 'Salon / Spa', emoji: '💇' },
  { value: 'pharmacy', label: 'Pharmacy', emoji: '💊' },
  { value: 'flower', label: 'Florist', emoji: '💐' },
  { value: 'other', label: 'Other', emoji: '🏪' },
]
