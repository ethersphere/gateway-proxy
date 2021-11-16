#!/usr/bin/env node
import { Application } from 'express'

import { createApp } from './server'
import { StampsManager } from './stamps'
import { getAppConfig, getServerConfig, getStampsConfig, EnvironmentVariables } from './config'

async function main() {
  // Configuration
  const stampConfig = getStampsConfig(process.env as EnvironmentVariables)
  const appConfig = getAppConfig(process.env as EnvironmentVariables)
  const { host, port } = getServerConfig(process.env as EnvironmentVariables)

  let app: Application

  if (stampConfig) {
    const stampManager = new StampsManager()
    await stampManager.start(stampConfig)
    app = createApp(appConfig, stampManager)
  } else app = createApp(appConfig)

  // Start the Proxy
  app.listen(port, host, () => {
    console.log(`Starting Proxy at ${host}:${port}`) // eslint-disable-line no-console
  })
}

main()
