import { BatchId, Bee, PostageBatch } from '@ethersphere/bee-js'
import client from 'prom-client'
import { ERROR_NO_STAMP, StampsConfig, StampsConfigAutobuy, StampsConfigExtends } from './config'
import { logger } from './logger'
import { register } from './metrics'

const stampPurchaseCounter = new client.Counter({
  name: 'stamp_purchase_counter',
  help: 'How many stamps were purchased',
})
register.registerMetric(stampPurchaseCounter)

const stampPurchaseFailedCounter = new client.Counter({
  name: 'stamp_purchase_failed_counter',
  help: 'How many stamps failed to be purchased',
})
register.registerMetric(stampPurchaseFailedCounter)

const stampCheckCounter = new client.Counter({
  name: 'stamp_check_counter',
  help: 'How many times were stamps retrieved from server',
})
register.registerMetric(stampCheckCounter)

const stampGetCounter = new client.Counter({
  name: 'stamp_get_counter',
  help: 'How many times was get postageStamp called',
})
register.registerMetric(stampGetCounter)

const stampGetErrorCounter = new client.Counter({
  name: 'stamp_get_error_counter',
  help: 'How many times was get postageStamp called and there was no valid postage stamp',
})
register.registerMetric(stampGetErrorCounter)

const stampTtlGauge = new client.Gauge({
  name: 'stamp_ttl_gauge',
  help: 'TTL on the selected automanaged stamp',
})
register.registerMetric(stampTtlGauge)

const stampUsageGauge = new client.Gauge({
  name: 'stamp_usage_gauge',
  help: 'Usage on the selected automanaged stamp',
})
register.registerMetric(stampUsageGauge)

const stampUsableCountGauge = new client.Gauge({
  name: 'stamp_usable_count_gauge',
  help: 'How many stamps exist on the bee node that can be used',
})
register.registerMetric(stampUsableCountGauge)

/**
 * Calculate usage of a given postage stamp
 *
 * @param stamp Postage stamp which usage should be determined
 */
export function getUsage({ utilization, depth, bucketDepth }: PostageBatch): number {
  return utilization / Math.pow(2, depth - bucketDepth)
}

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

/**
 * Filter the stamps and only return those that are usable and sort by from closer to farer expire TTL
 *
 * @param stamps Postage stamps to be filtered
 *
 * @returns Filtered stamps soltered by usage
 */
export function filterUsableStampsExtends(stamps: PostageBatch[]): PostageBatch[] {
  const usableStamps = stamps
    // filter to get stamps that have the right depth, amount and are not fully used or expired
    .filter(s => s.usable)
    // sort the stamps by usage
    .sort((a, b) => (a.batchTTL > b.batchTTL ? 1 : -1))

  // return the all usable stamp sorted by usage
  return usableStamps
}

/**
 * Buy new postage stamp and wait until it is usable
 *
 * @param depth Postage stamps depth
 * @param amount Postage stamps amount
 * @param bee Connection for checking/buying stamps
 * @param options
 *        timeout (optional) How long should the system wait for the stamp to be usable in ms, default to 10000
 *
 * @returns Newly bought postage stamp
 */
export async function buyNewStamp(
  depth: number,
  amount: string,
  bee: Bee,
): Promise<{ batchId: BatchId; stamp: PostageBatch }> {
  logger.info('buying new stamp')
  const batchId = await bee.createPostageBatch(amount, depth, { waitForUsable: true })
  stampPurchaseCounter.inc()

  const stamp = await bee.getPostageBatch(batchId)
  logger.info('successfully bought new stamp', { stamp })

  return { batchId, stamp }
}

export async function topUpStamp(bee: Bee, postageBatchId: string, amount: string): Promise<PostageBatch> {
  await bee.topUpBatch(postageBatchId, amount)
  const stamp = await bee.getPostageBatch(postageBatchId)

  return stamp
}

export class StampsManager {
  private stamp?: string
  private usableStamps?: PostageBatch[]
  private interval?: ReturnType<typeof setInterval>
  private isBuyingStamp?: boolean = false
  private extendingStamps: string[] = []

