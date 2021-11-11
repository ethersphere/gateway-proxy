import type { Server } from 'http'
import { BeeDebug, DebugPostageBatch, BatchId } from '@ethersphere/bee-js'
import { StampsManager, checkExistingPostageStamps } from '../src/stamps'
import { createStampMockServer, Stamps } from './stamps.mockserver'
import { genRandomHex } from './utils'

interface AddressInfo {
  address: string
  family: string
  port: number
}

let server: Server
let url: string
let stamps: Stamps

beforeAll(async () => {
  const res = await createStampMockServer()
  server = res.server
  stamps = res.stamps
  const port = (server.address() as AddressInfo).port
  url = `http://localhost:${port}`
})

afterAll(async () => {
  await new Promise(resolve => server.close(resolve))
})

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
    const res = await checkExistingPostageStamps(20, '1000', 0.7, new BeeDebug(url))
    expect(res).toEqual(undefined)
  })

  it('should return most utilised stamp', async () => {
    const amount = '1000'
    const depth = 20
    const stamp1: DebugPostageBatch = {
      batchID: genRandomHex(64) as BatchId,
      utilization: 0.5,
      usable: false,
      label: 'label',
      depth,
      amount,
      bucketDepth: 0,
      blockNumber: 0,
      immutableFlag: false,
      exists: true,
      batchTTL: Number(amount),
    }
    const stamp2: DebugPostageBatch = { ...stamp1, batchID: genRandomHex(64) as BatchId, utilization: 0.75 }
    const stamp3: DebugPostageBatch = { ...stamp1, batchID: genRandomHex(64) as BatchId, utilization: 0.25 }
    stamps[stamp1.batchID] = stamp1
    stamps[stamp2.batchID] = stamp2
    stamps[stamp3.batchID] = stamp3
    const res = await checkExistingPostageStamps(depth, amount, 0.95, new BeeDebug(url))
    expect(res).toEqual(stamp2)

    delete stamps[stamp1.batchID]
    delete stamps[stamp2.batchID]
    delete stamps[stamp3.batchID]
  })

  it('should return most utilised stamp eliminating overutilized', async () => {
    const amount = '1000'
    const depth = 20
    const stamp1: DebugPostageBatch = {
      batchID: genRandomHex(64) as BatchId,
      utilization: 0.5,
      usable: false,
      label: 'label',
      depth,
      amount,
      bucketDepth: 0,
      blockNumber: 0,
      immutableFlag: false,
      exists: true,
      batchTTL: Number(amount),
    }
    const stamp2: DebugPostageBatch = { ...stamp1, batchID: genRandomHex(64) as BatchId, utilization: 0.81 }
    const stamp3: DebugPostageBatch = { ...stamp1, batchID: genRandomHex(64) as BatchId, utilization: 0.96 }
    stamps[stamp1.batchID] = stamp1
    stamps[stamp2.batchID] = stamp2
    stamps[stamp3.batchID] = stamp3
    const res = await checkExistingPostageStamps(depth, amount, 0.95, new BeeDebug(url))
    expect(res).toEqual(stamp2)

    delete stamps[stamp1.batchID]
    delete stamps[stamp2.batchID]
    delete stamps[stamp3.batchID]
  })
})
