import { StampsConfig } from '../config'
import { BaseStampManager, StampsManager } from './base'

export class HardcodedStampsManager extends BaseStampManager implements StampsManager {
  /**
   * Start the manager in either hardcoded or autobuy mode
   */
  async start(config: StampsConfig): Promise<void> {
    // Hardcoded stamp mode
    if (config.mode === 'hardcoded') this.stamp = config.stamp
  }
}
