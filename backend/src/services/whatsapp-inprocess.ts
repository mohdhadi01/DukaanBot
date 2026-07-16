import type { WASocket, AuthenticationState, SignalDataSet, SignalDataTypeMap } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import QRCode from 'qrcode'
import pino from 'pino'
import { Shop, WhatsappSession } from '../models'
import { handleIncomingWhatsAppMessage } from './bot.service'
import { upsertWhatsappSession } from './shop.service'

if (false) {
  require('@whiskeysockets/baileys')
  require('@whiskeysockets/baileys/WAProto')
  require('@whiskeysockets/baileys/lib/Utils/auth-utils')
  require('@whiskeysockets/baileys/lib/Utils/generics')
}

type StoredAuth = {
  creds: AuthenticationState['creds']
  keys: Record<string, unknown>
}

const logger = pino({ level: 'silent' })
const sessions = new Map<string, WASocket>()

let baileysModule: any = null

async function loadBaileys() {
  if (baileysModule) return baileysModule
  const baileys = await eval('import("@whiskeysockets/baileys")')
  const { proto } = await eval('import("@whiskeysockets/baileys/WAProto")')
  const { initAuthCreds } = await eval('import("@whiskeysockets/baileys/lib/Utils/auth-utils")')
  const { BufferJSON } = await eval('import("@whiskeysockets/baileys/lib/Utils/generics")')
  baileysModule = {
    makeWASocket: baileys.default || baileys.makeWASocket,
    DisconnectReason: baileys.DisconnectReason,
    fetchLatestBaileysVersion: baileys.fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore: baileys.makeCacheableSignalKeyStore,
    proto,
    initAuthCreds,
    BufferJSON,
  }
  return baileysModule
}

function keyName(type: keyof SignalDataTypeMap, id: string) {
  return `${type}-${id}`
}

function phoneFromJid(jid: string) {
  const userPart = jid.split('@')[0].split(':')[0]
  return userPart.replace(/\D/g, '')
}

async function loadStoredAuth(shopId: string): Promise<StoredAuth> {
  const session = await WhatsappSession.findOne({ shopId }).lean() as any
  const { BufferJSON, initAuthCreds } = await loadBaileys()
  if (session?.sessionBlob) {
    try {
      return JSON.parse(session.sessionBlob, BufferJSON.reviver) as StoredAuth
    } catch {
      // Corrupt demo auth should not block a new QR session.
    }
  }
  return { creds: initAuthCreds(), keys: {} }
}

async function saveStoredAuth(shopId: string, stored: StoredAuth) {
  const { BufferJSON } = await loadBaileys()
  await WhatsappSession.findOneAndUpdate(
    { shopId },
    { sessionBlob: JSON.stringify(stored, BufferJSON.replacer) },
    { upsert: true, new: true }
  )
}

async function useMongoAuthState(shopId: string): Promise<{
  state: AuthenticationState
  saveCreds: () => Promise<void>
}> {
  const stored = await loadStoredAuth(shopId)

  const state: AuthenticationState = {
    creds: stored.creds,
    keys: {
      get: async <T extends keyof SignalDataTypeMap>(type: T, ids: string[]) => {
        const data: { [id: string]: SignalDataTypeMap[T] } = {}
        const { proto } = await loadBaileys()
        for (const id of ids) {
          let value = stored.keys[keyName(type, id)] as SignalDataTypeMap[T] | undefined
          if (type === 'app-state-sync-key' && value) {
            value = proto.Message.AppStateSyncKeyData.fromObject(value as any) as unknown as SignalDataTypeMap[T]
          }
          if (value) data[id] = value
        }
        return data
      },
      set: async (data: SignalDataSet) => {
        for (const category in data) {
          const entries = data[category as keyof SignalDataSet]
          if (!entries) continue
          for (const id in entries) {
            const value = entries[id]
            const key = keyName(category as keyof SignalDataTypeMap, id)
            if (value) {
              stored.keys[key] = value
            } else {
              delete stored.keys[key]
            }
          }
        }
        await saveStoredAuth(shopId, stored)
      },
      clear: async () => {
        stored.keys = {}
        await saveStoredAuth(shopId, stored)
      },
    },
  }

  return {
    state,
    saveCreds: async () => {
      stored.creds = state.creds
      await saveStoredAuth(shopId, stored)
    },
  }
}

async function patchSession(shopId: string, data: {
  status?: string
  linkedPhone?: string | null
  qrDataUrl?: string | null
  sessionBlob?: string | null
  errorMessage?: string | null
}) {
  await upsertWhatsappSession(shopId, data)
}

