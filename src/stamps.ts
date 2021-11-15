import { BeeDebug, DebugPostageBatch, BatchId } from '@ethersphere/bee-js'
import { sleep } from './utils'

const logger = console // eslint-disable-line no-console

export interface Args {
  // Hardcoded postage stamp
  POSTAGE_STAMP?: string /** Hardcoded postage stamp to be used (its existence, usage nor expiration is not checked) */

  // Autobuy postage stamps
  POSTAGE_DEPTH?: string /** Depth of the postage stamps to use & buy */
  POSTAGE_AMOUNT?: string /** Amount of the postage stamps to use & buy */
  POSTAGE_USAGE_THRESHOLD?: string /** Threshold when new postage stamp should be bought */
  POSTAGE_USAGE_MAX?: string /** Maximal usage of the stamp to be usable by the proxy */
  POSTAGE_TTL_MIN?: string /** Minimal TTL of the stamp to be usable by the proxy */
  POSTAGE_REFRESH_PERIOD?: string /** How often should info about stamps be refreshed and potentially new ones be bought */
}

/**
 * Wait until a given postage stamp is usable
 *
 * @param batchId Postage stamp id to be waited on
 * @param beeDebug Connection to the bee debug service
 * @param pollingFrequency (optional) How often should the stamp be checked in ms, default 1000
 */
export async function waitUntilStampUsable(
  batchId: BatchId,
  beeDebug: BeeDebug,
  pollingFrequency = 1_000,
): Promise<DebugPostageBatch> | never {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const stamp = await beeDebug.getPostageBatch(batchId)

    if (stamp.usable) return stamp
    await sleep(pollingFrequency)
  }
}

/**
 * Calculate usage of a given postage stamp
 *
 * @param stamp Postage stamp which usage should be determined
 */
