import express from 'express'
import type { Server } from 'http'
import { POST_PROXY_ENDPOINTS } from '../src/proxy'

// This simple server just sends back the request headers as response body
export async function createHeaderCheckMockServer(): Promise<Server> {
  const app = express()

  app.post(POST_PROXY_ENDPOINTS, (req, res) => {
    res.send(JSON.stringify(req.headers))
  })

  return new Promise(resolve => {
    const server = app.listen(() => {
      resolve(server)
    })
  })
}
