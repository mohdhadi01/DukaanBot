import { Shop } from '../models'
import { sendWhatsappMessage } from '../services/whatsapp-gateway'

export function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `91${digits}`
  return digits
}

export async function sendWhatsAppText(shopId: string, toPhone: string, text: string) {
  const shop = await Shop.findById(shopId)
  if (!shop?.whatsappConnected) {
    return { ok: false, error: 'WhatsApp not connected' }
  }
  try {
    await sendWhatsappMessage(shopId, toPhone, text)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Send failed' }
  }
}

export async function sendWhatsAppMessages(shopId: string, toPhone: string, texts: string[]) {
  const results: Awaited<ReturnType<typeof sendWhatsAppText>>[] = []
  for (const text of texts) {
    results.push(await sendWhatsAppText(shopId, toPhone, text))
  }
  return results
}
