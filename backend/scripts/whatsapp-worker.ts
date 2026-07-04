/**
 * WhatsApp QR worker — Baileys session manager
 * Run: bun run worker:whatsapp
 */
import { createServer } from 'node:http'
import { connectDb, mongoose } from '../src/lib/db'
import { Shop, WhatsappSession } from '../src/models'
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  type WASocket,
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import QRCode from 'qrcode'
import { mkdirSync, existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { useMultiFileAuthState } from '@whiskeysockets/baileys'
import pino from 'pino'

const logger = pino({ level: 'silent' })
const PORT = parseInt(process.env.WHATSAPP_WORKER_PORT || '3001', 10)
const APP_URL = process.env.APP_URL || 'http://localhost:4000'
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || 'dev-internal-secret-change-me'

const sessions = new Map<string, WASocket>()
const authDirs = join(process.cwd(), '.wa-sessions')

if (!existsSync(authDirs)) mkdirSync(authDirs, { recursive: true })

async function patchSession(shopId: string, data: Record<string, unknown>) {
  await fetch(`${APP_URL}/api/internal/whatsapp/session`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': INTERNAL_SECRET,
    },
    body: JSON.stringify({ shopId, ...data }),
  }).catch((e) => console.error('Session patch failed:', e))
}

async function callBot(shopId: string, fromPhone: string, text: string, pushName?: string) {
  const res = await fetch(`${APP_URL}/api/internal/whatsapp/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': INTERNAL_SECRET,
    },
    body: JSON.stringify({ shopId, fromPhone, text, pushName }),
  })
  if (!res.ok) throw new Error('Bot API failed')
  return res.json() as Promise<{ replies: string[] }>
}

function phoneFromJid(jid: string) {
  const userPart = jid.split('@')[0].split(':')[0]
  return userPart.replace(/\D/g, '')
}

async function startSession(shopId: string) {
  if (sessions.has(shopId)) {
    const existing = sessions.get(shopId)!
    if (existing.user) return { status: 'connected', linkedPhone: existing.user.id.split(':')[0] }
  }

  const shopDir = join(authDirs, shopId)
  if (!existsSync(shopDir)) mkdirSync(shopDir, { recursive: true })

  await patchSession(shopId, { status: 'qr_pending', qrDataUrl: null, errorMessage: null })

  const { state, saveCreds } = await useMultiFileAuthState(shopDir)
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
      await patchSession(shopId, { status: 'qr_pending', qrDataUrl })
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
      const code = (lastDisconnect?.error as Boom)?.output?.statusCode
      const shouldReconnect = code !== DisconnectReason.loggedOut
      sessions.delete(shopId)

      if (shouldReconnect) {
        await patchSession(shopId, { status: 'qr_pending', errorMessage: 'Reconnecting...' })
        setTimeout(() => startSession(shopId).catch(console.error), 3000)
      } else {
        await patchSession(shopId, { status: 'disconnected', qrDataUrl: null, linkedPhone: null })
        await Shop.findByIdAndUpdate(shopId, { whatsappConnected: false })
        if (existsSync(shopDir)) rmSync(shopDir, { recursive: true, force: true })
      }
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    for (const msg of messages) {
      if (msg.key.fromMe) continue
      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        ''
      if (!text.trim()) continue
      const jid = msg.key.remoteJid
      if (!jid || jid.endsWith('@g.us')) continue

      const fromPhone = phoneFromJid(jid)
      const pushName = msg.pushName || undefined

      try {
        const { replies } = await callBot(shopId, fromPhone, text.trim(), pushName)
        for (const reply of replies) {
          await sock.sendMessage(jid, { text: reply })
        }
        await patchSession(shopId, { status: 'connected' })
      } catch (e) {
        console.error(`Bot error shop ${shopId}:`, e)
      }
    }
  })

  return { status: 'qr_pending' }
}

async function getStatus(shopId: string) {
  const session = await WhatsappSession.findOne({ shopId }).lean()
  const sock = sessions.get(shopId)
  if (sock?.user) {
    const phone = sock.user.id.split(':')[0]
    return {
      status: 'connected',
      linkedPhone: session?.linkedPhone || `+${phone}`,
      qrDataUrl: null,
    }
  }
  return {
    status: session?.status || 'disconnected',
    linkedPhone: session?.linkedPhone,
    qrDataUrl: session?.qrDataUrl,
    errorMessage: session?.errorMessage,
  }
}

async function disconnect(shopId: string) {
  const sock = sessions.get(shopId)
  if (sock) {
    await sock.logout().catch(() => {})
    sessions.delete(shopId)
  }
  const shopDir = join(authDirs, shopId)
  if (existsSync(shopDir)) rmSync(shopDir, { recursive: true, force: true })
  await patchSession(shopId, {
    status: 'disconnected',
    linkedPhone: null,
    qrDataUrl: null,
    sessionBlob: null,
  })
  await Shop.findByIdAndUpdate(shopId, { whatsappConnected: false })
  return { ok: true }
}

async function sendMessage(shopId: string, toPhone: string, text: string) {
  const sock = sessions.get(shopId)
  if (!sock?.user) throw new Error('WhatsApp not connected')
  const digits = toPhone.replace(/\D/g, '')
  const jid = `${digits}@s.whatsapp.net`
  await sock.sendMessage(jid, { text })
  return { ok: true }
}

async function loadExistingSessions() {
  const connected = await WhatsappSession.find({ status: 'connected' }).lean()
  for (const s of connected) {
    startSession(String(s.shopId)).catch((e) => console.error(`Restore ${s.shopId}:`, e))
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`)
  const parts = url.pathname.split('/').filter(Boolean)

  const json = (data: unknown, code = 200) => {
    res.writeHead(code, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(data))
  }

  try {
    if (req.method === 'POST' && parts[0] === 'sessions' && parts[2] === 'connect') {
      const shopId = parts[1]
      const result = await startSession(shopId)
      return json(result)
    }

    if (req.method === 'GET' && parts[0] === 'sessions' && parts[2] === 'status') {
      const shopId = parts[1]
      return json(await getStatus(shopId))
    }

    if (req.method === 'POST' && parts[0] === 'sessions' && parts[2] === 'disconnect') {
      const shopId = parts[1]
      return json(await disconnect(shopId))
    }

    if (req.method === 'POST' && parts[0] === 'sessions' && parts[2] === 'send') {
      const shopId = parts[1]
      const body = await readBody(req)
      const { toPhone, text } = JSON.parse(body)
      return json(await sendMessage(shopId, toPhone, text))
    }

    if (parts[0] === 'health') return json({ ok: true })

    json({ error: 'Not found' }, 404)
  } catch (e) {
    json({ error: e instanceof Error ? e.message : 'Error' }, 500)
  }
})

function readBody(req: import('node:http').IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    let data = ''
    req.on('data', (c) => (data += c))
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

server.listen(PORT, async () => {
  await connectDb()
  console.log(`WhatsApp worker listening on :${PORT}`)
  await loadExistingSessions()
})

process.on('SIGINT', async () => {
  await mongoose.disconnect()
  process.exit(0)
})
