import type { Server } from 'http'
import { BeeDebug, DebugPostageBatch, BatchId } from '@ethersphere/bee-js'
import { StampsManager, checkExistingPostageStamps, getUsage } from '../src/stamps'
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

afterEach(() => db.clear())

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

describe('constructor', () => {
  const throwValues = [
    { POSTAGE_AMOUNT: '1000' },
    { POSTAGE_DEPTH: '20' },
    { POSTAGE_AMOUNT: '1000', POSTAGE_DEPTH: '20' },
    { BEE_DEBUG_API_URL: 'http://localhost:1633', POSTAGE_DEPTH: '20' },
  ]

  throwValues.forEach(
    param =>
      it(`should throw constructor({${Object.keys(param)}})`, async () => {
        expect(() => new StampsManager(param)).toThrowError(
          'Please provide POSTAGE_DEPTH, POSTAGE_AMOUNT and BEE_DEBUG_API_URL environment variable',
        )
      }),

    // it('should start and create postage stamp', async () => {
    //   const manager = new StampsManager({ POSTAGE_DEPTH: '20', POSTAGE_AMOUNT: '1000' }, url)
    //
    // }),
  )
})

describe('shouldReplaceStamp', () => {
  it('should return false if no postage stamp is provided', async () => {
    expect(new StampsManager().shouldReplaceStamp).toEqual(false)
  })

  it('should return true if postage stamp is provided', async () => {
    const stamp = '0000000000000000000000000000000000000000000000000000000000000000'
    expect(new StampsManager({ POSTAGE_STAMP: stamp }).shouldReplaceStamp).toEqual(true)
  })
})

describe('getPostageStamp', () => {
  it('should throw if no postage stamp is provided', async () => {
    expect(() => new StampsManager().getPostageStamp).toThrowError('No postage stamp')
  })

  it('should return correct postage stamp', async () => {
    const stamp = '0000000000000000000000000000000000000000000000000000000000000000'
    expect(new StampsManager({ POSTAGE_STAMP: stamp }).getPostageStamp).toEqual(stamp)
  })
})

describe('getUsage', () => {
  const stamps = [
    { stamp: buildStamp({ depth: 20, utilization: 4, bucketDepth: 16 }), usage: 0.25 },
    { stamp: buildStamp({ depth: 20, utilization: 8, bucketDepth: 16 }), usage: 0.5 },
    { stamp: buildStamp({ depth: 20, utilization: 12, bucketDepth: 16 }), usage: 0.75 },
    { stamp: buildStamp({ depth: 20, utilization: 15, bucketDepth: 16 }), usage: 0.9375 },
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

describe('checkExistingPostageStamps', () => {
  it('should return undefined if there are no stamps', async () => {
    const res = await checkExistingPostageStamps(20, '1000', 0.7, 1_000, new BeeDebug(url))
    expect(res).toEqual(undefined)
  })

  it('should return most utilised stamp', async () => {
    db.add(buildStamp({ utilization: 0.25 }))
    db.add(buildStamp({ utilization: 0.74 }))
    db.add(buildStamp({ utilization: 0.75 }))
    db.add(buildStamp({ utilization: 0.05 }))

    const res = await checkExistingPostageStamps(defaultDepth, defaultAmount, 0.95, 1_000, new BeeDebug(url))
    expect(res?.utilization).toEqual(0.75)
  })

  it('should return most utilised stamp eliminating overutilized', async () => {
    db.add(buildStamp({ utilization: 4 }))
    db.add(buildStamp({ utilization: 8 }))
    db.add(buildStamp({ utilization: 14 }))
    db.add(buildStamp({ utilization: 12 }))
    db.add(buildStamp({ utilization: 16 }))
    db.add(buildStamp({ utilization: 15 }))

    const res = await checkExistingPostageStamps(defaultDepth, defaultAmount, 0.9, 1_000, new BeeDebug(url))
    expect(res?.utilization).toEqual(14)
  })

  it('should return most utilised stamp eliminating with low TTL', async () => {
    db.add(buildStamp({ utilization: 4, batchTTL: 50_000 }))
    db.add(buildStamp({ utilization: 6, batchTTL: 110_000 }))
    db.add(buildStamp({ utilization: 12, batchTTL: 40_000 }))
    db.add(buildStamp({ utilization: 10, batchTTL: 50_000 }))

    const res = await checkExistingPostageStamps(defaultDepth, defaultAmount, 0.9, 100_000, new BeeDebug(url))
    expect(res?.utilization).toEqual(6)
    expect(res?.batchTTL).toEqual(110_000)
  })
})
