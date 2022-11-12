import { BeeDebug, PostageBatch } from '@ethersphere/bee-js'
import { buyNewStamp, getUsage } from '../utils'
import { logger } from '../logger'
import { StampsConfigAutobuy } from '../config'
import {
  stampCheckCounter,
  stampPurchaseFailedCounter,
  stampTtlGauge,
  stampUsableCountGauge,
  stampUsageGauge,
} from './counters'
import { BaseStampManager, StampsManager } from './base'

/**
 * Filter the stamps and only return those that are usable, have correct amount, depth, are not close to beying maxUsage or close to expire
 *
 * @param stamps Postage stamps to be filtered
 * @param depth Postage stamps depth
 * @param amount Postage stamps amount
 * @param maxUsage Maximal usage of the stamp to be usable by the proxy
 * @param minTTL Minimal TTL of the stamp to be usable by the proxy
 *
 * @returns Filtered stamps soltered by usage
 */
export function filterUsableStampsAutobuy(
  stamps: PostageBatch[],
  depth: number,
  amount: string,
  maxUsage: number,
  minTTL: number,
): PostageBatch[] {
  const usableStamps = stamps
    // filter to get stamps that have the right depth, amount and are not fully used or expired
    .filter(s => s.usable && s.depth === depth && s.amount === amount && getUsage(s) < maxUsage && s.batchTTL > minTTL)
    // sort the stamps by usage
    .sort((a, b) => (getUsage(a) < getUsage(b) ? 1 : -1))

  // return the all usable stamp sorted by usage
  return usableStamps
}

export class AutoBuyStampsManager extends BaseStampManager implements StampsManager {
  private isBuyingStamp?: boolean = false

  constructor(config: StampsConfigAutobuy) {
    super()

    const refreshStamps = async () => this.refreshStamps(config, new BeeDebug(config.beeDebugApiUrl))
    this.start(config, refreshStamps)
  }

  /**
   * Refresh stamps from the bee node and if needed buy new stamp
   *
   * @param config Stamps config
   * @param beeDebug Connection to debug endpoint for checking/buying stamps
   */
  private async refreshStamps(config: StampsConfigAutobuy, beeDebug: BeeDebug): Promise<void> {
    try {
      stampCheckCounter.inc()
      logger.info('checking postage stamps')
      const stamps = await beeDebug.getAllPostageBatch()
      logger.debug('retrieved stamps', stamps)

      const { depth, amount, usageMax, usageThreshold, ttlMin } = config

      // Get all usable stamps sorted by usage from most used to least
      this.usableStamps = filterUsableStampsAutobuy(stamps, depth, amount, usageMax, ttlMin)
      const leastUsed = this.usableStamps[this.usableStamps.length - 1]
      const mostUsed = this.usableStamps[0]

      stampTtlGauge.set(mostUsed ? mostUsed.batchTTL : 0)
      stampUsageGauge.set(mostUsed ? getUsage(mostUsed) : 0)
      stampUsableCountGauge.set(this.usableStamps.length)

      // Check if the least used stamps is starting to get full and if so purchase new stamp
      if (!this.isBuyingStamp && (!leastUsed || getUsage(leastUsed) > usageThreshold)) {
        this.isBuyingStamp = true
        try {
          const { stamp } = await buyNewStamp(depth, amount, beeDebug)

          // Add the bought postage stamp
          this.usableStamps.push(stamp)
          stampUsableCountGauge.set(this.usableStamps.length)
        } catch (e) {
          logger.error('failed to buy postage stamp', e)
          stampPurchaseFailedCounter.inc()
        } finally {
          this.isBuyingStamp = false
        }
      }
    } catch (e) {
      logger.error('failed to refresh postage stamp', e)
    }
  }
}
