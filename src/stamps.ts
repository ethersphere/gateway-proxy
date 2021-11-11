import { BeeDebug, DebugPostageBatch } from '@ethersphere/bee-js'
import { sleep } from './utils'

export interface Args {
  // Hardcoded postage stamp
  POSTAGE_STAMP?: string

  // Autobuy postage stamps
  POSTAGE_DEPTH?: string
  POSTAGE_AMOUNT?: string
  POSTAGE_UTILIZATION_TRESHOLD?: string
  POSTAGE_UTILIZATION_MAX?: string
  POSTAGE_TTL_MIN?: string
  POSTAGE_REFRESH_PERIOD?: string
}

export async function checkExistingPostageStamps(
  depth: number,
  amount: string,
  maxUsage: number,
  minTTL: number,
  beeDebug: BeeDebug,
): Promise<DebugPostageBatch | undefined> {
  const stamps = await beeDebug.getAllPostageBatch()
  const usableStamps = stamps
    // filter to get stamps that have the right depth, amount and are not fully used or expired
    .filter(s => s.depth === depth && s.amount === amount && s.utilization < maxUsage && s.batchTTL > minTTL)
    // sort the stamps by utilization
    .sort((a, b) => (a.utilization < b.utilization ? 1 : -1))

  // return the most utilized stamp
  return usableStamps[0]
}

export class StampsManager {
  stamp?: string
  enabled: boolean
  timeout?: ReturnType<typeof setTimeout>

  constructor(
    {
      POSTAGE_STAMP,
      POSTAGE_DEPTH,
      POSTAGE_AMOUNT,
      POSTAGE_UTILIZATION_TRESHOLD,
      POSTAGE_UTILIZATION_MAX,
      POSTAGE_TTL_MIN,
      POSTAGE_REFRESH_PERIOD,
    }: Args = {},
    BEE_DEBUG_API_URL?: string,
  ) {
    this.enabled = true

    if (POSTAGE_STAMP) this.stamp = POSTAGE_STAMP
    else if (POSTAGE_DEPTH && POSTAGE_AMOUNT && BEE_DEBUG_API_URL) {
      const refreshPeriod = Number(POSTAGE_REFRESH_PERIOD || 60)
      this.start(
        Number(POSTAGE_DEPTH),
        POSTAGE_AMOUNT,
        Number(POSTAGE_UTILIZATION_TRESHOLD || '0.7'),
        Number(POSTAGE_UTILIZATION_MAX || '0.95'),
        Number(POSTAGE_TTL_MIN || refreshPeriod * 5),
        refreshPeriod * 1000,
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

    throw new Error('No postage stamp')
  }

  /**
   * Return true if the proxy should replace the postage stamp header
   */
  get shouldReplaceStamp(): boolean {
    return this.enabled
  }

  private async getUsablePostageStamp(
    depth: number,
    amount: string,
    usageTreshold: number,
    maxUsage: number,
    minTTL: number,
    beeDebug: BeeDebug,
  ) {
    const nextStamp = await checkExistingPostageStamps(depth, amount, maxUsage, minTTL, beeDebug)

    if (!nextStamp || nextStamp?.utilization > usageTreshold) {
      beeDebug.createPostageBatch(amount, depth).then(async batchId => {
        while ((await beeDebug.getPostageBatch(batchId)).usable) {
          await sleep(1_000)
        }
        this.getUsablePostageStamp(depth, amount, usageTreshold, maxUsage, minTTL, beeDebug)
      })
    }

    if (nextStamp) this.stamp = nextStamp.batchID
  }

  start(
    depth: number,
    amount: string,
    usageTreshold: number,
    maxUsage: number,
    minTTL: number,
    refreshPeriod: number,
    beeDebug: BeeDebug,
  ): void {
    this.stop()
    this.timeout = setTimeout(
      async () => this.getUsablePostageStamp(depth, amount, usageTreshold, maxUsage, minTTL, beeDebug),
      refreshPeriod,
    )
  }

  stop(): void {
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = undefined
    }
  }
}
