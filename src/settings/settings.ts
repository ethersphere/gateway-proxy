export interface BeeSettings {
  api: string
  debugApi: string
}

export interface ServerSettings {
  port: number
  hostname: string
  authSecret: string
  logLevel: 'debug' | 'info' | 'warn' | 'error'
}

export interface ContentReuploadSettings {
  enabled: boolean
  reuploadFrequency: number
}

export interface StampHardcodedSettings {
  batchId: string
}

export interface StampAutobuySettings {
  amount: number
  depth: number
  ttlThreshold: number
  usageThreshold: number
}

export interface StampAutoextendSettings {
  defaultAmount: number
  defaultDepth: number
  extendCapacity: boolean
  extendTtl: boolean
  extendAmount: number
  ttlThreshold: number
  usageThreshold: number
}

export interface StampSettings {
  checkFrequency: number
  mode: '' | 'hardcoded' | 'autobuy' | 'autoextend'
  hardcoded: StampHardcodedSettings
  autobuy: StampAutobuySettings
  autoextend: StampAutoextendSettings
}

export interface Settings {
  bee: BeeSettings
  server: ServerSettings
  stamp: StampSettings
  contentReupload: ContentReuploadSettings
  cid: boolean
  ens: boolean
  exposeHashedIdentity: boolean
  removePinHeader: boolean
}
