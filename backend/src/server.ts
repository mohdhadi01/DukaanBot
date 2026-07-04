import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { connectDb } from './lib/db'
import authRoutes from './routes/auth'
import apiRoutes from './routes/api'
import stripeRoutes, { createStripeWebhookRouter } from './routes/stripe'
import internalRoutes from './routes/internal'

const PORT = parseInt(process.env.BACKEND_PORT || '4000', 10)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'
const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  FRONTEND_URL,
])

const app = express()

app.use(
  cors({
    origin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true)
        return
      }
      callback(new Error(`CORS blocked origin: ${origin}`))
    },
    credentials: true,
  })
)

app.use('/api/stripe', express.raw({ type: 'application/json' }), createStripeWebhookRouter())

app.use(express.json({ limit: '2mb' }))
app.use(cookieParser())

app.get('/api', (_req, res) => {
  res.json({ message: 'DukaanBot API', status: 'ok' })
})

app.get('/health', (_req, res) => {
  res.json({ ok: true, db: 'mongodb', api: 'express' })
})

app.use('/api/auth', authRoutes)
app.use('/api', apiRoutes)
app.use('/api/stripe', stripeRoutes)
app.use('/api/internal', internalRoutes)

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`DukaanBot API running on http://localhost:${PORT}`)
    })
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err)
    process.exit(1)
  })

export default app
