import { BeeDebug, PostageBatch } from '@ethersphere/bee-js'
import { settings } from '../settings/settings-singleton'

export async function getUsableStamps(): Promise<PostageBatch[]> {
  const beeDebug = new BeeDebug(settings.bee.debugApi)
  const stamps = await beeDebug.getAllPostageBatch()

  return stamps.filter(stamp => stamp.usable).sort((a, b) => (a.batchTTL > b.batchTTL ? 1 : -1))
}

export async function getExpiringStamps(): Promise<PostageBatch[]> {
  const stamps = await getUsableStamps()
  return stamps.filter(x => x.batchTTL <= settings.stamp.autoextend.ttlThreshold)
}

export async function getNearlyFullStamps(): Promise<PostageBatch[]> {
  const stamps = await getUsableStamps()
  return stamps.filter(x => getUsage(x) >= settings.stamp.autoextend.usageThreshold)
}

export function getUsage({ utilization, depth, bucketDepth }: PostageBatch): number {
  return utilization / Math.pow(2, depth - bucketDepth)
}
