import { BeeDebug, DebugPostageBatch, BatchId } from '@ethersphere/bee-js'
import type { StampsConfig, StampsConfigAutobuy } from './config'
import { sleep } from './utils'

const logger = console // eslint-disable-line no-console

const DEFAULT_POLLING_FREQUENCY = 1_000
const DEFAULT_STAMP_USABLE_TIMEOUT = 60_000

interface Options {
  pollingFrequency?: number
  timeout?: number
}

/**
 * Wait until a given postage stamp is usable
 *
 * @param batchId Postage stamp id to be waited on
 * @param beeDebug Connection to the bee debug service
 * @param options
 *        pollingFrequency (optional) How often should the stamp be checked in ms, default 1000
 *        timeout (optional) How long should the system wait for the stamp to be usable in ms, default to 10000
 */
export async function waitUntilStampUsable(
  batchId: BatchId,
  beeDebug: BeeDebug,
  options: Options = {},
): Promise<DebugPostageBatch> | never {
  const timeout = options.timeout || DEFAULT_STAMP_USABLE_TIMEOUT
  const pollingFrequency = options.pollingFrequency || DEFAULT_POLLING_FREQUENCY
  let timeoutReached = false

  const timeoutPromise = async (): Promise<never> =>
    new Promise((_, reject) =>
      setTimeout(() => {
        timeoutReached = true
        reject(new Error('Wait until stamp usable timeout has been reached'))
      }, timeout),
    )

  const stampWaitPromise = async (): Promise<DebugPostageBatch> | never => {
    while (!timeoutReached) {
      const stamp = await beeDebug.getPostageBatch(batchId)

      if (stamp.usable) return stamp
      await sleep(pollingFrequency)
    }
    // Need to throw something otherwise this will just return Promise<undefined>
    throw new Error('Wait until stamp usable timeout has been reached')
  }

  return Promise.race([stampWaitPromise(), timeoutPromise()])
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
 * @param options
 *        pollingFrequency (optional) How often should the stamp be checked in ms, default 1000
 *        timeout (optional) How long should the system wait for the stamp to be usable in ms, default to 10000
 *
 * @returns Newly bought postage stamp
 */
export async function buyNewStamp(
  depth: number,
  amount: string,
  beeDebug: BeeDebug,
  options: Options = {},
): Promise<DebugPostageBatch> {
  const batchId = await beeDebug.createPostageBatch(amount, depth)

  return await waitUntilStampUsable(batchId, beeDebug, options)
}

export class StampsManager {
  private stamp?: string
  private usableStamps?: DebugPostageBatch[]
  private interval?: ReturnType<typeof setInterval>

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
   * @param config Stamps config
   * @param beeDebug Connection to debug endpoint for checking/buying stamps
   */
  public async refreshStamps(config: StampsConfigAutobuy, beeDebug: BeeDebug): Promise<void> {
    try {
      const stamps = await beeDebug.getAllPostageBatch()

      const { depth, amount, usageMax, usageTreshold, ttlMin } = config

      // Get all usable stamps sorted by usage from most used to least
      this.usableStamps = filterUsableStamps(stamps, depth, amount, usageMax, ttlMin)

      // Check if the least used stamps is starting to get full and if so purchase new stamp
      const leastUsed = this.usableStamps[this.usableStamps.length - 1]

      if (!leastUsed || getUsage(leastUsed) > usageTreshold) {
        await buyNewStamp(depth, amount, beeDebug)

        // Once bought, should check if it maybe does not need to be used already
        this.refreshStamps(config, beeDebug)
      }
    } catch (e) {
      logger.error('error: failed to refresh postage stamp', e)
    }
  }

  /**
   * Start the manager in either hardcoded or autobuy mode
   */
  async start(config: StampsConfig): Promise<void> {
    // Hardcoded stamp mode
    if (config.mode === 'hardcoded') this.stamp = config.stamp
    // Autobuy mode
    else {
      this.stop()

      const f = async () => this.refreshStamps(config, new BeeDebug(config.beeDebugApiUrl))
      await f()

      this.interval = setInterval(f, config.refreshPeriod)
    }
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = undefined
    }
  }
}
