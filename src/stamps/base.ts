import { PostageBatch } from '@ethersphere/bee-js'
import { stampGetCounter, stampGetErrorCounter } from './counters'
import { logger } from '../logger'
import { ERROR_NO_STAMP } from '../config'

export class BaseStampManager {
  public stamp?: string
  public interval?: ReturnType<typeof setInterval>
  public usableStamps?: PostageBatch[]

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

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = undefined
    }
  }
}
