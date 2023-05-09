import { Bee } from '@ethersphere/bee-js'
import client from 'prom-client'
import { logger } from './logger'
import { register } from './metrics'
import { settings } from './settings/settings-singleton'

const contentReuploadCounter = new client.Counter({
  name: 'content_reupload_counter',
  help: 'How many pinned content items were uploaded',
})
register.registerMetric(contentReuploadCounter)

export class ContentManager {
  private interval?: ReturnType<typeof setInterval>
  private isReuploading = false

  public async attemptRefreshContentReupload(beeApi: Bee): Promise<void> {
    try {
      await this.refreshContentReupload(beeApi)
    } catch (error) {
      logger.error('content reupload job failed', error)
    }
  }

  public async refreshContentReupload(beeApi: Bee): Promise<void> {
    const pins = await beeApi.getAllPins()

    if (!pins.length) {
      return
    }

    for (const pin of pins) {
      const isRetrievable = await beeApi.isReferenceRetrievable(pin)
      if (!isRetrievable && !this.isReuploading) {
        this.isReuploading = true
        try {
          logger.info(`reuploading pinned content: ${pin}`)
          await beeApi.reuploadPinnedData(pin)
          contentReuploadCounter.inc()
          logger.info(`pinned content reuploaded: ${pin}`)
        } catch (error) {
          logger.error('failed to reupload pinned content', error)
        }
        this.isReuploading = false
      }
    }
  }

  /**
   * Start the manager that checks for pinned content availability and reuploads the data if needed.
   */
  start(): void {
    logger.info('Starting content manager')
    const refreshContent = async () => this.attemptRefreshContentReupload(new Bee(settings.bee.api))
    this.stop()
    refreshContent()

    this.interval = setInterval(refreshContent, settings.contentReupload.reuploadFrequency)
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = undefined
    }
  }
}
