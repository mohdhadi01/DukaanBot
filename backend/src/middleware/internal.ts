import type { Request, Response, NextFunction } from 'express'
import { defaults } from '@/lib/env'

export function internalAuth(req: Request, res: Response, next: NextFunction) {
  const secret = req.headers['x-internal-secret']
  if (secret !== defaults.internalApiSecret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}
