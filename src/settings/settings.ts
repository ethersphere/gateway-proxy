export interface Settings {
  bee: {
    api: string
    debugApi: string
  }
  server: {
    port: number
    hostname: string
    authSecret: string
    logLevel: 'debug' | 'info' | 'warn' | 'error'
  }
  stamp: {
    checkFrequency: number
    mode: '' | 'hardcoded' | 'autobuy' | 'autoextend'
    hardcoded: {
      batchId: string
    }
    autobuy: {
      amount: number
      depth: number
      ttlThreshold: number
      usageThreshold: number
    }
    autoextend: {
      defaultAmount: number
      defaultDepth: number
      extendCapacity: boolean
      extendTtl: boolean
      extendAmount: number
      ttlThreshold: number
      usageThreshold: number
    }
  }
  contentReupload: {
    enabled: boolean
    reuploadFrequency: number
  }
  cid: boolean
  ens: boolean
  exposeHashedIdentity: boolean
  removePinHeader: boolean
}
