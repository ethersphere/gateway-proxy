import express from 'express'
import type { Server } from 'http'
import type { DebugPostageBatch, BatchId } from '@ethersphere/bee-js'
import { genRandomHex } from './utils'

export class StampDB {
  stamps: Record<BatchId, DebugPostageBatch> = {}

  get(batchID: BatchId): DebugPostageBatch {
    return this.stamps[batchID]
  }

  add(stamp: DebugPostageBatch): void {
    this.stamps[stamp.batchID] = stamp
  }

  toArray(): DebugPostageBatch[] {
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

  return new Promise(resolve => {
    const server = app.listen(() => {
      resolve(server)
    })
  })
}
