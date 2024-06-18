import { BatchId, Bee, PostageBatch } from '@ethersphere/bee-js'
import { System } from 'cafe-utility'
import type { Server } from 'http'
import { getStampsConfig } from '../src/config'
import { StampsManager, buyNewStamp, filterUsableStampsAutobuy, getUsage, topUpStamp } from '../src/stamps'
import { StampDB, createStampMockServer } from './stamps.mockserver'
import { genRandomHex } from './utils'

interface AddressInfo {
  address: string
  family: string
  port: number
}

let server: Server
let url: string
const db = new StampDB()
beforeAll(async () => {
  server = await createStampMockServer(db)
  const port = (server.address() as AddressInfo).port
  url = `http://localhost:${port}`
})

afterAll(async () => {
  await new Promise(resolve => server.close(resolve))
})

afterEach(() => {
  db.clear()
})

const defaultAmount = '414720000'
const defaultDepth = 20
const defaultTTL = Number(defaultAmount)
const defaultStamp: PostageBatch = {
  batchID: genRandomHex(64) as BatchId,
  utilization: 0,
  usable: true,
  label: 'label',
  depth: defaultDepth,
  amount: defaultAmount,
  bucketDepth: 16,
  blockNumber: 0,
  immutableFlag: false,
  exists: true,
  batchTTL: defaultTTL,
}

const buildStamp = (overwrites: Partial<PostageBatch>) => {
  const batchID = genRandomHex(64) as BatchId

  return {
    ...defaultStamp,
    batchID,
    ...overwrites,
  }
}

describe('postageStamp', () => {
  it('should return correct hardcoded single postage stamp', async () => {
    const stamp = '0000000000000000000000000000000000000000000000000000000000000000'
    const stampManager = new StampsManager()
    await stampManager.start(getStampsConfig({ POSTAGE_STAMP: stamp })!)
    expect(stampManager.postageStamp).toEqual(stamp)
  })

  it('should return existing stamp', async () => {
    const stamp = buildStamp({ utilization: 0 })
    db.add(stamp)
    const manager = new StampsManager()
    await manager.start(
      getStampsConfig({
        POSTAGE_DEPTH: defaultDepth.toString(),
        POSTAGE_AMOUNT: defaultAmount.toString(),
        POSTAGE_REFRESH_PERIOD: '200',
        BEE_API_URL: url,
      })!,
    )
    await System.sleepMillis(1_000)
    expect(db.toArray().length).toEqual(1)

    const batchId = manager.postageStamp
    expect(batchId).toBe(stamp.batchID)
    manager.stop()
    await System.sleepMillis(250) // Needed as there could be the wait for posage stamp usable process in progress
  })

  it('should start without any postage stamp and create new one', async () => {
    const manager = new StampsManager()
    await manager.start(
      getStampsConfig({
        POSTAGE_DEPTH: defaultDepth.toString(),
        POSTAGE_AMOUNT: defaultAmount.toString(),
        POSTAGE_REFRESH_PERIOD: '200',
        BEE_API_URL: url,
      })!,
    )
    await System.sleepMillis(1_000)
    expect(db.toArray().length).toEqual(1)

    expect(manager.postageStamp).toEqual(db.toArray()[0].batchID)
    manager.stop()
    await System.sleepMillis(250) // Needed as there could be the wait for posage stamp usable process in progress
  })

  it('should create additional stamp if existing is starting to get full', async () => {
    const stamp = buildStamp({ utilization: 14 })
    db.add(stamp)

    const manager = new StampsManager()
    await manager.start(
      getStampsConfig({
        POSTAGE_DEPTH: defaultDepth.toString(),
        POSTAGE_AMOUNT: defaultAmount.toString(),
        POSTAGE_REFRESH_PERIOD: '200',
        BEE_API_URL: url,
      })!,
    )

    await System.sleepMillis(1_000)

    expect(db.toArray().length).toEqual(2)
    expect(manager.postageStamp).toEqual(stamp.batchID)
    manager.stop()
    await System.sleepMillis(250) // Needed as there could be the wait for posage stamp usable process in progress
  })

  it('should create additional stamp if existing stamp usage increases', async () => {
    const stamp = buildStamp({ utilization: 5 })
    db.add(stamp)

    const manager = new StampsManager()
    await manager.start(
      getStampsConfig({
        POSTAGE_DEPTH: defaultDepth.toString(),
        POSTAGE_AMOUNT: defaultAmount.toString(),
        POSTAGE_REFRESH_PERIOD: '200',
        POSTAGE_USAGE_MAX: '0.8',
        BEE_API_URL: url,
      })!,
    )

    await System.sleepMillis(200)
    expect(db.toArray().length).toEqual(1)
    expect(manager.postageStamp).toEqual(stamp.batchID)

    stamp.utilization = 15
    await System.sleepMillis(500)

    expect(db.toArray().length).toEqual(2)
    expect(manager.postageStamp).not.toEqual(stamp.batchID)
    manager.stop()
    await System.sleepMillis(1500) // Needed as there could be the wait for posage stamp usable process in progress
  })
})

