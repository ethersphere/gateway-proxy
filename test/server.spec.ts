import { createApp } from '../src/server'
import request from 'supertest'
import { Bee } from '@ethersphere/bee-js'
import type { Server } from 'http'

import { bee, getPostageBatch, makeCollectionFromFS } from './utils'
import { StampsManager } from '../src/stamps'

const BEE_API_URL = process.env.BEE_API_URL || 'http://localhost:1633'
const BEE_API_URL_WRONG = process.env.BEE_API_URL_WRONG || 'http://localhost:2021'
const AUTH_SECRET = process.env.AUTH_SECRET || 'super_secret_token'

const app = createApp({ BEE_API_URL })
const appWrong = createApp({ BEE_API_URL: BEE_API_URL_WRONG })
const appAuth = createApp({ BEE_API_URL, AUTH_SECRET })
const appAuthWrong = createApp({ BEE_API_URL: BEE_API_URL_WRONG, AUTH_SECRET })

let proxy: Server
let proxyAuth: Server
let proxyWithStamp: Server
let beeProxy: Bee
let _beeProxyAuth: Bee
let beeWithStamp: Bee

beforeAll(async () => {
  proxy = await new Promise((resolve, _reject) => {
    const server = app.listen(async () => resolve(server))
  })
  const port = (proxy.address() as AddressInfo).port
  beeProxy = new Bee(`http://localhost:${port}`)

  const stamp = getPostageBatch()
  const appWithStamp = createApp({ BEE_API_URL, stampManager: new StampsManager({ POSTAGE_STAMP: stamp }) })
  proxyWithStamp = await new Promise((resolve, _reject) => {
    const server = appWithStamp.listen(async () => resolve(server))
  })
  const portWithStamp = (proxyWithStamp.address() as AddressInfo).port
  beeWithStamp = new Bee(`http://localhost:${portWithStamp}`)

  proxyAuth = await new Promise((resolve, _reject) => {
    const server = appAuth.listen(async () => resolve(server))
  })
  const portAuth = (proxy.address() as AddressInfo).port
  _beeProxyAuth = new Bee(`http://localhost:${portAuth}`)
})

afterAll(async () => {
  await new Promise(resolve => proxy.close(resolve))
  await new Promise(resolve => proxyAuth.close(resolve))
  await new Promise(resolve => proxyWithStamp.close(resolve))
})

interface AddressInfo {
  address: string
  family: string
  port: number
}

describe('GET /health', () => {
  it('should return 200 & OK', async () => {
    const res = await request(app).get(`/health`).expect(200)

    expect(res.text).toEqual('OK')
  })

  it('with authorization enabled should return 403 & Forbidden', async () => {
    const res = await request(appAuth).get(`/health`).expect(403)

    expect(res.text).toEqual('Forbidden')
  })

  it('with authorization enabled should return 200 & OK', async () => {
    const res = await request(appAuth).get(`/health`).set('authorization', AUTH_SECRET).expect(200)

    expect(res.text).toEqual('OK')
  })
})

describe('GET /readiness', () => {
  it('should return 200 & OK', async () => {
    const res = await request(app).get(`/readiness`).expect(200)

    expect(res.text).toEqual('OK')
  })
  it('should return 502 & Bad Gateway', async () => {
    const res = await request(appWrong).get(`/readiness`).expect(502)

    expect(res.text).toEqual('Bad Gateway')
  })

  it('with authorization enabled should return 403 & Forbidden', async () => {
    const res = await request(appAuth).get(`/readiness`).expect(403)

    expect(res.text).toEqual('Forbidden')
  })

  it('with authorization enabled should return 502 & Bad Gateway', async () => {
    const res = await request(appAuthWrong).get(`/readiness`).set('authorization', AUTH_SECRET).expect(502)

    expect(res.text).toEqual('Bad Gateway')
  })

  it('with authorization enabled should return 200 & OK', async () => {
    const res = await request(appAuth).get(`/readiness`).set('authorization', AUTH_SECRET).expect(200)

    expect(res.text).toEqual('OK')
  })
})

describe('POST /bzz', () => {
  it('should store and retrieve actual directory with index document', async () => {
    const batch = getPostageBatch()

    const indexDocument = '1.txt'
    const directoryStructure = await makeCollectionFromFS('./test/data/')

    const { reference } = await beeProxy.uploadCollection(batch, directoryStructure, { indexDocument })

    const file1 = await bee.downloadFile(reference)
    expect(file1.name).toEqual(indexDocument)
    expect(file1.data.text()).toMatch(/^1abcd\n$/)
  })

  it('should upload with environment defined postage stamp', async () => {
    const indexDocument = '1.txt'
    const directoryStructure = await makeCollectionFromFS('./test/data/')

    const { reference } = await beeWithStamp.uploadCollection(
      '0000000000000000000000000000000000000000000000000000000000000000',
      directoryStructure,
      { indexDocument },
    )

    const file1 = await bee.downloadFile(reference)
    expect(file1.name).toEqual(indexDocument)
    expect(file1.data.text()).toMatch(/^1abcd\n$/)
  })
})

