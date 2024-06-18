import express from 'express'
import { Server } from 'http'
import request from 'supertest'
import { createApp } from '../src/server'

let server: Server

beforeAll(async () => {
  const serverApp = express()
  serverApp.get('*', (_, res) => {
    res.json({
      overlay: '36b7efd913ca4cf880b8eeac5093fa27b0825906c600685b6abdd6566e6cfe8f',
      underlay: ['/ip4/127.0.0.1/tcp/1634/p2p/16Uiu2HAmTm17toLDaPYzRyjKn27iCB76yjKnJ5DjQXneFmifFvaX'],
      ethereum: '36b7efd913ca4cf880b8eeac5093fa27b0825906',
      publicKey: '02ab7473879005929d10ce7d4f626412dad9fe56b0a6622038931d26bd79abf0a4',
      pssPublicKey: '02ab7473879005929d10ce7d4f626412dad9fe56b0a6622038931d26bd79abf0a4',
    })
  })
  server = serverApp.listen(3999)
})

afterAll(() => {
  server.close()
})

test('should return hashed identity in header', async () => {
  const app = createApp({
    beeApiUrl: 'http://localhost:3999',
    exposeHashedIdentity: true,
  })
  let tries = 0
  let hashedIdentity = null
  while (tries < 10 && !hashedIdentity) {
    await wait()
    const response = await request(app).get('/health')
    hashedIdentity = response.headers['x-bee-node']
    tries++
  }
  expect(hashedIdentity).toEqual('3833fe1edcd41e4931105639bc30b423078cf918')
})

async function wait() {
  await new Promise(resolve => setTimeout(resolve, 500))
}
