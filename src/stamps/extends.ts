import { BeeDebug, PostageBatch } from '@ethersphere/bee-js'
import { StampsConfigExtends } from '../config'
import { buyNewStamp, getUsage } from '../utils'
import { logger } from '../logger'
import { stampCheckCounter } from './counters'
import { BaseStampManager, StampsManager } from './base'

/**
 * Filter the stamps and only return those that are usable and sort by from closer to farer expire TTL
 *
 * @param stamps Postage stamps to be filtered
 *
 * @returns Filtered stamps soltered by usage
 */
export function filterUsableStampsExtendsTTL(stamps: PostageBatch[]): PostageBatch[] {
  const usableStamps = stamps
    // filter to get stamps that have the right depth, amount and are not fully used or expired
    .filter(s => s.usable)
    // sort the stamps by usage
    .sort((a, b) => (a.batchTTL > b.batchTTL ? 1 : -1))

  // return the all usable stamp sorted by usage
  return usableStamps
}

/**
 * Filter the stamps and only return those that are usable and sort by usage in a increasing order
 *
 * @param stamps Postage stamps to be filtered
 *
 * @returns Filtered stamps soltered by usage
 */
export function filterUsableStampsExtendsCapacity(stamps: PostageBatch[], usageThreshold: number): PostageBatch[] {
  if (usageThreshold > 0) {
    const usableStamps = stamps
      // filter to get stamps that have been used over the usageThreshold set
      .filter(s => s.usable && getUsage(s) > usageThreshold)
      // sort the stamps by usage
      .sort((a, b) => (getUsage(a) < getUsage(b) ? 1 : -1))

    // return the all usable stamp sorted by usage
    return usableStamps
  }

  return []
}

export async function topUpStamp(beeDebug: BeeDebug, postageBatchId: string, amount: string): Promise<PostageBatch> {
  await beeDebug.topUpBatch(postageBatchId, amount)
  const stamp = await beeDebug.getPostageBatch(postageBatchId)

  return stamp
}

export async function extendsCapacity(extendManager: ExtendsStampManager, beeDebug: BeeDebug, stamp: PostageBatch) {
  const stampRes = await topUpStamp(beeDebug, stamp.batchID, BigInt(stamp.amount).toString())
  setTimeout(() => extendManager.completeTopUp('capacity', stampRes), 60000)
  await beeDebug.diluteBatch(stamp.batchID, stamp.depth + 1)
  logger.info(`capacity extended for stamp ${stamp.batchID}`)
}

export class ExtendsStampManager extends BaseStampManager implements StampsManager {
  private isBuyingStamp?: boolean = false
  private topingUpStamps: string[] = []

  constructor(config: StampsConfigExtends) {
    super()
    // Autobuy mode
    const refreshStamps = async () => this.refreshStamps(config, new BeeDebug(config.beeDebugApiUrl))
    this.start(config, refreshStamps)
  }

  completeTopUp(extendsTypeFeature: 'ttl' | 'capacity', stamp: PostageBatch) {
    if (extendsTypeFeature === 'ttl') {
      logger.info('successfully postage stamp TTL extended', { stamp })
    } else {
      logger.info('successfully postage stamp capacity extended', { stamp })
    }
    // remove stamps from extending stamps array
    const stampIndex = this.topingUpStamps.findIndex(id => stamp.batchID === id)
    this.topingUpStamps.splice(stampIndex, 1)
  }

  async verifyUsableStamps(beeDebug: BeeDebug, ttlMin: number, amount: string) {
    for (const stamp of this.usableStamps!) {
      if (!this.topingUpStamps.includes(stamp.batchID) && amount !== '0') {
        this.topingUpStamps.push(stamp.batchID)
        logger.info(`extending postage stamp TTL ${stamp.batchID}`)

        try {
          const stampRes = await topUpStamp(beeDebug, stamp.batchID, amount)

          setTimeout(() => this.completeTopUp('ttl', stampRes), 60000)
        } catch (e: any) {
          // error that indicate that 2 stamps are trying to be extended at the same time. Comes out as a warning
          const errorStampIndex = this.topingUpStamps.indexOf(stamp.batchID)
          this.topingUpStamps.splice(errorStampIndex, 1)
          logger.error('failed to topup postage stamp', e)
        }
      }
    }
  }

  private async refreshStamps(config: StampsConfigExtends, beeDebug: BeeDebug): Promise<void> {
    stampCheckCounter.inc()
    logger.info('checking postage stamps')

    const stamps = await beeDebug.getAllPostageBatch()

    const { depth, amount, ttlMin, refreshPeriod, usageThreshold, enableTtl, enableCapacity } = config

    // Get all usable stamps sorted by usage from most used to least
    if (!this.isBuyingStamp && enableTtl) {
      const usableStampsSortByTTL = filterUsableStampsExtendsTTL(stamps)

      if (usableStampsSortByTTL.length === 0) {
        this.isBuyingStamp = true
        try {
          const { stamp: newStamp } = await buyNewStamp(depth, amount, beeDebug)

          // Add the bought postage stamp
          usableStampsSortByTTL.push(newStamp)
        } finally {
          this.isBuyingStamp = false
        }
      } else {
        const minTimeThreshold = ttlMin + refreshPeriod / 1000
        this.usableStamps = usableStampsSortByTTL.filter(s => s.batchTTL < minTimeThreshold)
        await this.verifyUsableStamps(beeDebug, ttlMin, amount)
      }
    }

    if (enableCapacity) {
      const usableStampsExtendsCapacity = filterUsableStampsExtendsCapacity(stamps, usageThreshold)

      for (const stamp of usableStampsExtendsCapacity) {
        try {
          if (!this.topingUpStamps.includes(stamp.batchID)) {
            logger.info(`extending stamp capacity: ${stamp.batchID}`)

            this.topingUpStamps.push(stamp.batchID)
            extendsCapacity(this, beeDebug, stamp)
          }
        } catch (err) {
          logger.error('failed to extend stamp capacity', err)
        }
      }
    }
  }
}
