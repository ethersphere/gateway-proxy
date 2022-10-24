import { StampsConfig } from '../config'
import { BaseStampManager } from './base'

export class HardcodedStampsManager extends BaseStampManager {
  /**
   * Start the manager in either hardcoded or autobuy mode
   */
  async start(config: StampsConfig): Promise<void> {
    // Hardcoded stamp mode
    if (config.mode === 'hardcoded') this.stamp = config.stamp
  }
}
