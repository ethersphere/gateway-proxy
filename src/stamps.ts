import { BeeDebug, DebugPostageBatch } from '@ethersphere/bee-js'
import { sleep } from './utils'

export interface PostageStamps {
  // Hardcoded postage stamp
  POSTAGE_STAMP?: string

  // Autobuy postage stamps
  POSTAGE_DEPTH?: string
  POSTAGE_AMOUNT?: string
  POSTAGE_UTILIZATION_TRESHOLD?: string
  POSTAGE_UTILIZATION_MAX?: string
}

const REFRESH_PERIOD = 60_000
const MIN_STAMP_TTL = (REFRESH_PERIOD * 5) / 1000

export async function checkExistingPostageStamps(
  depth: number,
  amount: string,
  maxUsage: number,
  beeDebug: BeeDebug,
): Promise<DebugPostageBatch | undefined> {
  const stamps = await beeDebug.getAllPostageBatch()
  const usableStamps = stamps
    // filter to get stamps that have the right depth, amount and are not fully used or expired
    .filter(s => s.depth === depth && s.amount === amount && s.utilization < maxUsage && s.batchTTL > MIN_STAMP_TTL)
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
    }: PostageStamps = {},
    BEE_DEBUG_API_URL?: string,
  ) {
    this.enabled = true

    if (POSTAGE_STAMP) this.stamp = POSTAGE_STAMP
    else if (POSTAGE_DEPTH && POSTAGE_AMOUNT && BEE_DEBUG_API_URL) {
      this.start(
        Number(POSTAGE_DEPTH),
        POSTAGE_AMOUNT,
        Number(POSTAGE_UTILIZATION_TRESHOLD || '0.7'),
        Number(POSTAGE_UTILIZATION_MAX || '0.95'),
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
    beeDebug: BeeDebug,
  ) {
    const nextStamp = await checkExistingPostageStamps(depth, amount, maxUsage, beeDebug)

    if (!nextStamp || nextStamp?.utilization > usageTreshold) {
      beeDebug.createPostageBatch(amount, depth).then(async batchId => {
        while ((await beeDebug.getPostageBatch(batchId)).usable) {
          await sleep(1_000)
        }
        this.getUsablePostageStamp(depth, amount, usageTreshold, maxUsage, beeDebug)
      })
    }

    if (nextStamp) this.stamp = nextStamp.batchID
  }

  start(depth: number, amount: string, usageTreshold: number, maxUsage: number, beeDebug: BeeDebug): void {
    this.stop()
    this.timeout = setTimeout(
      async () => this.getUsablePostageStamp(depth, amount, usageTreshold, maxUsage, beeDebug),
      REFRESH_PERIOD,
    )
  }

  stop(): void {
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = undefined
    }
  }
}
