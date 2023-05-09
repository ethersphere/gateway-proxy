import client from 'prom-client'
import { logger } from './logger'
import { register } from './metrics'
import { settings } from './settings/settings-singleton'
import { buyStamp, diluteStamp, topupStamp } from './stamp/StampManipulation'
import { getExpiringStamps, getNearlyFullStamps, getUsableStamps, getUsage } from './stamp/StampRetrieval'
import { sleep } from './utils'

export class StampsManager {
  private stamp?: string

  async start(): Promise<void | never> {
    if (settings.stamp.mode === 'hardcoded') {
      this.stamp = settings.stamp.hardcoded.batchId
    } else if (settings.stamp.mode === 'autobuy') {
      while (true) {
        try {
          await this.refreshStampsAutobuy()
        } catch (e: any) {
          logger.error(e)
          e.stack && logger.error(e.stack)
        }
        await sleep(settings.stamp.checkFrequency)
      }
    } else if (settings.stamp.mode === 'autoextend') {
      while (true) {
        try {
          await this.refreshStampsExtends()
        } catch (e: any) {
          logger.error(e)
          e.stack && logger.error(e.stack)
        }
        await sleep(settings.stamp.checkFrequency)
      }
    }
  }

  get postageStamp(): string {
    if (this.stamp) {
      stampGetCounter.inc()
      return this.stamp
    }

    stampNoneCounter.inc()
    throw new Error('No postage stamp')
  }

  public async refreshStampsAutobuy(): Promise<void> {
    const stamps = await getUsableStamps()
    if (!stamps.length) {
      const stamp = await buyStamp(settings.stamp.autobuy.depth, settings.stamp.autobuy.amount)
      this.stamp = stamp.batchID
    }
    this.stamp = stamps[0].batchID
  }

  public async refreshStampsExtends(): Promise<void> {
    const stamps = await getUsableStamps()
    if (!stamps.length) {
      const stamp = await buyStamp(settings.stamp.autoextend.defaultDepth, settings.stamp.autoextend.defaultAmount)
      this.stamp = stamp.batchID
      return
    }
    this.stamp = stamps[0].batchID
    const expiringStamps = await getExpiringStamps()
    for (const stamp of expiringStamps) {
      logger.info(`Stamp TTL is ${stamp.batchTTL} which is less than ${settings.stamp.autoextend.ttlThreshold}`)
      await topupStamp(stamp.batchID, settings.stamp.autoextend.extendAmount)
    }
    const nearlyFullStamps = await getNearlyFullStamps()
    for (const stamp of nearlyFullStamps) {
      logger.info(`Stamp usage is ${getUsage(stamp)} which is more than ${settings.stamp.autoextend.usageThreshold}`)
      await topupStamp(stamp.batchID, stamp.amount)
      await diluteStamp(stamp.batchID, stamp.depth + 1)
    }
  }
}

const stampGetCounter = new client.Counter({
  name: 'stamp_get_counter',
  help: 'Amount of times a stamp was retrieved to be used',
})
register.registerMetric(stampGetCounter)

const stampNoneCounter = new client.Counter({
  name: 'stamp_none_counter',
  help: 'Amount of times no stamp was available',
})
register.registerMetric(stampNoneCounter)
