import express, { Request } from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'

// Create Express Server
export const app = express()

// Configuration
const BEE_API_URL = process.env.BEE_API_URL || 'http://localhost:1633'
const AUTH_SECRET = process.env.AUTH_SECRET

// Authorization
if (AUTH_SECRET) {
  app.use('', (req, res, next) => {
    if (req.headers.authorization === AUTH_SECRET) {
      next()
    } else {
      res.sendStatus(403)
    }
  })
}

// Health endpoint
app.get('/health', (_req, res) => res.send('OK'))

// Readiness endpoint
app.get('/readiness', (_req, res) => res.send('OK'))

// Download file/collection proxy
app.get(
  '/bzz/:reference',
  createProxyMiddleware({
    target: BEE_API_URL,
    changeOrigin: true,
  }),
)

// Upload file/collection proxy
app.post(
  '/bzz',
  createProxyMiddleware({
    target: BEE_API_URL,
    changeOrigin: true,
  }),
)

app.use((_req, res) => res.sendStatus(404))
