import { defaults } from '../lib/env'
import {
  connectInProcessWhatsapp,
  disconnectInProcessWhatsapp,
  getInProcessWhatsappStatus,
  sendInProcessWhatsappMessage,
} from './whatsapp-inprocess'

const baseUrl = () => defaults.whatsappWorkerUrl
const inProcessMode = () => process.env.WHATSAPP_MODE === 'inprocess'

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
  if (inProcessMode()) return connectInProcessWhatsapp(shopId)
  return workerFetch(`/sessions/${shopId}/connect`, { method: 'POST' })
}

export async function getWhatsappStatus(shopId: string) {
  if (inProcessMode()) return getInProcessWhatsappStatus(shopId)
  return workerFetch(`/sessions/${shopId}/status`)
}

export async function disconnectWhatsapp(shopId: string) {
  if (inProcessMode()) return disconnectInProcessWhatsapp(shopId)
  return workerFetch(`/sessions/${shopId}/disconnect`, { method: 'POST' })
}

export async function sendWhatsappMessage(shopId: string, toPhone: string, text: string) {
  if (inProcessMode()) return sendInProcessWhatsappMessage(shopId, toPhone, text)
  return workerFetch(`/sessions/${shopId}/send`, {
    method: 'POST',
    body: JSON.stringify({ toPhone, text }),
  })
}