describe('GET /bytes/:reference/', () => {
  it('should retrieve bytes from the proxy', async () => {
    const batch = getPostageBatch()

    const indexDocument = '1.txt'
    const directoryStructure = await makeCollectionFromFS('./test/data/')

    const { reference } = await bee.uploadCollection(batch, directoryStructure, { indexDocument })

    const res = await request(app).get(`/bytes/${reference}`).redirects(1).expect(200)
    expect(JSON.stringify(res.body)).toBe(
      '{"type":"Buffer","data":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,87,104,179,182,167,219,86,210,29,26,191,244,13,65,206,191,200,52,72,254,216,215,233,176,110,192,211,176,115,242,143,32,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,6,0,0,0,0,0,32,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,18,1,47,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,133,4,242,161,7,202,148,11,234,252,76,226,246,201,169,240,150,140,98,165,181,137,63,240,228,225,226,152,48,72,210,118,0,62,123,34,119,101,98,115,105,116,101,45,105,110,100,101,120,45,100,111,99,117,109,101,110,116,34,58,34,49,46,116,120,116,34,125,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,18,5,49,46,116,120,116,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,127,65,153,145,119,243,47,72,205,83,184,211,127,216,184,173,193,213,39,114,148,80,9,118,55,12,251,19,241,142,7,236,0,62,123,34,67,111,110,116,101,110,116,45,84,121,112,101,34,58,34,34,44,34,70,105,108,101,110,97,109,101,34,58,34,49,46,116,120,116,34,125,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,18,5,50,46,116,120,116,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,50,195,238,155,127,96,150,52,193,76,42,162,251,139,143,84,168,161,23,39,23,115,210,193,90,208,81,223,104,243,119,107,0,62,123,34,67,111,110,116,101,110,116,45,84,121,112,101,34,58,34,34,44,34,70,105,108,101,110,97,109,101,34,58,34,50,46,116,120,116,34,125,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,18,5,101,109,112,116,121,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,50,195,238,155,127,96,150,52,193,76,42,162,251,139,143,84,168,161,23,39,23,115,210,193,90,208,81,223,104,243,119,107,0,62,123,34,67,111,110,116,101,110,116,45,84,121,112,101,34,58,34,34,44,34,70,105,108,101,110,97,109,101,34,58,34,101,109,112,116,121,34,125,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,12,4,115,117,98,47,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,163,208,234,149,199,128,19,57,214,15,237,167,57,8,53,133,187,207,94,107,194,107,92,133,90,168,43,199,30,164,204,202]}',
    )
  })

  it('with authorization enabled should return 403 & Forbidden', async () => {
    const res = await request(appAuth).get(`/bytes/reference/`).expect(403)

    expect(res.text).toEqual('Forbidden')
  })
})

describe('GET /bzz/:reference/', () => {
  it('should retrieve index document from a directory', async () => {
    const batch = getPostageBatch()

    const indexDocument = '1.txt'
    const directoryStructure = await makeCollectionFromFS('./test/data/')

    const { reference } = await bee.uploadCollection(batch, directoryStructure, { indexDocument })

    const res = await request(app).get(`/bzz/${reference}`).redirects(1).expect(200)
    expect(res.headers['content-disposition']).toBe('inline; filename="1.txt"')
    expect(res.text).toBe('1abcd\n')
  })

  it('with authorization enabled should return 403 & Forbidden', async () => {
    const res = await request(appAuth).get(`/bzz/reference/`).expect(403)

    expect(res.text).toEqual('Forbidden')
  })
})

describe('GET /bzz/:reference/<path>', () => {
  it('should retrieve a subdocument from a directory', async () => {
    const batch = getPostageBatch()

    const indexDocument = '1.txt'
    const directoryStructure = await makeCollectionFromFS('./test/data/')

    const { reference } = await bee.uploadCollection(batch, directoryStructure, { indexDocument })

    const res = await request(app).get(`/bzz/${reference}/sub/3.txt`).redirects(1).expect(200)
    expect(res.headers['content-disposition']).toBe('inline; filename="3.txt"')
    expect(res.text).toBe('3\n')
  })

  it('with authorization enabled should return 403 & Forbidden', async () => {
    const res = await request(appAuth).get(`/bzz/reference/whatever`).expect(403)

    expect(res.text).toEqual('Forbidden')
  })
})
