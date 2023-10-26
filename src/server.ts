import { Bee, BeeDebug } from '@ethersphere/bee-js'
import bodyParser from 'body-parser'
import express, { Application } from 'express'
import { AppConfig, DEFAULT_HOSTNAME } from './config'
import { HASHED_IDENTITY_HEADER, fetchBeeIdentity, getHashedIdentity } from './identity'
import { logger } from './logger'
import { register } from './metrics'
import { createProxyEndpoints } from './proxy'
import { ReadinessStatus, checkReadiness } from './readiness'
import type { StampsManager } from './stamps'

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
  stampManager?: StampsManager,
): Application => {
  const bee = new Bee(beeApiUrl)
  const beeDebug = new BeeDebug(beeDebugApiUrl)

  // Create Express Server
  const app = express()

  app.use(
    bodyParser.raw({
      inflate: true,
      limit: '1gb',
      type: '*/*',
    }),
  )

  // Register hashed identity
  if (exposeHashedIdentity) {
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

    if (cidSubdomains) {
      logger.info(`enabling CID subdomain support with hostname ${hostname}`)
    }

    if (ensSubdomains) {
      logger.info(`enabling ENS subdomain support with hostname ${hostname}`)
    }
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

  createProxyEndpoints(app, {
    beeApiUrl,
    removePinHeader: removePinHeader ?? false,
    stampManager: stampManager ?? null,
  })

  app.use(express.static('public'))
  app.use((_req, res) => res.sendStatus(404))

  return app
}
