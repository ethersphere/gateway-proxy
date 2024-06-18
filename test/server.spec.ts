import { Bee } from '@ethersphere/bee-js'
import type { Server } from 'http'
import request from 'supertest'
import { createApp } from '../src/server'

import { POST_PROXY_ENDPOINTS } from '../src/proxy'
import { StampsManager } from '../src/stamps'
import { createHeaderCheckMockServer } from './header-check.mockserver'
import { bee, getPostageBatch, makeCollectionFromFS } from './utils'

const beeApiUrl = process.env.BEE_API_URL || 'http://localhost:1633'
const beeApiUrlWrong = process.env.BEE_API_URL_WRONG || 'http://localhost:2021'
const authorization = process.env.AUTH_SECRET || 'super_secret_token'

const app = createApp({ beeApiUrl })
const appWrong = createApp({ beeApiUrl: beeApiUrlWrong })
const appAuth = createApp({ beeApiUrl, authorization })
const appAuthWrong = createApp({ beeApiUrl: beeApiUrlWrong, authorization })

let proxy: Server
let proxyAuth: Server
let proxyWithStamp: Server
let beeProxy: Bee
let _beeProxyAuth: Bee
let beeWithStamp: Bee

let headerServer: Server
let headerProxy: Server

beforeAll(async () => {
  proxy = await new Promise((resolve, _reject) => {
    const server = app.listen(async () => resolve(server))
  })
  const port = (proxy.address() as AddressInfo).port
  beeProxy = new Bee(`http://localhost:${port}`)

  const stamp = getPostageBatch()
  const stampManager = new StampsManager()
  await stampManager.start({ mode: 'hardcoded', stamp })
  const appWithStamp = createApp({ beeApiUrl }, stampManager)
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

  headerServer = await createHeaderCheckMockServer()
  const headerServerPort = (headerServer.address() as AddressInfo).port
  headerProxy = await new Promise((resolve, _reject) => {
    const server = createApp({
      beeApiUrl: `http://localhost:${headerServerPort}`,
      removePinHeader: true,
    }).listen(async () => resolve(server))
  })
})

afterAll(async () => {
  await new Promise(resolve => proxy.close(resolve))
  await new Promise(resolve => proxyAuth.close(resolve))
  await new Promise(resolve => proxyWithStamp.close(resolve))
  await new Promise(resolve => headerServer.close(resolve))
  await new Promise(resolve => headerProxy.close(resolve))
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
    const res = await request(appAuth).get(`/health`).set('authorization', authorization).expect(200)

    expect(res.text).toEqual('OK')
  })
})

describe('GET /readiness', () => {
  it('should return 200 & OK', async () => {
    const res = await request(app).get(`/readiness`).expect(200)

    expect(res.text).toEqual('OK')
  })
  it('should return 502', async () => {
    const res = await request(appWrong).get(`/readiness`).expect(502)

    expect(res.text).toEqual('OTHER_ERROR')
  })

  it('with authorization enabled should return 403 & Forbidden', async () => {
    const res = await request(appAuth).get(`/readiness`).expect(403)

    expect(res.text).toEqual('Forbidden')
  })

  it('with authorization enabled should return 502', async () => {
    const res = await request(appAuthWrong).get(`/readiness`).set('authorization', authorization).expect(502)

    expect(res.text).toEqual('OTHER_ERROR')
  })

  it('with authorization enabled should return 200 & OK', async () => {
    const res = await request(appAuth).get(`/readiness`).set('authorization', authorization).expect(200)

    expect(res.text).toEqual('OK')
  })
})

describe('POST /bytes', () => {
  it('should store and retrieve actual data', async () => {
    const batch = getPostageBatch()

    const data = 'hello world'

    const { reference } = await beeProxy.uploadData(batch, data)

    const downloadedData = await bee.downloadData(reference)

    expect(Buffer.from(downloadedData).toString()).toEqual(data)
  })

  it('should store and retrieve actual data with environment defined postage stamp', async () => {
    const batch = '0000000000000000000000000000000000000000000000000000000000000000'

    const data = 'hello world without stamp'

    const { reference } = await beeWithStamp.uploadData(batch, data)

    const downloadedData = await bee.downloadData(reference)

    expect(Buffer.from(downloadedData).toString()).toEqual(data)
  })
})

