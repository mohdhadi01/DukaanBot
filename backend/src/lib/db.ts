import mongoose from 'mongoose'
import dns from 'node:dns/promises'
import { setServers } from 'node:dns'

let connected = false

/** Bun on Windows often fails mongodb+srv SRV lookups; resolve via Node DNS instead. */
async function normalizeMongoUri(uri: string): Promise<string> {
  if (!uri.startsWith('mongodb+srv://')) {
    return uri.includes('/') && !uri.endsWith('/') ? uri : `${uri.replace(/\/$/, '')}/dukaanbot`
  }

  // ISP DNS may refuse SRV queries; public resolvers work reliably with Atlas.
  setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4'])

  const withoutScheme = uri.slice('mongodb+srv://'.length)
  const at = withoutScheme.indexOf('@')
  const creds = at >= 0 ? withoutScheme.slice(0, at + 1) : ''
  const rest = at >= 0 ? withoutScheme.slice(at + 1) : withoutScheme

  const q = rest.indexOf('?')
  const slash = rest.indexOf('/')
  const hostEnd = slash >= 0 ? slash : q >= 0 ? q : rest.length
  const host = rest.slice(0, hostEnd)
  const path = slash >= 0 ? rest.slice(slash) : '/dukaanbot'
  const dbPath = path === '/' ? '/dukaanbot' : path

  const srvHost = `_mongodb._tcp.${host}`
  const [srvRecords, txtRecords] = await Promise.all([
    dns.resolveSrv(srvHost),
    dns.resolveTxt(srvHost).catch(() => [] as string[][]),
  ])

  const hosts = srvRecords.map((r) => `${r.name}:${r.port}`).join(',')
  const txtParams = txtRecords.flat().join('&')
  const query = dbPath.includes('?')
    ? dbPath.slice(dbPath.indexOf('?') + 1)
    : ''
  const params = new URLSearchParams(query)
  if (txtParams) {
    for (const part of txtParams.split('&')) {
      const [k, v] = part.split('=')
      if (k && v && !params.has(k)) params.set(k, v)
    }
  }
  if (!params.has('ssl')) params.set('ssl', 'true')
  if (!params.has('authSource')) params.set('authSource', 'admin')
  if (!params.has('retryWrites')) params.set('retryWrites', 'true')
  if (!params.has('w')) params.set('w', 'majority')

  const dbOnly = dbPath.includes('?') ? dbPath.slice(0, dbPath.indexOf('?')) : dbPath
  return `mongodb://${creds}${hosts}${dbOnly}?${params.toString()}`
}

export async function connectDb() {
  if (connected) return mongoose.connection
  const raw = process.env.MONGODB_URI
  if (!raw) {
    throw new Error('MONGODB_URI is required. Add your MongoDB Atlas connection string to .env')
  }

  const uri = await normalizeMongoUri(raw)
  await mongoose.connect(uri)
  connected = true
  console.log('Connected to MongoDB')
  return mongoose.connection
}

export { mongoose }
