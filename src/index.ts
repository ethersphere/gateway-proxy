#!/usr/bin/env node
import { Application } from 'express'

import { createApp } from './server'
import { AutoBuyStampsManager, ExtendsStampManager, HardcodedStampsManager } from './stamps'
import { getAppConfig, getServerConfig, getStampsConfig, EnvironmentVariables, getContentConfig } from './config'
import { logger, subscribeLogServerRequests } from './logger'
import { ContentManager } from './content'

async function main() {
  // Configuration
  const stampsConfig = getStampsConfig(process.env as EnvironmentVariables)
  const contentConfig = getContentConfig(process.env as EnvironmentVariables)
  const appConfig = getAppConfig(process.env as EnvironmentVariables)
  const { hostname, port } = getServerConfig(process.env as EnvironmentVariables)

  logger.debug('proxy config', appConfig)
  logger.debug('server config', { hostname: hostname, port })

  let app: Application

  if (contentConfig) {
    logger.debug('content config', contentConfig)
    const contentManager = new ContentManager()
    logger.info('starting content manager')
    contentManager.start(contentConfig)
  }

  if (stampsConfig) {
    logger.debug('stamps config', stampsConfig)
    let stampManager: HardcodedStampsManager | AutoBuyStampsManager | ExtendsStampManager
    const { mode } = stampsConfig

    if (mode === 'hardcoded') {
      stampManager = new HardcodedStampsManager()

      logger.info('starting hardcoded postage stamp manager')
      stampManager.start(stampsConfig)
    } else if (mode === 'autobuy') {
      logger.info('starting autobuy postage stamp manager')
      stampManager = new AutoBuyStampsManager(stampsConfig)
    } else {
      logger.info('starting extends postage stamp manager')
      stampManager = new ExtendsStampManager(stampsConfig)
    }
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
