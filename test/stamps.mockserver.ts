import { BatchId, NumberString, PostageBatch } from '@ethersphere/bee-js'
import { Strings } from 'cafe-utility'
import express from 'express'
import type { Server } from 'http'
import { mapPostageBatch, RawPostageBatch, unmapPostageBatch } from './utils'

export class StampDB {
  stamps: Record<string, PostageBatch> = {}

  get(batchID: BatchId): RawPostageBatch {
    return unmapPostageBatch(this.stamps[batchID.toHex()])
  }

  add(stamp: PostageBatch): void {
    this.stamps[stamp.batchID.toHex()] = stamp
  }

  toArray(): RawPostageBatch[] {
    return Object.values(this.stamps).map(x => unmapPostageBatch(x))
  }

  clear(): void {
    this.stamps = {}
  }
}

export async function createStampMockServer(db: StampDB): Promise<Server> {
  const app = express()

  app.get('/stamps', (req, res) => {
    res.send({ stamps: db.toArray() })
  })

  app.get('/stamps/:id', (req, res) => {
    res.send(db.get(new BatchId(req.params.id)))
  })

  app.get('/chainstate', (req, res) => {
    res.send({
      chainTip: 44197704,
      block: 44197695,
      totalAmount: '519339258398',
      currentPrice: '24000',
    })
  })

  app.post('/stamps/:amount/:depth', (req, res) => {
    const newStamp = mapPostageBatch({
      batchID: Strings.randomHex(64),
      utilization: 0,
      usable: false,
      label: 'label',
      depth: Number(req.params.depth),
      amount: req.params.amount,
      bucketDepth: 0,
      blockNumber: 0,
      immutableFlag: false,
      exists: true,
      batchTTL: Number(req.params.amount),
    })
    db.add(newStamp)
    setTimeout(() => (newStamp.usable = true), 100)
    res.send({ batchID: newStamp.batchID })
  })

  app.patch('/stamps/topup/:batchId/:amount', (req, res) => {
    const stamp = db.get(new BatchId(req.params.batchId))
    stamp.amount = (Number(stamp.amount) + Number(req.params.amount)).toString() as NumberString
    res.send({ batchID: stamp.batchID })
  })

  return new Promise(resolve => {
    const server = app.listen(() => {
      resolve(server)
    })
  })
}
