import { Bee } from '@ethersphere/bee-js'
import client from 'prom-client'
import type { ContentsConfig } from './config'
import { logger } from './logger'
import { register } from './metrics'

const contentReuploadCounter = new client.Counter({
  name: 'content_reupload_counter',
  help: 'How many pinned content items were uploaded',
})
register.registerMetric(contentReuploadCounter)

export class ContentsManager {
  private interval?: ReturnType<typeof setInterval>
  private isReuploading?: boolean = false
  private counter = 0

  public async refreshContentReupload(beeApi: Bee): Promise<void> {
    logger.info(`contador ${this.counter}`)
    this.counter += 1
    const pins = await beeApi.getAllPins()

    if (!pins.length) {
      logger.info(`no pins found`)
    } else {
      logger.info(`checking pinned content (${pins.length} pins)`)
      for (let i = 0; i < pins.length; i++) {
        const pin = pins[i]
        const isRetrievable = await beeApi.isReferenceRetrievable(pin)

        if (!isRetrievable && !this.isReuploading) {
          this.isReuploading = true
          await beeApi.reuploadPinnedData(pin)
          this.isReuploading = false
          logger.info(`pinned content reuploaded: ${pin}`)
        }
      }
    }
  }

  /**
   * Start the manager to upload pinned content
   */
  async start(config: ContentsConfig): Promise<void> {
    const refreshContents = async () => this.refreshContentReupload(new Bee(config.beeDebugApiUrl))
    this.stop()
    await refreshContents()

    this.interval = setInterval(refreshContents, config.refreshPeriod)
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = undefined
    }
  }
}
