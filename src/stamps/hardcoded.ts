import { StampsConfigHardcoded } from '../config'
import { BaseStampManager, StampsManager } from './base'

export class HardcodedStampsManager extends BaseStampManager implements StampsManager {
  constructor(config: StampsConfigHardcoded) {
    super()
    this.start(config)
  }
}
