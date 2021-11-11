import express from 'express'
import type { Server } from 'http'
import type { DebugPostageBatch, BatchId } from '@ethersphere/bee-js'
import { genRandomHex } from './utils'

export type Stamps = Record<string, DebugPostageBatch>

export async function createStampMockServer(): Promise<{ server: Server; stamps: Stamps }> {
  const app = express()
  const stamps: Record<string, DebugPostageBatch> = {}

  app.get('/stamps', (req, res) => {
    res.send({ stamps: Object.values(stamps) })
  })

  app.get('/stamps/:id', (req, res) => {
    res.send(JSON.stringify(stamps[req.params.id]))
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
    stamps[newStamp.batchID] = newStamp
    res.send(newStamp.batchID)
  })

  return new Promise(resolve => {
    const server = app.listen(() => {
      resolve({ server, stamps })
    })
  })
}
