import { z } from 'zod'

const envSchema = z.object({
  MONGODB_URI: z.string().min(1).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(16).optional(),
  JWT_SECRET: z.string().min(16).optional(),
  FRONTEND_URL: z.string().url().optional(),
  BACKEND_PORT: z.string().optional(),
  INTERNAL_API_SECRET: z.string().min(16).optional(),
  SESSION_ENCRYPTION_KEY: z.string().min(32).optional(),
  WHATSAPP_WORKER_URL: z.string().url().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_STARTER_PRICE_ID: z.string().optional(),
  STRIPE_PRO_PRICE_ID: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
})

export type Env = z.infer<typeof envSchema>

let cached: Env | null = null

export function getEnv(): Env {
  if (cached) return cached
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors)
    throw new Error('Invalid environment configuration')
  }
  cached = parsed.data
  return cached
}

export function requireEnv<K extends keyof Env>(key: K): NonNullable<Env[K]> {
  const val = getEnv()[key]
  if (val === undefined || val === '') {
    throw new Error(`Missing required env: ${key}`)
  }
  return val as NonNullable<Env[K]>
}

export const defaults = {
  whatsappWorkerUrl: process.env.WHATSAPP_WORKER_URL || 'http://localhost:3001',
  internalApiSecret: process.env.INTERNAL_API_SECRET || 'dev-internal-secret-change-me',
}
