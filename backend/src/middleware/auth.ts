import type { Request, Response, NextFunction } from 'express'
import type { AuthTokenPayload } from '@/lib/jwt'
import { getUserFromRequest } from '../lib/tenant-express'

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthTokenPayload
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = await getUserFromRequest(req)
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  req.user = user
  next()
}