export function getUsage({ utilization, depth, bucketDepth }: DebugPostageBatch): number {
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
export function filterUsableStamps(
  stamps: DebugPostageBatch[],
  depth: number,
  amount: string,
  maxUsage: number,
  minTTL: number,
): DebugPostageBatch[] {
  const usableStamps = stamps
    // filter to get stamps that have the right depth, amount and are not fully used or expired
    .filter(s => s.usable && s.depth === depth && s.amount === amount && getUsage(s) < maxUsage && s.batchTTL > minTTL)
    // sort the stamps by usage
    .sort((a, b) => (getUsage(a) < getUsage(b) ? 1 : -1))

  // return the all usable stamp sorted by usage
  return usableStamps
}

/**
 * Buy new postage stamp and wait until it is usable
 *
 * @param depth Postage stamps depth
 * @param amount Postage stamps amount
 * @param beeDebug Connection to debug endpoint for checking/buying stamps
 * @param pollingFrequency (optional) How often should the stamp be checked in ms, default 1000
 *
 * @returns Newly bought postage stamp
 */
export async function buyNewStamp(
  depth: number,
  amount: string,
  beeDebug: BeeDebug,
  pollingFrequency?: number,
): Promise<DebugPostageBatch> {
  return new Promise(async (resolve, reject) =>
    beeDebug
      .createPostageBatch(amount, depth)
      .then(async (batchId: BatchId) => {
        waitUntilStampUsable(batchId, beeDebug, pollingFrequency)
          .then(resolve)
          .catch(e => {
            logger.error('error: failed to wait until postage stamp is usable', e)
            reject(e)
          })
      })
      .catch(e => {
        logger.error('error: failed to buy postage stamp', e)
        reject(e)
      }),
  )
}

export class StampsManager {
  private stamp?: string
  private usableStamps?: DebugPostageBatch[]
  public readonly enabled: boolean
  private interval?: ReturnType<typeof setInterval>

  constructor(
    {
      POSTAGE_STAMP,
      POSTAGE_DEPTH,
      POSTAGE_AMOUNT,
      POSTAGE_USAGE_THRESHOLD,
      POSTAGE_USAGE_MAX,
      POSTAGE_TTL_MIN,
      POSTAGE_REFRESH_PERIOD,
    }: Args = {},
    BEE_DEBUG_API_URL?: string,
  ) {
    this.enabled = true

    if (POSTAGE_STAMP) this.stamp = POSTAGE_STAMP
    else if (POSTAGE_DEPTH && POSTAGE_AMOUNT && BEE_DEBUG_API_URL) {
      const refreshPeriod = Number(POSTAGE_REFRESH_PERIOD || 60_000)
      this.start(
        Number(POSTAGE_DEPTH),
        POSTAGE_AMOUNT,
        Number(POSTAGE_USAGE_THRESHOLD || '0.7'),
        Number(POSTAGE_USAGE_MAX || '0.95'),
        Number(POSTAGE_TTL_MIN || (refreshPeriod / 1_000) * 5),
        refreshPeriod,
        new BeeDebug(BEE_DEBUG_API_URL),
      )
    } else if (POSTAGE_DEPTH || POSTAGE_AMOUNT || BEE_DEBUG_API_URL) {
      throw new Error('Please provide POSTAGE_DEPTH, POSTAGE_AMOUNT and BEE_DEBUG_API_URL environment variable')
    } else this.enabled = false
  }

  /**
   * Get postage stamp that should be replaced in a the proxy request header
   *
   * @return Postage stamp that should be used by the proxy
   *
   * @throws Error if there is no postage stamp
   */
  get postageStamp(): string {
    if (this.stamp) return this.stamp

    if (this.usableStamps && this.usableStamps[0]) return this.usableStamps[0].batchID

    throw new Error('No postage stamp')
  }

  /**
   * Refresh stamps from the bee node and if needed buy new stamp
   *
   * @param depth Postage stamps depth
   * @param amount Postage stamps amount
   * @param usageThreshold Threshold when new postage stamp should be bought
   * @param maxUsage Maximal usage of the stamp to be usable by the proxy
   * @param minTTL Minimal TTL of the stamp to be usable by the proxy
   * @param beeDebug Connection to debug endpoint for checking/buying stamps
   */
  public async refreshStamps(
    depth: number,
    amount: string,
    usageThreshold: number,
    maxUsage: number,
    minTTL: number,
    beeDebug: BeeDebug,
  ): Promise<void> {
    try {
      const stamps = await beeDebug.getAllPostageBatch()

      // Get all usable stamps sorted by usage from most used to least
      this.usableStamps = filterUsableStamps(stamps, depth, amount, maxUsage, minTTL)

      // Check if the least used stamps is starting to get full and if so purchase new stamp
      const leastUsed = this.usableStamps[this.usableStamps.length - 1]

      if (!leastUsed || getUsage(leastUsed) > usageThreshold) {
        buyNewStamp(depth, amount, beeDebug).then(() => {
          // Once bought, should check if it maybe does not need to be used again
          this.refreshStamps(depth, amount, usageThreshold, maxUsage, minTTL, beeDebug)
        })
      }
    } catch (e) {
      logger.error('error: failed to check postage stamp', e)
    }
  }

  /**
   * Start the manager refresh cycle
   *
   * @param depth Postage stamps depth
   * @param amount Postage stamps amount
   * @param usageThreshold Threshold when new postage stamp should be bought
   * @param maxUsage Maximal usage of the stamp to be usable by the proxy
   * @param minTTL Minimal TTL of the stamp to be usable by the proxy
   * @param refreshPeriod How often should info about stamps be refreshed and potentially new ones be bought
   * @param beeDebug Connection to debug endpoint for checking/buying stamps
   */
  private start(
    depth: number,
    amount: string,
    usageTreshold: number,
    maxUsage: number,
    minTTL: number,
    refreshPeriod: number,
    beeDebug: BeeDebug,
  ): void {
    this.stop()

    const f = async () => this.refreshStamps(depth, amount, usageTreshold, maxUsage, minTTL, beeDebug)
    f()

    this.interval = setInterval(f, refreshPeriod)
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = undefined
    }
  }
}
