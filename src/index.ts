#!/usr/bin/env node

import { createApp } from './server'
import { StampsManager } from './stamps'

// Configuration
const BEE_API_URL = process.env.BEE_API_URL || 'http://localhost:1633'
const BEE_DEBUG_API_URL = process.env.BEE_DEBUG_API_URL || 'http://localhost:1635'

const AUTH_SECRET = process.env.AUTH_SECRET

const POSTAGE_STAMP = process.env.POSTAGE_STAMP
const POSTAGE_DEPTH = process.env.POSTAGE_DEPTH
const POSTAGE_AMOUNT = process.env.POSTAGE_AMOUNT
const POSTAGE_USAGE_THRESHOLD = process.env.POSTAGE_USAGE_THRESHOLD
const POSTAGE_USAGE_MAX = process.env.POSTAGE_USAGE_MAX
const POSTAGE_TTL_MIN = process.env.POSTAGE_TTL_MIN
const POSTAGE_REFRESH_PERIOD = process.env.POSTAGE_REFRESH_PERIOD

const PORT = Number(process.env.PORT || 3000)
const HOST = process.env.HOST || '127.0.0.1'

const stampManager = new StampsManager(
  {
    POSTAGE_STAMP,
    POSTAGE_DEPTH,
    POSTAGE_AMOUNT,
    POSTAGE_USAGE_MAX,
    POSTAGE_USAGE_THRESHOLD,
    POSTAGE_TTL_MIN,
    POSTAGE_REFRESH_PERIOD,
  },
  BEE_DEBUG_API_URL,
)

const app = createApp({ BEE_API_URL, AUTH_SECRET, stampManager })

// Start the Proxy
app.listen(PORT, HOST, () => {
  console.log(`Starting Proxy at ${HOST}:${PORT}`) // eslint-disable-line no-console
})