describe('GET /bytes/:reference/', () => {
  it('should retrieve bytes from the proxy', async () => {
    const batch = getPostageBatch()

    const data = 'hello world'

    const { reference } = await bee.uploadData(batch, data)

    const downloadedData = await beeProxy.downloadData(reference)

    expect(Buffer.from(downloadedData).toString()).toEqual(data)
  })

  it('with authorization enabled should return 403 & Forbidden', async () => {
    const res = await request(appAuth).get(`/bytes/reference/`).expect(403)

    expect(res.text).toEqual('Forbidden')
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

describe('GET /bzz/:reference/', () => {
  it('should retrieve index document from a directory', async () => {
    const batch = getPostageBatch()

    const indexDocument = '1.txt'
    const directoryStructure = await makeCollectionFromFS('./test/data/')

    const { reference } = await bee.uploadCollection(batch, directoryStructure, { indexDocument })

    const res = await request(app).get(`/bzz/${reference}`).redirects(1).expect(200)
    expect(res.headers['content-disposition']).toBe('inline; filename="1.txt"')
    expect((res.body as Buffer).toString('utf8')).toBe('1abcd\n')
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
    expect((res.body as Buffer).toString('utf8')).toBe('3\n')
  })

  it('with authorization enabled should return 403 & Forbidden', async () => {
    const res = await request(appAuth).get(`/bzz/reference/whatever`).expect(403)

    expect(res.text).toEqual('Forbidden')
  })
})

describe('POST /chunks', () => {
  it('should store and retrieve chunk', async () => {
    const batch = getPostageBatch()
    const payload = new Uint8Array([1, 2, 3])
    // span is the payload length encoded as uint64 little endian
    const span = new Uint8Array([payload.length, 0, 0, 0, 0, 0, 0, 0])
    const data = new Uint8Array([...span, ...payload])
    // the hash is hardcoded because we would need the bmt hasher otherwise
    const hash = 'ca6357a08e317d15ec560fef34e4c45f8f19f01c372aa70f1da72bfa7f1a4338'

    const reference = await beeProxy.uploadChunk(batch, data)
    expect(reference).toEqual(hash)

    const downloadedData = await bee.downloadChunk(reference)
    expect(downloadedData).toEqual(data)
  })

  it('should store and retrieve chunk with environment defined postage stamp', async () => {
    const batch = '0000000000000000000000000000000000000000000000000000000000000000'
    const payload = new Uint8Array([1, 2, 3, 4, 5])
    // span is the payload length encoded as uint64 little endian
    const span = new Uint8Array([payload.length, 0, 0, 0, 0, 0, 0, 0])
    const data = new Uint8Array([...span, ...payload])
    // the hash is hardcoded because we would need the bmt hasher otherwise
    const hash = '5094b636d1282c3ef22363ca816684edd843784b3d9f4d1a94c044c09919d335'

    const reference = await beeWithStamp.uploadChunk(batch, data)
    expect(reference).toEqual(hash)

    const downloadedData = await bee.downloadChunk(reference)
    expect(downloadedData).toEqual(data)
  })
})

describe('GET /chunks/:reference/', () => {
  it('should retrieve chunk from the proxy', async () => {
    const batch = getPostageBatch()
    const payload = new Uint8Array([1, 2, 3])
    // span is the payload length encoded as uint64 little endian
    const span = new Uint8Array([payload.length, 0, 0, 0, 0, 0, 0, 0])
    const data = new Uint8Array([...span, ...payload])
    // the hash is hardcoded because we would need the bmt hasher otherwise
    const hash = 'ca6357a08e317d15ec560fef34e4c45f8f19f01c372aa70f1da72bfa7f1a4338'

    const reference = await bee.uploadChunk(batch, data)
    expect(reference).toEqual(hash)

    const downloadedData = await beeProxy.downloadChunk(reference)
    expect(downloadedData).toEqual(data)
  })

  it('with authorization enabled should return 403 & Forbidden', async () => {
    const res = await request(appAuth).get(`/bytes/reference/`).expect(403)

    expect(res.text).toEqual('Forbidden')
  })
})

describe('POST /feeds/:owner/:topic', () => {
  test('should create and update feed with environment defined postage stamp', async () => {
    const signer = '0x634fb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd'
    const topic = '0000000000000000000000000000000000000000000000000000000000000000'
    const batch = getPostageBatch()
    const batchFake = '0000000000000000000000000000000000000000000000000000000000000000'

    const d1 = await bee.uploadData(batch, 'hello world!')

    const writer = beeWithStamp.makeFeedWriter('sequence', topic, signer)
    await writer.upload(batchFake, d1.reference)

    const reader = bee.makeFeedReader('sequence', topic, writer.owner)
    const dd1 = await reader.download()

    expect(parseInt(dd1.feedIndex as string, 16)).toBeGreaterThanOrEqual(0)
    expect(parseInt(dd1.feedIndexNext, 16)).toBeGreaterThanOrEqual(1)
    expect(parseInt(dd1.feedIndex as string, 16) + 1).toEqual(parseInt(dd1.feedIndexNext, 16))
  }, 10000)
})

describe('GET /feeds/:owner/:topic', () => {
  test('should retrieve feed', async () => {
    const signer = '0x634fb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd'
    const topic = '0000000000000000000000000000000000000000000000000000000000000001'
    const batch = getPostageBatch()

    const d1 = await bee.uploadData(batch, 'hello from the other side!')

    const writer = bee.makeFeedWriter('sequence', topic, signer)
    await writer.upload(batch, d1.reference)

    const reader = beeProxy.makeFeedReader('sequence', topic, writer.owner)
    const dd1 = await reader.download()

    expect(parseInt(dd1.feedIndex as string, 16)).toBeGreaterThanOrEqual(0)
    expect(parseInt(dd1.feedIndexNext, 16)).toBeGreaterThanOrEqual(1)
    expect(parseInt(dd1.feedIndex as string, 16) + 1).toEqual(parseInt(dd1.feedIndexNext, 16))
  }, 10000)
})

describe('remove swarm-pin header', () => {
  POST_PROXY_ENDPOINTS.forEach(endpoint => {
    it(`should remove swarm-pin header on ${endpoint}`, async () => {
      const data = 'hello'

      const headers = {
        testheader: 'test header content',
        'swarm-pin': true,
      }
      const res = await request(headerProxy).post(endpoint).set(headers).send(data).expect(200)
      const resHeaders = JSON.parse(res.text)
      expect(resHeaders).toHaveProperty('testheader', headers.testheader)
      expect(resHeaders).not.toHaveProperty('swarm-pin')
    })
  })
})