  /**
   * Get postage stamp that should be replaced in a the proxy request header
   *
   * @return Postage stamp that should be used by the proxy
   *
   * @throws Error if there is no postage stamp
   */
  get postageStamp(): string {
    stampGetCounter.inc()

    if (this.stamp) {
      const stamp = this.stamp
      logger.info('using hardcoded stamp', { stamp })

      return stamp
    }

    if (this.usableStamps && this.usableStamps[0]) {
      const stamp = this.usableStamps[0]
      logger.info('using autobought stamp', { stamp })

      return stamp.batchID
    }

    stampGetErrorCounter.inc()
    throw new Error(ERROR_NO_STAMP)
  }

  /**
   * Refresh stamps from the bee node and if needed buy new stamp
   *
   * @param config Stamps config
   * @param bee Connection for checking/buying stamps
   */
  public async refreshStampsAutobuy(config: StampsConfigAutobuy, bee: Bee): Promise<void> {
    try {
      stampCheckCounter.inc()
      logger.info('checking postage stamps')
      const stamps = await bee.getAllPostageBatch()
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
          const { stamp } = await buyNewStamp(depth, amount, bee)

          // Add the bought postage stamp
          this.usableStamps.push(stamp)
          stampUsableCountGauge.set(this.usableStamps.length)
        } catch (error) {
          logger.error('failed to buy postage stamp', error)
          stampPurchaseFailedCounter.inc()
        } finally {
          this.isBuyingStamp = false
        }
      }
    } catch (error) {
      logger.error('failed to refresh postage stamp', error)
    }
  }

  public async refreshStampsExtends(config: StampsConfigExtends, bee: Bee): Promise<void> {
    stampCheckCounter.inc()
    logger.info('checking postage stamps')

    try {
      const stamps = await bee.getAllPostageBatch()
      logger.debug('retrieved stamps', stamps)

      const { amount, ttlMin, depth } = config

      // Get all usable stamps sorted by usage from most used to least
      this.usableStamps = filterUsableStampsExtends(stamps)

      if (!this.isBuyingStamp) {
        if (this.usableStamps.length === 0) {
          this.isBuyingStamp = true
          try {
            const { stamp: newStamp } = await buyNewStamp(depth, amount, bee)

            // Add the bought postage stamp
            this.usableStamps.push(newStamp)
          } finally {
            this.isBuyingStamp = false
          }
        } else {
          await this.verifyUsableStamps(bee, ttlMin, config, amount)
        }
      }
    } catch (error) {
      logger.error('failed to refresh on extends postage stamps', error)
    }
  }

  async verifyUsableStamps(
    bee: Bee,
    ttlMin: number,
    config: StampsConfigAutobuy | StampsConfigExtends,
    amount: string,
  ) {
    for (let i = 0; i < this.usableStamps!.length; i++) {
      const stamp = this.usableStamps![i]

      const minTimeThreshold = ttlMin + config.refreshPeriod / 1000

      if (stamp.batchTTL < minTimeThreshold && !this.extendingStamps.includes(stamp.batchID)) {
        this.extendingStamps.push(stamp.batchID)
        logger.info(`extending postage stamp ${stamp.batchID}`)

        try {
          const stampRes = await topUpStamp(bee, stamp.batchID, amount)

          setTimeout(() => this.completeTopUp(stampRes), 60000)
        } catch (error) {
          // error that indicate that 2 stamps are trying to be extended at the same time. Comes out as a warning
          const errorStampIndex = this.extendingStamps.indexOf(stamp.batchID)
          this.extendingStamps.splice(errorStampIndex, 1)
          logger.error('failed to topup postage stamp', error)
        }
      }
    }
  }

  completeTopUp(stamp: PostageBatch) {
    logger.info('successfully extended postage stamp', { stamp })
    // remove stamps from extending stamps array
    const stampIndex = this.extendingStamps.findIndex(id => stamp.batchID === id)
    this.extendingStamps.splice(stampIndex, 1)
  }

  /**
   * Start the manager in either hardcoded or autobuy mode
   */
  async start(config: StampsConfig): Promise<void> {
    // Hardcoded stamp mode
    if (config.mode === 'hardcoded') this.stamp = config.stamp
    // Autobuy or ExtendsTTL mode
    else {
      let refreshStamps: () => Promise<void>

      if (config.mode === 'autobuy') {
        refreshStamps = async () => this.refreshStampsAutobuy(config, new Bee(config.beeApiUrl))
      } else {
        refreshStamps = async () => this.refreshStampsExtends(config, new Bee(config.beeApiUrl))
      }
      this.stop()
      await refreshStamps()

      this.interval = setInterval(refreshStamps, config.refreshPeriod)
    }
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = undefined
    }
  }
}
