import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'

interface Config {
  BEE_API_URL: string
  AUTH_SECRET?: string
}

export const createApp = ({ BEE_API_URL, AUTH_SECRET }: Config) => {
  // Create Express Server
  const app = express()

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
  app.get(
    '/readiness',
    createProxyMiddleware({
      target: BEE_API_URL,
      changeOrigin: true,
      pathRewrite: {
        '/readiness': '/',
      },
      onError: (_err, _req, res) => {
        res.writeHead(404).end('Not Found')
      },
      onProxyRes: (_proxyRes, _req, res) => {
        res.writeHead(200).end('OK')
      },
    }),
  )

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

  return app
}
