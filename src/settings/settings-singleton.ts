import { createOrGetSettings } from './settings-service'

export const settings = createOrGetSettings('config.yaml')