export async function connectInProcessWhatsapp(shopId: string) {
  if (sessions.has(shopId)) {
    const existing = sessions.get(shopId)!
    if (existing.user) {
      const phone = existing.user.id.split(':')[0]
      return { status: 'connected', linkedPhone: phone ? `+${phone.replace(/\D/g, '')}` : null, qrDataUrl: null }
    }
  }

  await patchSession(shopId, { status: 'qr_pending', qrDataUrl: null, errorMessage: null })

  const { state, saveCreds } = await useMongoAuthState(shopId)
  const { fetchLatestBaileysVersion, makeWASocket, makeCacheableSignalKeyStore } = await loadBaileys()
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    printQRInTerminal: false,
    browser: ['DukaanBot', 'Chrome', '1.0.0'],
  })

  sessions.set(shopId, sock)
  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      const qrDataUrl = await QRCode.toDataURL(qr)
      await patchSession(shopId, { status: 'qr_pending', qrDataUrl, errorMessage: null })
    }

    if (connection === 'open') {
      const phone = sock.user?.id?.split(':')[0] || sock.user?.id || ''
      await patchSession(shopId, {
        status: 'connected',
        linkedPhone: phone ? `+${phone.replace(/\D/g, '')}` : null,
        qrDataUrl: null,
        errorMessage: null,
      })
      await Shop.findByIdAndUpdate(shopId, { whatsappConnected: true })
    }

    if (connection === 'close') {
      const { DisconnectReason } = await loadBaileys()
      const code = (lastDisconnect?.error as Boom)?.output?.statusCode
      const shouldReconnect = code !== DisconnectReason.loggedOut
      sessions.delete(shopId)

      if (shouldReconnect) {
        await patchSession(shopId, {
          status: 'qr_pending',
          errorMessage: 'Disconnected. Reconnect from the dashboard before demoing.',
        })
      } else {
        await patchSession(shopId, {
          status: 'disconnected',
          linkedPhone: null,
          qrDataUrl: null,
          sessionBlob: null,
          errorMessage: null,
        })
        await Shop.findByIdAndUpdate(shopId, { whatsappConnected: false })
      }
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    for (const msg of messages) {
      if (msg.key.fromMe) continue
      const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
      if (!text.trim()) continue
      const jid = msg.key.remoteJid
      if (!jid || jid.endsWith('@g.us')) continue

      try {
        const result = await handleIncomingWhatsAppMessage(shopId, phoneFromJid(jid), text.trim(), msg.pushName || undefined)
        for (const reply of result.messages.map((m) => m.text)) {
          await sock.sendMessage(jid, { text: reply })
        }
        await patchSession(shopId, { status: 'connected', errorMessage: null })
      } catch (e) {
        console.error(`In-process bot error for shop ${shopId}:`, e)
      }
    }
  })

  return { status: 'qr_pending' }
}

export async function getInProcessWhatsappStatus(shopId: string) {
  const session = await WhatsappSession.findOne({ shopId }).lean() as any
  const sock = sessions.get(shopId)
  if (sock?.user) {
    const phone = sock.user.id.split(':')[0]
    return {
      status: 'connected',
      linkedPhone: session?.linkedPhone || (phone ? `+${phone.replace(/\D/g, '')}` : null),
      qrDataUrl: null,
      errorMessage: session?.errorMessage,
    }
  }
  return {
    status: session?.status || 'disconnected',
    linkedPhone: session?.linkedPhone,
    qrDataUrl: session?.qrDataUrl,
    errorMessage: session?.errorMessage,
  }
}

export async function disconnectInProcessWhatsapp(shopId: string) {
  const sock = sessions.get(shopId)
  if (sock) {
    await sock.logout().catch(() => {})
    sessions.delete(shopId)
  }
  await patchSession(shopId, {
    status: 'disconnected',
    linkedPhone: null,
    qrDataUrl: null,
    sessionBlob: null,
    errorMessage: null,
  })
  await Shop.findByIdAndUpdate(shopId, { whatsappConnected: false })
  return { ok: true }
}

export async function sendInProcessWhatsappMessage(shopId: string, toPhone: string, text: string) {
  const sock = sessions.get(shopId)
  if (!sock?.user) throw new Error('WhatsApp not connected in this Vercel function instance')
  const digits = toPhone.replace(/\D/g, '')
  await sock.sendMessage(`${digits}@s.whatsapp.net`, { text })
  return { ok: true }
}