describe('getUsage', () => {
  const stamps = [
    { stamp: buildStamp({ depth: 20, utilization: 4, bucketDepth: 16 }), usage: 0.25 },
    { stamp: buildStamp({ depth: 20, utilization: 8, bucketDepth: 16 }), usage: 0.5 },
    { stamp: buildStamp({ depth: 20, utilization: 12, bucketDepth: 16 }), usage: 0.75 },
    { stamp: buildStamp({ depth: 20, utilization: 14, bucketDepth: 16 }), usage: 0.875 },
    { stamp: buildStamp({ depth: 20, utilization: 15, bucketDepth: 16 }), usage: 0.9375 },
    { stamp: buildStamp({ depth: 20, utilization: 16, bucketDepth: 16 }), usage: 1 },
    { stamp: buildStamp({ depth: 17, utilization: 2, bucketDepth: 16 }), usage: 1 },
    { stamp: buildStamp({ depth: 17, utilization: 1, bucketDepth: 16 }), usage: 0.5 },
    { stamp: buildStamp({ depth: 18, utilization: 4, bucketDepth: 16 }), usage: 1 },
    { stamp: buildStamp({ depth: 18, utilization: 3, bucketDepth: 16 }), usage: 0.75 },
    { stamp: buildStamp({ depth: 18, utilization: 2, bucketDepth: 16 }), usage: 0.5 },
    { stamp: buildStamp({ depth: 18, utilization: 1, bucketDepth: 16 }), usage: 0.25 },
  ]

  stamps.forEach(({ stamp, usage }) =>
    it(`should return usage ${usage} for depth: ${stamp.depth} utilization: ${stamp.utilization} bucketDepth: ${stamp.bucketDepth}`, async () => {
      expect(getUsage(stamp)).toEqual(usage)
    }),
  )
})

describe('buyNewStamp', () => {
  it('should buy correct stamp and await for it to be usable', async () => {
    const bee = new Bee(url)
    const stampId = await buyNewStamp(defaultDepth, defaultAmount, new Bee(url))
    const stamp = await bee.getPostageBatch(stampId.batchId)

    const [stampFromDb] = db.toArray()
    expect(stamp).toEqual(stampFromDb)
  })
})

describe('filterUsableStamps', () => {
  it('should return empty arry if there are no stamps', async () => {
    const res = filterUsableStampsAutobuy([], 20, '1000', 0.7, 1_000)
    expect(res).toEqual(expect.arrayContaining([]))
  })

  it('should return only usable stamps sorted by usage', async () => {
    const goodStamps = [
      buildStamp({ utilization: 4 }),
      buildStamp({ utilization: 6 }),
      buildStamp({ utilization: 8 }),
      buildStamp({ utilization: 12 }),
      buildStamp({ utilization: 13 }),
    ]

    const allStamps = [buildStamp({ utilization: 15 }), ...goodStamps, buildStamp({ utilization: 16 })]

    const res = filterUsableStampsAutobuy(allStamps, defaultDepth, defaultAmount, 0.9, 1_000)
    expect(res).toEqual(expect.arrayContaining(goodStamps))
    for (let i = 1; i < res.length; i++) expect(getUsage(res[i - 1])).toBeGreaterThanOrEqual(getUsage(res[i]))
  })

  it('should return only usable stamps eliminating the ones with low TTL', async () => {
    const goodStamps = [
      buildStamp({ utilization: 7, batchTTL: 200_000 }),
      buildStamp({ utilization: 6, batchTTL: 110_000 }),
      buildStamp({ utilization: 9, batchTTL: 105_000 }),
    ]

    const allStamps = [
      buildStamp({ utilization: 4, batchTTL: 50_000 }),
      ...goodStamps,
      buildStamp({ utilization: 12, batchTTL: 40_000 }),
      buildStamp({ utilization: 14, batchTTL: 50_000 }),
    ]

    const res = filterUsableStampsAutobuy(allStamps, defaultDepth, defaultAmount, 0.9, 100_000)
    expect(res).toEqual(expect.arrayContaining(goodStamps))
    for (let i = 1; i < res.length; i++) expect(getUsage(res[i - 1])).toBeGreaterThanOrEqual(getUsage(res[i]))
  })
})

describe('topUpStamp', () => {
  it('should extend stamp stamp and await for it to extend others', async () => {
    const bee = new Bee(url)
    const stamp = await buyNewStamp(defaultDepth, defaultAmount, bee)
    const extendAmount = '100'

    await topUpStamp(bee, stamp.batchId, extendAmount)
    const stampExtended = await bee.getPostageBatch(stamp.batchId)
    expect(Number(stampExtended.amount)).toBeGreaterThan(Number(defaultAmount))
  })
})
