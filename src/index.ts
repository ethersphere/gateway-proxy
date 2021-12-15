#!/usr/bin/env node
import { Application } from 'express'

import { createApp } from './server'
import { StampsManager } from './stamps'
import { getAppConfig, getServerConfig, getStampsConfig, EnvironmentVariables } from './config'
import { logger, subscribeLogServerRequests } from './logger'

async function main() {
  // Configuration
  const stampConfig = getStampsConfig(process.env as EnvironmentVariables)
  const appConfig = getAppConfig(process.env as EnvironmentVariables)
  const { host, port } = getServerConfig(process.env as EnvironmentVariables)

  logger.debug('proxy config', appConfig)
  logger.debug('server config', { host, port })

  let app: Application

  if (stampConfig) {
    logger.debug('stamp config', stampConfig)
    const stampManager = new StampsManager()
    await stampManager.start(stampConfig)
    app = createApp(appConfig, stampManager)
  } else {
    logger.info('starting the app without postage stamps management')
    app = createApp(appConfig)
  }

  // Start the Proxy
  const server = app.listen(port, () => {
    logger.info(`starting gateway-proxy at ${host}`)
  })

  subscribeLogServerRequests(server)
}

main()
