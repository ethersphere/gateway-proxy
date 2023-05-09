import { bigNumberParser } from './parser/big-number-parser'
import { boolParser } from './parser/bool-parser'
import { depthParser } from './parser/depth-parser'
import { enumParser } from './parser/enum-parser'
import { optionalStringParser } from './parser/optional-string-parser'
import { percentageParser } from './parser/percentage-parser'
import { requiredStringParser } from './parser/required-string-parser'
import { temporalParser } from './parser/temporal-parser'
import { Settings } from './settings'

export function makeSettings(settings: Record<string, any>): Settings {
  return {
    bee: {
      api: requiredStringParser.parse(settings?.bee?.api, 'bee.api'),
      debugApi: requiredStringParser.parse(settings?.bee?.debugApi, 'bee.debugApi'),
    },
    server: {
      port: parseInt(bigNumberParser.parse(settings?.server?.port, 'server.port'), 10),
      hostname: optionalStringParser.parse(settings?.server?.hostname, 'server.hostname'),
      authSecret: optionalStringParser.parse(settings?.server?.authSecret, 'server.authSecret'),
      logLevel: enumParser.parse(settings?.server?.logLevel, 'server.logLevel', ['debug', 'info', 'warn', 'error']),
    },
    stamp: {
      checkFrequency: temporalParser.parse(settings?.stamp?.checkFrequency, 'stamp.checkFrequency'),
      mode: enumParser.parse(settings?.stamp?.mode, 'stamp.mode', ['', 'hardcoded', 'autobuy', 'autoextend']),
      hardcoded: {
        batchId: optionalStringParser.parse(settings?.stamp?.hardcoded?.batchId, 'stamp.hardcoded.batchId'),
      },
      autobuy: {
        amount: bigNumberParser.parse(settings?.stamp?.autobuy?.amount, 'stamp.autobuy.amount'),
        depth: depthParser.parse(settings?.stamp?.autobuy?.depth, 'stamp.autobuy.depth'),
        ttlThreshold: temporalParser.parse(settings?.stamp?.autobuy?.ttlThreshold, 'stamp.autobuy.ttlThreshold') / 1000,
        usageThreshold: percentageParser.parse(
          settings?.stamp?.autobuy?.usageThreshold,
          'stamp.autobuy.usageThreshold',
        ),
      },
      autoextend: {
        defaultAmount: bigNumberParser.parse(
          settings?.stamp?.autoextend?.defaultAmount,
          'stamp.autoextend.defaultAmount',
        ),
        defaultDepth: depthParser.parse(settings?.stamp?.autoextend?.defaultDepth, 'stamp.autoextend.defaultDepth'),
        extendCapacity: boolParser.parse(
          settings?.stamp?.autoextend?.extendCapacity,
          'stamp.autoextend.extendCapacity',
        ),
        extendTtl: boolParser.parse(settings?.stamp?.autoextend?.extendTtl, 'stamp.autoextend.extendTtl'),
        extendAmount: bigNumberParser.parse(settings?.stamp?.autoextend?.extendAmount, 'stamp.autoextend.extendAmount'),
        ttlThreshold:
          temporalParser.parse(settings?.stamp?.autoextend?.ttlThreshold, 'stamp.autoextend.ttlThreshold') / 1000,
        usageThreshold: percentageParser.parse(
          settings?.stamp?.autoextend?.usageThreshold,
          'stamp.autoextend.usageThreshold',
        ),
      },
    },
    contentReupload: {
      enabled: boolParser.parse(settings?.contentReupload?.enabled, 'contentReupload.enabled'),
      reuploadFrequency: temporalParser.parse(
        settings?.contentReupload?.reuploadFrequency,
        'contentReupload.reuploadFrequency',
      ),
    },
    cid: boolParser.parse(settings?.cid, 'cid'),
    ens: boolParser.parse(settings?.ens, 'ens'),
    exposeHashedIdentity: boolParser.parse(settings?.exposeHashedIdentity, 'exposeHashedIdentity'),
    removePinHeader: boolParser.parse(settings?.removePinHeader, 'removePinHeader'),
  }
}
