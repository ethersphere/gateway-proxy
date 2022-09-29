import { Bee } from '@ethersphere/bee-js'
import client from 'prom-client'
import type { ContentConfig } from './config'
import { logger } from './logger'
import { register } from './metrics'

const contentReuploadCounter = new client.Counter({
  name: 'content_reupload_counter',
  help: 'How many pinned content items were uploaded',
})
register.registerMetric(contentReuploadCounter)

export class ContentManager {
  private interval?: ReturnType<typeof setInterval>
  private isReuploading = false

  public async refreshContentReupload(beeApi: Bee): Promise<void> {
    const pins = await beeApi.getAllPins()

    if (!pins.length) {
      logger.info(`no pins found`)
    } else {
      logger.info(`checking pinned content (${pins.length} pins)`)
      for (const pin of pins) {
        const isRetrievable = await beeApi.isReferenceRetrievable(pin)

        if (!isRetrievable && !this.isReuploading) {
          this.isReuploading = true
          await beeApi.reuploadPinnedData(pin)
          this.isReuploading = false
          contentReuploadCounter.inc()
          logger.info(`pinned content reuploaded: ${pin}`)
        }
      }
    }
  }

  /**
   * Start the manager that checks for pinned content availability and reuploads the data if needed.
   */
  async start(config: ContentConfig): Promise<void> {
    const refreshContent = async () => this.refreshContentReupload(new Bee(config.beeDebugApiUrl))
    this.stop()
    await refreshContent()

    this.interval = setInterval(refreshContent, config.refreshPeriod)
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = undefined
    }
  }
}
