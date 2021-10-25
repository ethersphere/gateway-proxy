import { app } from './server'

// Configuration
const PORT = Number(process.env.PORT || 3000)
const HOST = process.env.HOST || '127.0.0.1'

// Start the Proxy
app.listen(PORT, HOST, () => {
  console.log(`Starting Proxy at ${HOST}:${PORT}`) // eslint-disable-line no-console
})
