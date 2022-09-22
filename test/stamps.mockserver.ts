import express from 'express'
import type { Server } from 'http'
import type { PostageBatch, BatchId } from '@ethersphere/bee-js'
import { genRandomHex } from './utils'

export class StampDB {
  stamps: Record<BatchId, PostageBatch> = {}

  get(batchID: BatchId): PostageBatch {
    return this.stamps[batchID]
  }

  add(stamp: PostageBatch): void {
    this.stamps[stamp.batchID] = stamp
  }

  toArray(): PostageBatch[] {
    return Object.values(this.stamps)
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
    res.send(db.get(req.params.id as BatchId))
  })

  app.post('/stamps/:amount/:depth', (req, res) => {
    const newStamp = {
      batchID: genRandomHex(64) as BatchId,
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
    }
    db.add(newStamp)
    setTimeout(() => (newStamp.usable = true), 100)
    res.send({ batchID: newStamp.batchID })
  })

  app.patch('/stamps/topup/:batchId/:amount', (req, res) => {
    const stamp = db.get(req.params.batchId as BatchId)
    stamp.amount = (Number(stamp.amount) + Number(req.params.amount)).toString()
    res.send({ batchID: stamp.batchID })
  })

  return new Promise(resolve => {
    const server = app.listen(() => {
      resolve(server)
    })
  })
}
