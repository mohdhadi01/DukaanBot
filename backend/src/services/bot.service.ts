import { Conversation, Message, Customer, Shop } from '../models'
import { processCustomerMessage, serializeContext, parseContext } from '../lib/bot-engine'
import { sendWhatsAppText } from '../lib/whatsapp'

function normalizeCustomerPhone(phone: string) {
  const digits = phone.split('@')[0].split(':')[0].replace(/\D/g, '')
  if (digits.length === 10) return `+91${digits}`
  return digits ? `+${digits}` : phone
}

export async function handleCustomerMessage(
  shopId: string,
  conversationId: string,
  text: string,
  options?: { channel?: string; relayWhatsApp?: boolean; customerPhone?: string }
) {
  const conversation = await Conversation.findOne({ _id: conversationId, shopId })
    .populate('customerId')
  if (!conversation) throw new Error('Conversation not found')

  const shop = await Shop.findById(shopId)
  const customer = conversation.customerId as any

  await Message.create({ conversationId, sender: 'customer', text, type: 'text' })

  const ctx = parseContext(conversation.context)
  ctx.vars.__customerId = String(customer._id)
  ctx.vars.__conversationId = conversationId
  ctx.vars.shopName = shop?.name || ''
  ctx.vars.name = ctx.vars.name || customer.name

  const result = await processCustomerMessage(shopId, {
    id: conversationId,
    context: serializeContext(ctx),
    currentNodeId: conversation.currentNodeId,
  }, text)

  const createdMessages: Awaited<ReturnType<typeof Message.create>>[] = []
  for (const m of result.botMessages) {
    const msg = await Message.create({
      conversationId,
      sender: 'bot',
      text: m.text,
      type: m.type || 'text',
      metadata: m.metadata ? JSON.stringify(m.metadata) : null,
    })
    createdMessages.push(msg)

    if (options?.relayWhatsApp && conversation.channel === 'whatsapp' && shop?.whatsappConnected) {
      await sendWhatsAppText(shopId, options.customerPhone || customer.phone, m.text)
    }
  }

  const newCtx = result.newContext
  newCtx.vars.__customerId = String(customer._id)
  newCtx.vars.__conversationId = conversationId
  newCtx.vars.shopName = shop?.name || ''
  newCtx.vars.name = newCtx.vars.name || customer.name

  await Conversation.findByIdAndUpdate(conversationId, {
    context: serializeContext(newCtx),
    currentNodeId: newCtx.currentNodeId,
    status: result.ended ? 'resolved' : 'active',
    updatedAt: new Date(),
  })

  return {
    messages: createdMessages.map((m) => m.toJSON()),
    ended: result.ended,
  }
}

export async function handleIncomingWhatsAppMessage(
  shopId: string,
  fromPhone: string,
  text: string,
  customerName?: string
) {
  const phone = normalizeCustomerPhone(fromPhone)
  const normalized = phone.replace(/\D/g, '').slice(-10)
  let customer = await Customer.findOne({ shopId, phone: { $regex: normalized } })
  if (!customer) {
    customer = await Customer.create({
      shopId,
      phone,
      name: customerName || `Customer ${normalized.slice(-4)}`,
    })
  } else if (customer.phone !== phone) {
    customer.phone = phone
    await customer.save()
  }

  let conversation = await Conversation.findOne({
    shopId,
    customerId: customer._id,
    channel: 'whatsapp',
    status: 'active',
  }).sort({ updatedAt: -1 })

  if (!conversation) {
    conversation = await Conversation.create({
      shopId,
      customerId: customer._id,
      channel: 'whatsapp',
      status: 'active',
    })
  }

  const result = await handleCustomerMessage(shopId, String(conversation._id), text, {
    channel: 'whatsapp',
    relayWhatsApp: false,
    customerPhone: customer.phone,
  })

  return {
    conversationId: String(conversation._id),
    ...result,
  }
}
