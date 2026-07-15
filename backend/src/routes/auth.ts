import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { User, Subscription, Shop } from '../models'
import { registerUser, createPasswordResetToken, resetPassword } from '../services/auth.service'
import { signAuthToken, COOKIE_NAME } from '../lib/jwt'
import { getUserFromRequest } from '../lib/tenant-express'

const router = Router()

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production'
  let crossSite = false
  try {
    const frontend = process.env.FRONTEND_URL
    const api = process.env.APP_URL
    if (frontend && api) {
      crossSite = new URL(frontend).origin !== new URL(api).origin
    }
  } catch {
    /* use defaults */
  }
  return {
    httpOnly: true,
    sameSite: (crossSite && isProduction ? 'none' : 'lax') as 'none' | 'lax',
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  }
}

async function buildTokenForUser(userId: string) {
  const user = await User.findById(userId)
  if (!user) return null
  return signAuthToken({
    id: String(user._id),
    email: user.email,
    name: user.name,
    onboardingDone: user.onboardingDone,
    onboardingStep: user.onboardingStep,
  })
}

function setAuthCookie(res: import('express').Response, token: string) {
  res.cookie(COOKIE_NAME, token, getCookieOptions())
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user?.passwordHash) return res.status(401).json({ error: 'Invalid email or password' })
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' })
    const token = await buildTokenForUser(String(user._id))
    if (!token) return res.status(500).json({ error: 'Failed to create session' })
    setAuthCookie(res, token)
    return res.json({ ok: true })
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Login failed' })
  }
})

router.post('/register', async (req, res) => {
  try {
    const result = await registerUser(req.body)
    const token = await buildTokenForUser(result.userId)
    if (token) setAuthCookie(res, token)
    return res.json({ ok: true, ...result })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Registration failed'
    const status = msg.includes('already exists') ? 409 : msg.includes('Invalid') ? 400 : 500
    return res.status(status).json({ error: msg })
  }
})

router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' })
  return res.json({ ok: true })
})

router.get('/me', async (req, res) => {
  const authUser = await getUserFromRequest(req)
  if (!authUser) return res.status(401).json({ error: 'Unauthorized' })

  const dbUser = await User.findById(authUser.id)
  if (!dbUser) return res.status(404).json({ error: 'User not found' })
  const subscription = await Subscription.findOne({ userId: dbUser._id })
  const shop = await Shop.findOne({ userId: dbUser._id, isDemo: false })

  return res.json({
    user: {
      id: String(dbUser._id),
      name: dbUser.name,
      email: dbUser.email,
      onboardingStep: dbUser.onboardingStep,
      onboardingDone: dbUser.onboardingDone,
      subscriptionStatus: subscription?.status ?? 'none',
      plan: subscription?.plan ?? 'none',
      shopId: shop ? String(shop._id) : undefined,
      subscription: subscription?.toJSON(),
      shop: shop?.toJSON(),
    },
  })
})

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body
  if (email) {
    const result = await createPasswordResetToken(email)
    if (result && process.env.NODE_ENV !== 'production') {
      const base = process.env.FRONTEND_URL || 'http://localhost:3000'
      console.log(`[dev] Password reset link: ${base}/reset-password?token=${result.token}`)
    }
  }
  return res.json({ ok: true, message: 'If that email exists, a reset link was sent.' })
})

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }
    await resetPassword(token, password)
    return res.json({ ok: true })
  } catch (e) {
    return res.status(400).json({ error: e instanceof Error ? e.message : 'Reset failed' })
  }
})

export default router
