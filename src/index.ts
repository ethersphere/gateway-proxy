#!/usr/bin/env node
import { Application } from 'express'

import { initializeIdentity } from './identity'
import { createApp } from './server'
import { StampsManager } from './stamps'
import { getAppConfig, getServerConfig, getStampsConfig, EnvironmentVariables } from './config'
import { logger, subscribeLogServerRequests } from './logger'

async function main() {
  // Configuration
  const stampConfig = getStampsConfig(process.env as EnvironmentVariables)
  const appConfig = getAppConfig(process.env as EnvironmentVariables)
  const { hostname, port } = getServerConfig(process.env as EnvironmentVariables)
  initializeIdentity()

  logger.debug('proxy config', appConfig)
  logger.debug('server config', { hostname: hostname, port })

  let app: Application

  if (stampConfig) {
    logger.debug('stamp config', stampConfig)
    const stampManager = new StampsManager()
    logger.info('starting postage stamp manager')
    await stampManager.start(stampConfig)
    logger.info('starting the proxy')
    app = createApp(appConfig, stampManager)
  } else {
    logger.info('starting the app without postage stamps management')
    app = createApp(appConfig)
  }

  // Start the Proxy
  const server = app.listen(port, () => {
    logger.info(`starting gateway-proxy at ${hostname}:${port}`)
  })

  subscribeLogServerRequests(server)
}

main()
