import { BeeDebug, PostageBatch } from '@ethersphere/bee-js'
import client from 'prom-client'
import { logger } from '../logger'
import { register } from '../metrics'
import { settings } from '../settings/settings-singleton'

export async function buyStamp(depth: number, amount: string): Promise<PostageBatch> {
  logger.info(`Buying new postage stamp with depth ${depth} and amount ${amount}`)
  const beeDebug = new BeeDebug(settings.bee.debugApi)
  const batchId = await beeDebug.createPostageBatch(amount, depth, { waitForUsable: true })
  const stamp = await beeDebug.getPostageBatch(batchId)
  purchaseCounter.inc()
  logger.info(`Bought new postage stamp with depth ${depth} and amount ${amount}`)

  return stamp
}

export async function diluteStamp(id: string, depth: number): Promise<PostageBatch> {
  logger.info(`Diluting postage stamp with id ${id} and depth ${depth}`)
  const beeDebug = new BeeDebug(settings.bee.debugApi)
  await beeDebug.diluteBatch(id, depth)
  const stamp = await beeDebug.getPostageBatch(id)
  diluteCounter.inc()
  logger.info(`Diluted postage stamp with id ${id} and depth ${depth}`)

  return stamp
}

export async function topupStamp(id: string, amount: string): Promise<PostageBatch> {
  logger.info(`Topping up postage stamp with id ${id} and amount ${amount}`)
  const beeDebug = new BeeDebug(settings.bee.debugApi)
  await beeDebug.topUpBatch(id, amount)
  const stamp = await beeDebug.getPostageBatch(id)
  topupCounter.inc()
  logger.info(`Topped up postage stamp with id ${id} and amount ${amount}`)

  return stamp
}

const purchaseCounter = new client.Counter({
  name: 'stamp_purchase_counter',
  help: 'How many stamps were purchased',
})
register.registerMetric(purchaseCounter)

const topupCounter = new client.Counter({
  name: 'stamp_topup_counter',
  help: 'How many topup operations were performed',
})
register.registerMetric(topupCounter)

const diluteCounter = new client.Counter({
  name: 'stamp_dilute_counter',
  help: 'How many dilute operations were performed',
})
register.registerMetric(diluteCounter)
