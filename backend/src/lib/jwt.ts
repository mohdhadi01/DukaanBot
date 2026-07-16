const COOKIE_NAME = 'auth_token'

export function getJwtSecret() {
  const secret =
    process.env.JWT_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'dev-secret-change-in-production-32chars'
  return new TextEncoder().encode(secret)
}

export type AuthTokenPayload = {
  id: string
  email: string
  name?: string | null
  onboardingDone?: boolean
  onboardingStep?: number
}

export async function signAuthToken(payload: AuthTokenPayload, expiresIn = '7d') {
  const { SignJWT } = await import('jose')
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getJwtSecret())
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { jwtVerify } = await import('jose')
    const { payload } = await jwtVerify(token, getJwtSecret())
    if (!payload.id || typeof payload.id !== 'string') return null
    return {
      id: payload.id,
      email: String(payload.email || ''),
      name: payload.name as string | null | undefined,
      onboardingDone: Boolean(payload.onboardingDone),
      onboardingStep: Number(payload.onboardingStep ?? 0),
    }
  } catch {
    return null
  }
}

export { COOKIE_NAME }
