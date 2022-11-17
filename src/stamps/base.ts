import { PostageBatch } from '@ethersphere/bee-js'
import { stampGetCounter, stampGetErrorCounter } from './counters'
import { logger } from '../logger'
import { ERROR_NO_STAMP, StampsConfig } from '../config'

export interface StampsManager {
  start: (config: StampsConfig, refreshStamps?: () => Promise<void>) => Promise<void>
  stop: () => void
  postageStamp: () => string
}

export class BaseStampManager {
  private interval?: ReturnType<typeof setInterval>
  public stamp?: string
  public usableStamps?: PostageBatch[]

  constructor(stamp?: string) {
    this.stamp = stamp
  }

  /**
   * Get postage stamp that should be replaced in a the proxy request header
   *
   * @return Postage stamp that should be used by the proxy
   *
   * @throws Error if there is no postage stamp
   */
  postageStamp(): string {
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
   * Start the manager in either hardcoded, autobuy or extends mode
   */
  async start(config: StampsConfig, refreshStamps?: (config: StampsConfig) => Promise<void>) {
    this.stop()

    if (refreshStamps && (config.mode === 'autobuy' || config.mode === 'extends')) {
      refreshStamps(config)

      this.interval = setInterval(async () => refreshStamps(config), config.refreshPeriod)
    } else if (config.mode === 'hardcoded') {
      this.stamp = config.stamp
    }
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = undefined
    }
  }
}
