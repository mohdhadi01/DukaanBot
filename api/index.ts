import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getApp } from '../backend/src/app'

let appInstance: any = null

export default async function vercelApi(req: VercelRequest, res: VercelResponse) {
  try {
    if (!appInstance) {
      appInstance = await getApp()
      console.log('Vercel API handler initialized')
    }
    return appInstance(req, res)
  } catch (error) {
    console.error('Serverless function error:', error)
    return res.status(500).json({
      error: 'Serverless function error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
  }
}