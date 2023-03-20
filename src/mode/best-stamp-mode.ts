import { BeeDebug, PostageBatch } from '@ethersphere/bee-js'
import { logger } from '../logger'
import { getUsage } from '../stamps'

export const BestStampMode = {
  refreshStamps: async (beeDebug: BeeDebug): Promise<string | undefined> => {
    try {
      logger.info('checking postage stamps')
      const stamps = await beeDebug.getAllPostageBatch()
      logger.debug('retrieved stamps', stamps)

      return getBestUsableStamp(stamps)
    } catch {
      logger.error('failed to retrieve postage stamps')

      return undefined
    }
  },
}

function getBestUsableStamp(stamps: PostageBatch[], maxUsage = 0.9): string | undefined {
  const options = stamps
    .filter(stamp => stamp.usable)
    .filter(stamp => getUsage(stamp) < maxUsage)
    .sort((a, b) => (a.batchTTL > b.batchTTL ? 1 : -1))

  return options.length ? options[0].batchID : undefined
}
