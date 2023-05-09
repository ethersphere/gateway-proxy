#!/usr/bin/env node
import { Application } from 'express'

import { ContentManager } from './content'
import { logger, subscribeLogServerRequests } from './logger'
import { createApp } from './server'
import { settings } from './settings/settings-singleton'
import { StampsManager } from './stamps'

async function main() {
  let app: Application

  if (settings.contentReupload.enabled) {
    const contentManager = new ContentManager()
    contentManager.start()
  }

  if (settings.stamp.mode) {
    const stampManager = new StampsManager()
    stampManager.start()
    app = createApp(stampManager)
  } else {
    app = createApp()
  }

  // Start the Proxy
  const server = app.listen(settings.server.port, () => {
    logger.info(`starting gateway-proxy at ${settings.server.hostname}:${settings.server.port}`)
  })

  subscribeLogServerRequests(server)
}

main()
