import type { Server } from 'http'
import { BeeDebug, DebugPostageBatch, BatchId } from '@ethersphere/bee-js'
import { StampsManager, filterUsableStamps, getUsage, waitUntilStampUsable, buyNewStamp } from '../src/stamps'
import { sleep } from '../src/utils'
import { createStampMockServer, StampDB } from './stamps.mockserver'
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

const defaultAmount = '1000000'
const defaultDepth = 20
const defaultTTL = Number(defaultAmount)
const defaultStamp: DebugPostageBatch = {
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

const buildStamp = (overwrites: Partial<DebugPostageBatch>) => {
  const batchID = genRandomHex(64) as BatchId

  return {
    ...defaultStamp,
    batchID,
    ...overwrites,
  }
}

describe('StampsManager', () => {
  const throwValues = [
    { POSTAGE_AMOUNT: '1000' },
    { POSTAGE_DEPTH: '20' },
    { POSTAGE_AMOUNT: '1000', POSTAGE_DEPTH: '20' },
    { BEE_DEBUG_API_URL: 'http://localhost:1633', POSTAGE_DEPTH: '20' },
  ]

  throwValues.forEach(param =>
    it(`should throw constructor({${Object.keys(param)}})`, async () => {
      expect(() => new StampsManager(param)).toThrowError(
        'Please provide POSTAGE_DEPTH, POSTAGE_AMOUNT and BEE_DEBUG_API_URL environment variable',
      )
    }),
  )
})

describe('enabled', () => {
  it('should return false if no postage stamp is provided', async () => {
    expect(new StampsManager().enabled).toEqual(false)
  })

  it('should return true if hardcoded postage stamp is provided', async () => {
    const stamp = '0000000000000000000000000000000000000000000000000000000000000000'
    expect(new StampsManager({ POSTAGE_STAMP: stamp }).enabled).toEqual(true)
  })

  it('should return true if autobuy is enabled', async () => {
    const stamp = buildStamp({ utilization: 0 })
    db.add(stamp)
    const manager = new StampsManager(
      {
        POSTAGE_DEPTH: defaultDepth.toString(),
        POSTAGE_AMOUNT: defaultAmount.toString(),
      },
      url,
    )
    expect(manager.enabled).toEqual(true)
    manager.stop()
    await sleep(250) // Needed as there could be the wait for posage stamp usable process in progress
  })
})

describe('postageStamp', () => {
  it('should throw if no postage stamp is provided', async () => {
    expect(() => new StampsManager().postageStamp).toThrowError('No postage stamp')
  })

  it('should return correct hardcoded single postage stamp', async () => {
    const stamp = '0000000000000000000000000000000000000000000000000000000000000000'
    expect(new StampsManager({ POSTAGE_STAMP: stamp }).postageStamp).toEqual(stamp)
  })

  it('should return existing stamp', async () => {
    const stamp = buildStamp({ utilization: 0 })
    db.add(stamp)
    const manager = new StampsManager(
      {
        POSTAGE_DEPTH: defaultDepth.toString(),
        POSTAGE_AMOUNT: defaultAmount.toString(),
        POSTAGE_REFRESH_PERIOD: '200',
      },
      url,
    )
    await sleep(1_000)
    expect(db.toArray().length).toEqual(1)

    const batchId = manager.postageStamp
    expect(batchId).toBe(stamp.batchID)
    manager.stop()
    await sleep(250) // Needed as there could be the wait for posage stamp usable process in progress
  })

  it('should start without any postage stamp and create new one', async () => {
    const manager = new StampsManager(
      {
        POSTAGE_DEPTH: defaultDepth.toString(),
        POSTAGE_AMOUNT: defaultAmount.toString(),
        POSTAGE_REFRESH_PERIOD: '200',
      },
      url,
    )
    await sleep(1_000)
    expect(db.toArray().length).toEqual(1)

    expect(manager.enabled).toEqual(true)
    expect(manager.postageStamp).toEqual(db.toArray()[0].batchID)
    manager.stop()
    await sleep(250) // Needed as there could be the wait for posage stamp usable process in progress
  })

  it('should create additional stamp if existing is starting to get full', async () => {
    const stamp = buildStamp({ utilization: 14 })
    db.add(stamp)
    const manager = new StampsManager(
      {
        POSTAGE_DEPTH: defaultDepth.toString(),
        POSTAGE_AMOUNT: defaultAmount.toString(),
        POSTAGE_REFRESH_PERIOD: '200',
      },
      url,
    )

    await sleep(1_000)

    expect(db.toArray().length).toEqual(2)
    expect(manager.enabled).toEqual(true)
    expect(manager.postageStamp).toEqual(stamp.batchID)
    manager.stop()
    await sleep(250) // Needed as there could be the wait for posage stamp usable process in progress
  })

  it('should create additional stamp if existing stamp usage increases', async () => {
    const stamp = buildStamp({ utilization: 5 })
    db.add(stamp)
    const manager = new StampsManager(
      {
        POSTAGE_DEPTH: defaultDepth.toString(),
        POSTAGE_AMOUNT: defaultAmount.toString(),
        POSTAGE_REFRESH_PERIOD: '200',
        POSTAGE_USAGE_MAX: '0.8',
      },
      url,
    )

    await sleep(200)
    expect(db.toArray().length).toEqual(1)
    expect(manager.enabled).toEqual(true)
    expect(manager.postageStamp).toEqual(stamp.batchID)

    stamp.utilization = 15
    await sleep(500)

    expect(db.toArray().length).toEqual(2)
    expect(manager.enabled).toEqual(true)
    expect(manager.postageStamp).not.toEqual(stamp.batchID)
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
    let stamp: DebugPostageBatch | undefined = undefined
    buyNewStamp(defaultDepth, defaultAmount, new BeeDebug(url), 100).then(s => (stamp = s))

    await sleep(50) // need to wait a little bit as buying is async

    let [stampFromDb] = db.toArray()
    expect(db.toArray().length).toEqual(1)
    expect(stampFromDb.amount).toEqual(defaultAmount)
    expect(stampFromDb.depth).toEqual(defaultDepth)
    expect(stampFromDb.usable).toEqual(false)
    expect(stamp).toBeUndefined()

    stampFromDb.usable = true
    await sleep(150) // Need to wait at least one full refresh cycle (100 ms)

    expect(stamp).not.toBeUndefined()
    expect(stamp).toEqual(stampFromDb)
  })
})

describe('filterUsableStamps', () => {
  it('should return undefined if there are no stamps', async () => {
    const res = filterUsableStamps([], 20, '1000', 0.7, 1_000)
    expect(res).toEqual(expect.arrayContaining([]))
  })

  it('should return most utilised stamp', async () => {
    db.add(buildStamp({ utilization: 0.25 }))
    db.add(buildStamp({ utilization: 0.74 }))
    db.add(buildStamp({ utilization: 0.75 }))
    db.add(buildStamp({ utilization: 0.05 }))

    const res = filterUsableStamps(db.toArray(), defaultDepth, defaultAmount, 0.95, 1_000)
    expect(res).toEqual(expect.arrayContaining(db.toArray()))
  })

  it('should return most utilised stamp eliminating overutilized', async () => {
    const goodStamps = [
      buildStamp({ utilization: 4 }),
      buildStamp({ utilization: 6 }),
      buildStamp({ utilization: 8 }),
      buildStamp({ utilization: 12 }),
      buildStamp({ utilization: 13 }),
    ]

    const allStamps = [buildStamp({ utilization: 15 }), ...goodStamps, buildStamp({ utilization: 16 })]

    const res = filterUsableStamps(allStamps, defaultDepth, defaultAmount, 0.9, 1_000)
    expect(res).toEqual(expect.arrayContaining(goodStamps))
  })

  it('should return most utilised stamp eliminating with low TTL', async () => {
    const goodStamps = [buildStamp({ utilization: 6, batchTTL: 110_000 })]

    const allStamps = [
      buildStamp({ utilization: 4, batchTTL: 50_000 }),
      ...goodStamps,
      buildStamp({ utilization: 12, batchTTL: 40_000 }),
      buildStamp({ utilization: 14, batchTTL: 50_000 }),
    ]

    const res = filterUsableStamps(allStamps, defaultDepth, defaultAmount, 0.9, 100_000)
    expect(res).toEqual(expect.arrayContaining(goodStamps))
  })
})

describe('waitUntilStampUsable', () => {
  it('should wait until stamp is usable', async () => {
    const stamp = buildStamp({ usable: false })
    db.add(stamp)
    const timeStart = Date.now()

    setTimeout(() => (stamp.usable = true), 500)

    expect(db.get(stamp.batchID).usable).toEqual(false)
    await waitUntilStampUsable(stamp.batchID, new BeeDebug(url), 100)
    expect(db.get(stamp.batchID).usable).toEqual(true)

    const timeDiff = Date.now() - timeStart
    expect(timeDiff).toBeGreaterThan(500)
    expect(timeDiff).toBeLessThan(1000)
  })
})
