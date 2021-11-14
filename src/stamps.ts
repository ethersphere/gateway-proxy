import { BeeDebug, DebugPostageBatch, BatchId } from '@ethersphere/bee-js'
import { sleep } from './utils'

export interface Args {
  // Hardcoded postage stamp
  POSTAGE_STAMP?: string

  // Autobuy postage stamps
  POSTAGE_DEPTH?: string
  POSTAGE_AMOUNT?: string
  POSTAGE_USAGE_THRESHOLD?: string
  POSTAGE_USAGE_MAX?: string
  POSTAGE_TTL_MIN?: string
  POSTAGE_REFRESH_PERIOD?: string
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
  pollingFrequency: number = 1_000,
): Promise<void> | never {
  while (!(await beeDebug.getPostageBatch(batchId)).usable) await sleep(pollingFrequency)
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
 * Check if any of the postage stamps that are already bought can be used
 * Return the one with highest usage that still fits the treshold
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
    // sort the stamps by utilization
    .sort((a, b) => (a.utilization < b.utilization ? 1 : -1))

  // return the most utilized stamp
  return usableStamps
}

export function buyNewStamp(depth: number, amount: string, beeDebug: BeeDebug) {
  return new Promise((resolve, reject) =>
    beeDebug
      .createPostageBatch(amount, depth)
      .then(async (batchId: BatchId) => {
        waitUntilStampUsable(batchId, beeDebug)
          .then(resolve)
          .catch(e => {
            console.error('error: failed to wait until postage stamp is usable', e)
            reject(e)
          })
      })
      .catch(e => {
        console.error('error: failed to buy postage stamp', e)
        reject(e)
      }),
  )
}

export class StampsManager {
  stamp?: string
  usableStamps?: DebugPostageBatch[]
  enabled: boolean
  interval?: ReturnType<typeof setInterval>

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
   * @throws Error if could not find suitable postage stamp
   */
  get getPostageStamp(): string {
    if (this.stamp) return this.stamp

    if (this.usableStamps && this.usableStamps[0]) return this.usableStamps[0].batchID

    throw new Error('No postage stamp')
  }

  /**
   * Return true if the proxy should replace the postage stamp header
   */
  get shouldReplaceStamp(): boolean {
    return this.enabled
  }

  private async refreshStamps(
    depth: number,
    amount: string,
    usageTreshold: number,
    maxUsage: number,
    minTTL: number,
    beeDebug: BeeDebug,
  ) {
    try {
      const stamps = await beeDebug.getAllPostageBatch()

      // Get all usable stamps sorted by usage from most used to least
      this.usableStamps = filterUsableStamps(stamps, depth, amount, maxUsage, minTTL)

      // Check if this stamps is starting to get full and if so purchase new stamp
      const leastUsed = this.usableStamps[this.usableStamps.length - 1]
      if (!leastUsed || leastUsed?.utilization > usageTreshold) {
        buyNewStamp(depth, amount, beeDebug).then(() => {
          // Once bought, should check if it maybe does not need to be used again
          this.refreshStamps(depth, amount, usageTreshold, maxUsage, minTTL, beeDebug)
        })
      }
    } catch (e) {
      console.error('error: failed to check postage stamp', e)
    }
  }

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

    const f = () => this.refreshStamps(depth, amount, usageTreshold, maxUsage, minTTL, beeDebug)
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
