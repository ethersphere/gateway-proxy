import { Bee } from '@ethersphere/bee-js'
import axios from 'axios'
import bodyParser from 'body-parser'
import { Arrays, Strings } from 'cafe-utility'
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
    allowlist,
    authorization,
    cidSubdomains,
    ensSubdomains,
    removePinHeader,
    exposeHashedIdentity,
    readinessCheck,
    homepage,
  }: AppConfig,
  stampManager?: StampsManager,
): Application => {
  const bee = new Bee(beeApiUrl)

  // Create Express Server
  const app = express()

  app.use(
    bodyParser.raw({
      inflate: true,
      limit: Arrays.getArgument(process.argv, 'post-size-limit', process.env, 'POST_SIZE_LIMIT') || '1gb',
      type: '*/*',
    }),
  )

  app.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, swarm-postage-batch-id, swarm-deferred-upload',
    )

    if (req.method === 'OPTIONS') {
      res.sendStatus(200)

      return
    }
    next()
  })

  // Register hashed identity
  if (exposeHashedIdentity) {
    const bee = new Bee(beeApiUrl)
    fetchBeeIdentity(bee)
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
      } else if (
        req.method !== 'post' &&
        Arrays.getBooleanArgument(process.argv, 'soft-auth', process.env, 'SOFT_AUTH')
      ) {
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

  app.get('/gateway', (_req, res) => res.send({ gateway: true }))

  // Health endpoint
  app.get('/health', (_req, res) => res.send('OK'))

  // Readiness endpoint
  app.get('/readiness', async (_req, res) => {
    const readinessStatus = await checkReadiness(bee, readinessCheck ?? false, stampManager)

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
    removePinHeader: removePinHeader ?? true,
    stampManager: stampManager ?? null,
    allowlist,
    cidSubdomains,
    ensSubdomains,
    hostname,
    remap: Object.fromEntries(
      (Arrays.getArgument(process.argv, 'remap', process.env, 'REMAP') || '').split(';').map(x => x.split('=')),
    ),
    userAgents: (Arrays.getArgument(process.argv, 'allow-user-agents', process.env, 'ALLOW_USER_AGENTS') || '').split(
      ',',
    ),
  })

  if (homepage) {
    app.use(async (req, res, next) => {
      try {
        const url = Strings.joinUrl(beeApiUrl, 'bzz', homepage, req.url)
        logger.info('attempting to fetch homepage', { url })

        // attempt to fetch homepage
        const response = await axios.get(url, {
          responseType: 'arraybuffer',
        })

        if (response.status !== 200) {
          throw Error('Homepage not available')
        }
        const contentType = response.headers['content-type']
        res.set('content-type', contentType || 'application/octet-stream')
        res.send(await response.data)

        return
      } catch (error) {
        next()
      }
    })
  }

  app.use(express.static('public'))

  app.use((_req, res) => res.sendStatus(404))

  return app
}
