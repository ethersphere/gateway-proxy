import { Bee, BeeDebug } from '@ethersphere/bee-js'
import express, { Application } from 'express'
import { Options, createProxyMiddleware } from 'http-proxy-middleware'
import * as bzzLink from './bzz-link'
import { HASHED_IDENTITY_HEADER, fetchBeeIdentity, getHashedIdentity } from './identity'
import { logger } from './logger'
import { register } from './metrics'
import { ReadinessStatus, checkReadiness } from './readiness'
import { settings } from './settings/settings-singleton'
import type { StampsManager } from './stamps'
import { getErrorMessage } from './utils'

const SWARM_STAMP_HEADER = 'swarm-postage-batch-id'

export const GET_PROXY_ENDPOINTS = [
  '/bzz/:reference',
  '/bzz/:reference/*',
  '/bytes/:reference',
  '/chunks/:reference',
  '/feeds/:owner/:topic',
]
export const POST_PROXY_ENDPOINTS = ['/bzz', '/bytes', '/chunks', '/feeds/:owner/:topic', '/soc/:owner/:id']

export const createApp = (stampManager?: StampsManager): Application => {
  const commonOptions: Options = {
    target: settings.bee.api,
    changeOrigin: true,
    logProvider: () => logger,
  }

  const bee = new Bee(settings.bee.api)
  const beeDebug = new BeeDebug(settings.bee.debugApi)

  // Create Express Server
  const app = express()

  // Register hashed identity
  if (settings.exposeHashedIdentity) {
    const beeDebug = new BeeDebug(settings.bee.debugApi)
    fetchBeeIdentity(beeDebug)
    app.use((_, res, next) => {
      res.set(HASHED_IDENTITY_HEADER, getHashedIdentity())
      next()
    })
  }

  if (settings.server.hostname) {
    const subdomainOffset = settings.server.hostname.split('.').length
    app.set('subdomain offset', subdomainOffset)
  }

  // Authorization
  if (settings.server.authSecret) {
    app.use('', (req, res, next) => {
      if (req.headers.authorization === settings.server.authSecret) {
        next()
      } else {
        res.sendStatus(403)
      }
    })
  }

  if (settings.cid || settings.ens) {
    if (!settings.server.hostname) {
      throw new Error('For Bzz.link support you have to configure HOSTNAME env!')
    }

    if (settings.cid) logger.info(`enabling CID subdomain support with hostname ${settings.server.hostname}`)

    if (settings.ens) logger.info(`enabling ENS subdomain support with hostname ${settings.server.hostname}`)

    app.get(
      '*',
      createProxyMiddleware(bzzLink.requestFilter, {
        ...commonOptions,
        cookieDomainRewrite: settings.server.hostname,
        router: bzzLink.routerClosure(settings.bee.api, settings.cid, settings.ens),
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
    if (settings.removePinHeader) {
      proxyReq.removeHeader('swarm-pin')
    }

    if (stampManager) {
      proxyReq.removeHeader(SWARM_STAMP_HEADER)
      try {
        proxyReq.setHeader(SWARM_STAMP_HEADER, stampManager.postageStamp)
      } catch (error) {
        logger.error('proxy failure', error)

        if (getErrorMessage(error) === 'No postage stamp') {
          res.writeHead(503).end('No postage stamp')
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
