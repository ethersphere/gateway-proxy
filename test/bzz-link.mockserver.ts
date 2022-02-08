import express from 'express'
import type { Server } from 'http'

export async function createBzzLinkMockServer(cookie: string): Promise<Server> {
  const app = express()

  app.get('/bzz/:reference', (req, res) => {
    res.set('Set-Cookie', cookie).send('Hello World')
  })

  return new Promise(resolve => {
    const server = app.listen(() => {
      resolve(server)
    })
  })
}
