import { BatchId, NumberString, PostageBatch, Size, Utils } from '@ethersphere/bee-js'
import { Strings } from 'cafe-utility'
import express from 'express'
import type { Server } from 'http'

export class StampDB {
  stamps: Map<BatchId, PostageBatch> = new Map()

  get(batchID: BatchId): PostageBatch | undefined {
    return this.stamps.get(batchID)
  }

  add(stamp: PostageBatch): void {
    this.stamps.set(stamp.batchID, stamp)
  }

  toArray(): PostageBatch[] {
    return Object.values(this.stamps)
  }

  clear(): void {
    this.stamps.clear()
  }
}

export async function createStampMockServer(db: StampDB): Promise<Server> {
  const app = express()

  app.get('/stamps', (_req, res) => {
    res.send({ stamps: db.toArray() })
  })

  app.get('/stamps/:id', (req, res) => {
    res.send(db.get(new BatchId(req.params.id)))
  })

  app.post('/stamps/:amount/:depth', (req, res) => {
    const depth = Number(req.params.depth)
    const effectiveSize = Size.fromBytes(Utils.getStampEffectiveBytes(depth))
    const theoreticalSize = Size.fromBytes(Utils.getStampTheoreticalBytes(depth))
    const newStamp: PostageBatch = {
      batchID: new BatchId(Strings.randomHex(64)),
      utilization: 0,
      usable: false,
      label: 'label',
      depth,
      amount: req.params.amount as NumberString,
      bucketDepth: 0,
      blockNumber: 0,
      immutableFlag: false,
      duration: Utils.getStampDuration(req.params.amount, 24000),
      size: effectiveSize,
      remainingSize: effectiveSize,
      theoreticalSize,
      usage: 0,
      usageText: '0%',
    }
    db.add(newStamp)
    setTimeout(() => (newStamp.usable = true), 100)
    res.send({ batchID: newStamp.batchID })
  })

  app.patch('/stamps/topup/:batchId/:amount', (req, res) => {
    const stamp = db.get(new BatchId(req.params.batchId))

    if (!stamp) {
      res.status(404).send({ message: 'Stamp not found' })

      return
    }
    stamp.amount = (Number(stamp.amount) + Number(req.params.amount)).toString() as NumberString
    res.send({ batchID: stamp.batchID })
  })

  return new Promise(resolve => {
    const server = app.listen(() => {
      resolve(server)
    })
  })
}
