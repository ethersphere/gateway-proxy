import express, { Application } from 'express'
import { createProxyMiddleware, Options } from 'http-proxy-middleware'
import type { AppConfig } from './config'
import type { StampsManager } from './stamps'
import { logger } from './logger'
import * as bzzLink from './bzz-link'
import { register } from './metrics'

const SWARM_STAMP_HEADER = 'swarm-postage-batch-id'

export const GET_PROXY_ENDPOINTS = [
  '/bzz/:reference',
  '/bzz/:reference/*',
  '/bytes/:reference',
  '/chunks/:reference',
  '/feeds/:owner/:topic',
]
export const POST_PROXY_ENDPOINTS = ['/bzz', '/bytes', '/chunks', '/feeds/:owner/:topic', '/soc/:owner/:id']

export const createApp = (
  { hostname, beeApiUrl, authorization, cidSubdomains, ensSubdomains, removePinHeader }: AppConfig,
  stampManager: StampsManager | undefined = undefined,
): Application => {
  const commonOptions: Options = {
    target: beeApiUrl,
    changeOrigin: true,
    logProvider: () => logger,
  }

  // Create Express Server
  const app = express()

  if (hostname) {
    const subdomainOffset = hostname.split('.').length
    app.set('subdomain offset', subdomainOffset)
  }

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

  if (cidSubdomains || ensSubdomains) {
    if (!hostname) {
      throw new Error('For Bzz.link support you have to configure HOSTNAME env!')
    }

    if (cidSubdomains) logger.info('enabling CID subdomain support')

    if (ensSubdomains) logger.info('enabling ENS subdomain support')

    app.get(
      '*',
      createProxyMiddleware(bzzLink.requestFilter, {
        ...commonOptions,
        cookieDomainRewrite: hostname,
        router: bzzLink.routerClosure(beeApiUrl, Boolean(cidSubdomains), Boolean(ensSubdomains)),
      }),
    )

    app.use(bzzLink.errorHandler)
  }

  app.get('/metrics', async (_req, res) => {
    res.write(await register.metrics())
    res.end()
  })

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
  app.get(GET_PROXY_ENDPOINTS, createProxyMiddleware(commonOptions))

  const options: Options = { ...commonOptions }

  options.onProxyReq = proxyReq => {
    if (removePinHeader) {
      proxyReq.removeHeader('swarm-pin')
    }

    if (stampManager) {
      proxyReq.removeHeader(SWARM_STAMP_HEADER)
      proxyReq.setHeader(SWARM_STAMP_HEADER, stampManager.postageStamp)
    }
  }

  // Upload file/collection proxy
  app.post(POST_PROXY_ENDPOINTS, createProxyMiddleware(options))

  app.use(express.static('public'))
  app.use((_req, res) => res.sendStatus(404))

  return app
}
