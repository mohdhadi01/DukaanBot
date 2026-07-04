import { Router } from 'express'
import { z } from 'zod'
import { internalAuth } from '../middleware/internal'
import { handleIncomingWhatsAppMessage } from '../services/bot.service'
import { upsertWhatsappSession } from '../services/shop.service'

const router = Router()

const messageSchema = z.object({
  shopId: z.string(),
  fromPhone: z.string(),
  text: z.string(),
  pushName: z.string().optional(),
})

const sessionSchema = z.object({
  shopId: z.string(),
  status: z.string(),
  linkedPhone: z.string().optional().nullable(),
  qrDataUrl: z.string().optional().nullable(),
  sessionBlob: z.string().optional().nullable(),
  errorMessage: z.string().optional().nullable(),
})

router.post('/whatsapp/message', internalAuth, async (req, res) => {
  try {
    const body = messageSchema.parse(req.body)
    const result = await handleIncomingWhatsAppMessage(
      body.shopId,
      body.fromPhone,
      body.text,
      body.pushName
    )
    return res.json({
      ...result,
      replies: result.messages.map((message) => message.text),
    })
  } catch (e) {
    return res.status(400).json({ error: e instanceof Error ? e.message : 'Invalid request' })
  }
})

router.patch('/whatsapp/session', internalAuth, async (req, res) => {
  try {
    const body = sessionSchema.parse(req.body)
    await upsertWhatsappSession(body.shopId, {
      status: body.status,
      linkedPhone: body.linkedPhone ?? undefined,
      qrDataUrl: body.qrDataUrl ?? undefined,
      sessionBlob: body.sessionBlob ?? undefined,
      errorMessage: body.errorMessage ?? undefined,
      lastSeenAt: body.status === 'connected' ? new Date() : undefined,
    })
    return res.json({ ok: true })
  } catch (e) {
    return res.status(400).json({ error: e instanceof Error ? e.message : 'Invalid request' })
  }
})

export default router
