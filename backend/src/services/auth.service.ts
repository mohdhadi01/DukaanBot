import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'
import { User, Shop } from '../models'
import { provisionNewUser } from '../lib/auth'
import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  shopName: z.string().optional(),
})

export async function registerUser(input: z.infer<typeof registerSchema>) {
  const data = registerSchema.parse(input)
  const existing = await User.findOne({ email: data.email.toLowerCase() })
  if (existing) throw new Error('An account with this email already exists')

  const passwordHash = await bcrypt.hash(data.password, 12)
  const user = await provisionNewUser(data.email, data.name, data.phone || null)
  await User.findByIdAndUpdate(user._id, { passwordHash })

  if (data.shopName) {
    await Shop.findOneAndUpdate({ userId: user._id, isDemo: false }, { name: data.shopName })
  }

  return { userId: String(user._id) }
}

export async function createPasswordResetToken(email: string) {
  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) return null

  const token = randomToken()
  const expires = new Date(Date.now() + 60 * 60 * 1000)
  const { PasswordResetToken } = await import('../models')
  await PasswordResetToken.deleteMany({ userId: user._id })
  await PasswordResetToken.create({ userId: user._id, token, expires })
  return { token, email: user.email }
}

export async function resetPassword(token: string, newPassword: string) {
  const { PasswordResetToken } = await import('../models')
  const record = await PasswordResetToken.findOne({ token })
  if (!record || record.expires < new Date()) throw new Error('Invalid or expired reset token')
  const passwordHash = await bcrypt.hash(newPassword, 12)
  await User.findByIdAndUpdate(record.userId, { passwordHash })
  await PasswordResetToken.deleteOne({ _id: record._id })
  return { ok: true }
}

function randomToken() {
  return randomBytes(32).toString('hex')
}
