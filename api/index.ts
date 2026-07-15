import serverless from 'serverless-http'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getApp } from '../backend/src/app'

type ServerlessHandler = ReturnType<typeof serverless>

let handler: ServerlessHandler | null = null

export default async function vercelApi(req: VercelRequest, res: VercelResponse) {
  try {
    if (!handler) {
      const app = await getApp()
      handler = serverless(app, {
        binary: ['image/*', 'application/octet-stream'],
      })
      console.log('Vercel API handler initialized')
    }
    return handler(req, res)
  } catch (error) {
    console.error('Serverless function error:', error)
    return res.status(500).json({
      error: 'Serverless function error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
  }
}