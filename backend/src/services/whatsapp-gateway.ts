import { defaults } from '../lib/env'

const baseUrl = () => defaults.whatsappWorkerUrl

async function workerFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `Worker error: ${res.status}`)
  }
  return data
}

export async function connectWhatsapp(shopId: string) {
  return workerFetch(`/sessions/${shopId}/connect`, { method: 'POST' })
}

export async function getWhatsappStatus(shopId: string) {
  return workerFetch(`/sessions/${shopId}/status`)
}

export async function disconnectWhatsapp(shopId: string) {
  return workerFetch(`/sessions/${shopId}/disconnect`, { method: 'POST' })
}

export async function sendWhatsappMessage(shopId: string, toPhone: string, text: string) {
  return workerFetch(`/sessions/${shopId}/send`, {
    method: 'POST',
    body: JSON.stringify({ toPhone, text }),
  })
}
