import { Bee, BeeDebug } from '@ethersphere/bee-js'
import express, { Application } from 'express'
import { createProxyMiddleware, Options } from 'http-proxy-middleware'
import * as bzzLink from './bzz-link'
import { AppConfig, DEFAULT_HOSTNAME, ERROR_NO_STAMP } from './config'
import { fetchBeeIdentity, getHashedIdentity, HASHED_IDENTITY_HEADER } from './identity'
import { logger } from './logger'
import { register } from './metrics'
import { checkReadiness, ReadinessStatus } from './readiness'
import { getErrorMessage } from './utils'
import type { BaseStampManager } from './stamps/base'

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
  {
    hostname,
    beeApiUrl,
    beeDebugApiUrl,
    authorization,
    cidSubdomains,
    ensSubdomains,
    removePinHeader,
    exposeHashedIdentity,
  }: AppConfig,
  stampManager?: BaseStampManager,
): Application => {
  const commonOptions: Options = {
    target: beeApiUrl,
    changeOrigin: true,
    logProvider: () => logger,
  }

  const bee = new Bee(beeApiUrl)
  const beeDebug = new BeeDebug(beeDebugApiUrl)

  // Create Express Server
  const app = express()

  // Register hashed identity
  if (exposeHashedIdentity) {
    if (!beeDebugApiUrl) {
      throw Error('BEE_DEBUG_API_URL is not set, but EXPOSE_HASHED_IDENTITY is set to true')
    }
    const beeDebug = new BeeDebug(beeDebugApiUrl)
    fetchBeeIdentity(beeDebug)
    app.use((_, res, next) => {
      res.set(HASHED_IDENTITY_HEADER, getHashedIdentity())
      next()
    })
  }

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

    if (hostname === DEFAULT_HOSTNAME) {
      logger.warn(`bzz.link support is enabled but HOSTNAME is set to the default ${DEFAULT_HOSTNAME}`)
    }

    if (cidSubdomains) logger.info(`enabling CID subdomain support with hostname ${hostname}`)

    if (ensSubdomains) logger.info(`enabling ENS subdomain support with hostname ${hostname}`)

    app.get(
      '*',
      createProxyMiddleware(bzzLink.requestFilter, {
        ...commonOptions,
        cookieDomainRewrite: hostname,
        router: bzzLink.routerClosure(beeApiUrl, Boolean(cidSubdomains), Boolean(ensSubdomains)),
      }),
    )

    app.use(bzzLink.errorHandler)
  } else {
    logger.info('starting the app without bzz.link support (see HOSTNAME, ENS_SUBDOMAINS and CID_SUBDOMAINS)')
  }

  app.get('/metrics', async (_req, res) => {
    res.write(await register.metrics())
    res.end()
  })

  // Health endpoint
  app.get('/health', (_req, res) => res.send('OK'))

  // Readiness endpoint
  app.get('/readiness', async (_req, res) => {
    const readinessStatus = await checkReadiness(bee, beeDebug, stampManager)

    if (readinessStatus === ReadinessStatus.OK) {
      res.end('OK')
    } else if (readinessStatus === ReadinessStatus.NO_STAMP) {
      res.status(503).end(readinessStatus)
    } else {
      res.status(502).end(readinessStatus)
    }
  })

  // Download file/collection/chunk proxy
  app.get(GET_PROXY_ENDPOINTS, createProxyMiddleware(commonOptions))

  const options: Options = { ...commonOptions }

  options.onProxyReq = (proxyReq, _req, res) => {
    if (removePinHeader) {
      proxyReq.removeHeader('swarm-pin')
    }

    if (stampManager) {
      proxyReq.removeHeader(SWARM_STAMP_HEADER)
      try {
        proxyReq.setHeader(SWARM_STAMP_HEADER, stampManager.postageStamp())
      } catch (error) {
        logger.error('proxy failure', error)

        if (getErrorMessage(error) === ERROR_NO_STAMP) {
          res.writeHead(503).end(ERROR_NO_STAMP)
        } else {
          res.writeHead(503).end('Service Unavailable')
        }
      }
    }
  }

  // Upload file/collection proxy
  app.post(POST_PROXY_ENDPOINTS, createProxyMiddleware(options))

  app.use(express.static('public'))
  app.use((_req, res) => res.sendStatus(404))

  return app
}
