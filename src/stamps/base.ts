import { PostageBatch } from '@ethersphere/bee-js'
import { stampGetCounter, stampGetErrorCounter } from './counters'
import { logger } from '../logger'
import { ERROR_NO_STAMP, StampsConfig, StampsConfigAutobuy, StampsConfigExtends } from '../config'

export interface StampsManager {
  start?: (config: StampsConfig) => Promise<void>
  stop: () => void
  postageStamp: () => string
}

export class BaseStampManager implements StampsManager {
  private interval?: ReturnType<typeof setInterval>
  public stamp?: string
  public usableStamps?: PostageBatch[]

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
   * Start the manager in either hardcoded or autobuy mode
   */
  public async startFeature(
    config: StampsConfigAutobuy | StampsConfigExtends,
    refreshStamps: () => void,
  ): Promise<void> {
    this.stop()
    refreshStamps()

    this.interval = setInterval(refreshStamps, config.refreshPeriod)
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = undefined
    }
  }
}
