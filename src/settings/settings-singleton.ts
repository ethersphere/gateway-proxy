import { createOrGetSettings } from './settings-service'

export const settings = createOrGetSettings(process.argv[2] || 'config.yaml')
