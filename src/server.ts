import express, { Express } from 'express'
import { createProxyMiddleware, Options } from 'http-proxy-middleware'
import { getPostageStamp, shouldReplaceStamp, PostageStamps } from './stamps'

interface Config {
  BEE_API_URL: string
  AUTH_SECRET?: string
  postageStamps?: PostageStamps
}

export const createApp = ({ BEE_API_URL, AUTH_SECRET, postageStamps }: Config): Express => {
  const commonOptions: Options = {
    target: BEE_API_URL,
    changeOrigin: true,
  }

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
      ...commonOptions,
      pathRewrite: {
        '/readiness': '/',
      },
      onError: (_err, _req, res) => {
        res.writeHead(502).end('Bad Gateway')
      },
      onProxyRes: (_proxyRes, _req, res) => {
        res.writeHead(200).end('OK')
      },
    }),
  )

  // Download file/collection/chunk proxy
  app.get(['/bzz/:reference', '/bzz/:reference/*', '/bytes/:reference'], createProxyMiddleware(commonOptions))

  const options = shouldReplaceStamp(postageStamps)
    ? { ...commonOptions, headers: { 'swarm-postage-batch-id': getPostageStamp(postageStamps) } }
    : commonOptions

  // Upload file/collection proxy
  app.post('/bzz', createProxyMiddleware(options))

  app.use((_req, res) => res.sendStatus(404))

  return app
}
