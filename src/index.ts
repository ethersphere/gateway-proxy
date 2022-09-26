#!/usr/bin/env node
import { Application } from 'express'

import { createApp } from './server'
import { StampsManager } from './stamps'
import { getAppConfig, getServerConfig, getStampsConfig, EnvironmentVariables, getContentsConfig } from './config'
import { logger, subscribeLogServerRequests } from './logger'
import { ContentsManager } from './contents'

async function main() {
  // Configuration
  const stampsConfig = getStampsConfig(process.env as EnvironmentVariables)
  const contentsConfig = getContentsConfig(process.env as EnvironmentVariables)
  const appConfig = getAppConfig(process.env as EnvironmentVariables)
  const { hostname, port } = getServerConfig(process.env as EnvironmentVariables)

  logger.debug('proxy config', appConfig)
  logger.debug('server config', { hostname: hostname, port })

  let app: Application

  if (contentsConfig) {
    logger.debug('contents config', contentsConfig)
    const contentsManager = new ContentsManager()
    logger.info('starting postage content manager')
    await contentsManager.start(contentsConfig)
  }

  if (stampsConfig) {
    logger.debug('stamps config', stampsConfig)
    const stampManager = new StampsManager()
    logger.info('starting postage stamp manager')
    await stampManager.start(stampsConfig)
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
