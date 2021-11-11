import type { Server } from 'http'
import { BeeDebug, DebugPostageBatch, BatchId } from '@ethersphere/bee-js'
import { StampsManager, checkExistingPostageStamps } from '../src/stamps'
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
  utilization: 0.5,
  usable: false,
  label: 'label',
  depth: defaultDepth,
  amount: defaultAmount,
  bucketDepth: 0,
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
    db.add(buildStamp({ utilization: 0.5 }))
    db.add(buildStamp({ utilization: 0.81 }))
    db.add(buildStamp({ utilization: 0.96 }))
    db.add(buildStamp({ utilization: 1 }))
    db.add(buildStamp({ utilization: 0.74 }))
    db.add(buildStamp({ utilization: 0.05 }))

    const res = await checkExistingPostageStamps(defaultDepth, defaultAmount, 0.95, 1_000, new BeeDebug(url))
    expect(res?.utilization).toEqual(0.81)
  })

  it('should return most utilised stamp eliminating with low TTL', async () => {
    db.add(buildStamp({ utilization: 0.5, batchTTL: 50_000 }))
    db.add(buildStamp({ utilization: 0.05, batchTTL: 110_000 }))
    db.add(buildStamp({ utilization: 0.81, batchTTL: 40_000 }))
    db.add(buildStamp({ utilization: 0.74, batchTTL: 50_000 }))

    const res = await checkExistingPostageStamps(defaultDepth, defaultAmount, 0.95, 100_000, new BeeDebug(url))
    expect(res?.utilization).toEqual(0.05)
    expect(res?.batchTTL).toEqual(110_000)
  })
})
