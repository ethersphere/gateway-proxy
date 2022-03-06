import express from 'express'
import type { Server } from 'http'

// This simple server just sends back the request headers as response body
export async function createHeaderCheckMockServer(): Promise<Server> {
  const app = express()

  app.post(['/bzz', '/bytes', '/chunks', '/feeds/:owner/:topic', '/soc/:owner/:id'], (req, res) => {
    res.send(JSON.stringify(req.headers))
  })

  return new Promise(resolve => {
    const server = app.listen(() => {
      resolve(server)
    })
  })
}
