import express, { Application } from 'express'
import { createProxyMiddleware, Options } from 'http-proxy-middleware'
import type { AppConfig } from './config'
import type { StampsManager } from './stamps'

const SWARM_STAMP_HEADER = 'swarm-postage-batch-id'

export const createApp = (
  { beeApiUrl, authorization }: AppConfig,
  stampManager: StampsManager | undefined = undefined,
): Application => {
  const commonOptions: Options = {
    target: beeApiUrl,
    changeOrigin: true,
  }

  // Create Express Server
  const app = express()

  // Authorization
  if (authorization) {
    app.use('', (req, res, next) => {
      if (req.headers.authorization === authorization) {
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

  const options = stampManager
    ? { ...commonOptions, headers: { [SWARM_STAMP_HEADER]: stampManager.postageStamp } }
    : commonOptions

  // Upload file/collection proxy
  app.post('/bzz', createProxyMiddleware(options))

  app.use((_req, res) => res.sendStatus(404))

  return app
}
