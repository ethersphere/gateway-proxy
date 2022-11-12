import type { Server } from 'http'
import { BeeDebug, BatchId, PostageBatch } from '@ethersphere/bee-js'
import { buyNewStamp, getUsage, sleep } from '../src/utils'
import { getStampsConfig, StampsConfig, StampsConfigAutobuy, StampsConfigExtends, StampsConfigHardcoded } from '../src/config'
import { createStampMockServer, StampDB } from './stamps.mockserver'
import { genRandomHex } from './utils'
import {
  extendsCapacity,
  ExtendsStampManager,
  filterUsableStampsExtendsCapacity,
  filterUsableStampsExtendsTTL,
  topUpStamp,
} from '../src/stamps/extends'
import { AutoBuyStampsManager, filterUsableStampsAutobuy } from '../src/stamps/autobuy'
import { HardcodedStampsManager } from '../src/stamps'

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

const defaultAmount = '1000000'
const defaultDepth = 20
const defaultTTL = Number(defaultAmount)
const defaultUsageThreshold = 0.7
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
    const config = getStampsConfig({ POSTAGE_STAMP: stamp })! as StampsConfigHardcoded
    const stampManager = new HardcodedStampsManager(config)
    expect(stampManager.postageStamp()).toEqual(stamp)
  })

  it('should return existing stamp', async () => {
    const stamp = buildStamp({ utilization: 0 })
    db.add(stamp)
    const stampConfig = getStampsConfig({
      POSTAGE_DEPTH: defaultDepth.toString(),
      POSTAGE_AMOUNT: defaultAmount.toString(),
      POSTAGE_REFRESH_PERIOD: '200',
      BEE_DEBUG_API_URL: url,
    }) as StampsConfigAutobuy
    const manager = new AutoBuyStampsManager(stampConfig)

    await sleep(1_000)
    expect(db.toArray().length).toEqual(1)

    const batchId = manager.postageStamp()
    expect(batchId).toBe(stamp.batchID)
    manager.stop()
    await sleep(250) // Needed as there could be the wait for posage stamp usable process in progress
  })

  it('should start without any postage stamp and create new one', async () => {
    const stampConfig = getStampsConfig({
      POSTAGE_DEPTH: defaultDepth.toString(),
      POSTAGE_AMOUNT: defaultAmount.toString(),
      POSTAGE_REFRESH_PERIOD: '200',
      BEE_DEBUG_API_URL: url,
    }) as StampsConfigAutobuy
    const manager = new AutoBuyStampsManager(stampConfig)

    await sleep(4_000)
    expect(db.toArray().length).toEqual(1)

    const batchId = manager.postageStamp()
    expect(batchId).toEqual(db.toArray()[0].batchID)
    manager.stop()
    await sleep(250) // Needed as there could be the wait for posage stamp usable process in progress
  })

  it('should create additional stamp if existing is starting to get full', async () => {
    const stamp = buildStamp({ utilization: 14 })
    db.add(stamp)
    const stampConfig = getStampsConfig({
      POSTAGE_DEPTH: defaultDepth.toString(),
      POSTAGE_AMOUNT: defaultAmount.toString(),
      POSTAGE_REFRESH_PERIOD: '200',
      BEE_DEBUG_API_URL: url,
    }) as StampsConfigAutobuy

    const manager = new AutoBuyStampsManager(stampConfig)

    await sleep(1_000)

    expect(db.toArray().length).toEqual(2)
    expect(manager.postageStamp()).toEqual(stamp.batchID)
    manager.stop()
    await sleep(250) // Needed as there could be the wait for posage stamp usable process in progress
  })

  it('should create additional stamp if existing stamp usage increases', async () => {
    const stamp = buildStamp({ utilization: 5 })
    db.add(stamp)
    const stampConfig = getStampsConfig({
      POSTAGE_DEPTH: defaultDepth.toString(),
      POSTAGE_AMOUNT: defaultAmount.toString(),
      POSTAGE_REFRESH_PERIOD: '200',
      POSTAGE_USAGE_MAX: '0.8',
      BEE_DEBUG_API_URL: url,
    }) as StampsConfigAutobuy

    const manager = new AutoBuyStampsManager(stampConfig)

    await sleep(200)
    expect(db.toArray().length).toEqual(1)
    expect(manager.postageStamp()).toEqual(stamp.batchID)

    stamp.utilization = 15
    await sleep(500)

    expect(db.toArray().length).toEqual(2)
    expect(manager.postageStamp()).not.toEqual(stamp.batchID)
    manager.stop()
    await sleep(1500) // Needed as there could be the wait for posage stamp usable process in progress
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
    const beeDebug = new BeeDebug(url)
    const stampId = await buyNewStamp(defaultDepth, defaultAmount, new BeeDebug(url))
    const stamp = await beeDebug.getPostageBatch(stampId.batchId)

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

describe('extendsStampsTTL', () => {
  let stampsConfig: StampsConfig

  beforeEach(() => {
    stampsConfig = getStampsConfig({
      POSTAGE_DEPTH: defaultDepth.toString(),
      POSTAGE_AMOUNT: defaultAmount.toString(),
      POSTAGE_TTL_MIN: defaultTTL.toString(),
      POSTAGE_USAGE_THRESHOLD: defaultUsageThreshold.toString(),
      POSTAGE_REFRESH_PERIOD: '200',
      POSTAGE_EXTENDSTTL: 'true',
      BEE_DEBUG_API_URL: url,
    }) as StampsConfig
  })

  it('should not find any usable stamps', async () => {
    const stamps = [
      buildStamp({ utilization: 7, batchTTL: 200_000, usable: false }),
      buildStamp({ utilization: 8, batchTTL: 150_000, usable: false }),
      buildStamp({ utilization: 10, batchTTL: 120_000, usable: false }),
    ]

    const { ttlMin, refreshPeriod } = stampsConfig as StampsConfigExtends
    const minTimeThreshold = ttlMin + refreshPeriod / 1000
    const usableStampsSortByTTL = filterUsableStampsExtendsTTL(stamps)
    const res = usableStampsSortByTTL.filter(s => s.batchTTL < minTimeThreshold)
    expect(0).toEqual(res.length)
  })

  it('should extend stamp ttl and await for it to extend others', async () => {
    const beeDebug = new BeeDebug(url)
    const stampId = await buyNewStamp(defaultDepth, defaultAmount, beeDebug)
    const extendAmount = '100'

    await topUpStamp(beeDebug, stampId.batchId, extendAmount)
    const stampExtended = await beeDebug.getPostageBatch(stampId.batchId)
    expect(Number(stampExtended.amount)).toBeGreaterThan(Number(defaultAmount))
  })
})

describe('extendsStampsCapacity', () => {
  let stampsConfig: StampsConfig

  beforeEach(() => {
    stampsConfig = getStampsConfig({
      POSTAGE_USAGE_THRESHOLD: defaultUsageThreshold.toString(),
      POSTAGE_EXTENDS_CAPACITY: 'true',
      BEE_DEBUG_API_URL: url,
    }) as StampsConfig
  })
  it('should not find any usable stamps', async () => {
    const stamps = [
      buildStamp({ utilization: 14, depth: 20, bucketDepth: 16, usable: false }),
      buildStamp({ utilization: 8, depth: 20, bucketDepth: 16, usable: true }),
      buildStamp({ utilization: 10, depth: 20, bucketDepth: 16, usable: true }),
    ]
    const res = filterUsableStampsExtendsCapacity(stamps, defaultUsageThreshold)
    expect(0).toEqual(res.length)
  })

  it('should extend stamps capacity', async () => {
    const extendManager = new ExtendsStampManager(stampsConfig as StampsConfigExtends)
    const beeDebug = new BeeDebug(url)

    const stampId = await buyNewStamp(defaultDepth, defaultAmount, beeDebug)

    await extendsCapacity(extendManager, beeDebug, stampId.stamp)
    await sleep(1_000)
    const stampExtended = await beeDebug.getPostageBatch(stampId.batchId)
    expect(stampExtended.depth).toBeGreaterThan(defaultDepth)
    extendManager.stop()
    await sleep(250) // Needed as there could be the wait for posage stamp usable process in progress
  })
})
