#!/usr/bin/env node

import { createApp } from './server'

// Configuration
const BEE_API_URL = process.env.BEE_API_URL || 'http://localhost:1633'
const AUTH_SECRET = process.env.AUTH_SECRET
const PORT = Number(process.env.PORT || 3000)
const HOST = process.env.HOST || '127.0.0.1'

const app = createApp({ BEE_API_URL, AUTH_SECRET })

// Start the Proxy
app.listen(PORT, HOST, () => {
  console.log(`Starting Proxy at ${HOST}:${PORT}`) // eslint-disable-line no-console
})
