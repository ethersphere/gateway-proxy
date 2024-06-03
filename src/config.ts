export interface AppConfig {
  beeApiUrl: string
  authorization?: string
  allowlist?: string[]
  hostname?: string
  cidSubdomains?: boolean
  ensSubdomains?: boolean
  removePinHeader?: boolean
  exposeHashedIdentity?: boolean
  readinessCheck?: boolean
  homepage?: string
}

export interface ServerConfig {
  hostname: string
  port: number
}

interface StampsConfigHardcoded {
  mode: 'hardcoded'
  stamp: string
}
export interface StampsConfigExtends {
  mode: 'extendsTTL'
  ttlMin: number
  depth: number
  amount: string
  refreshPeriod: number
  beeApiUrl: string
}

export interface ContentConfigReupload {
  beeApiUrl: string
  refreshPeriod: number
}

export interface StampsConfigAutobuy {
  mode: 'autobuy'
  depth: number
  amount: string
  beeApiUrl: string
  usageThreshold: number
  usageMax: number
  ttlMin: number
  refreshPeriod: number
}

export type StampsConfig = StampsConfigHardcoded | StampsConfigAutobuy | StampsConfigExtends

export type ContentConfig = ContentConfigReupload

export type EnvironmentVariables = Partial<{
  // Logging
  LOG_LEVEL: string

  // Proxy
  BEE_API_URL: string
  AUTH_SECRET: string
  ALLOWLIST: string

  // Server
  PORT: string
  HOSTNAME: string

  // Identity
  EXPOSE_HASHED_IDENTITY: string

  // Readiness check
  READINESS_CHECK: string

  // CID subdomain support
  CID_SUBDOMAINS: string
  ENS_SUBDOMAINS: string

  // Headers manipulation
  REMOVE_PIN_HEADER: string

  // Stamps
  POSTAGE_STAMP: string
  POSTAGE_DEPTH: string
  POSTAGE_AMOUNT: string
  POSTAGE_USAGE_THRESHOLD: string
  POSTAGE_USAGE_MAX: string
  POSTAGE_TTL_MIN: string
  POSTAGE_REFRESH_PERIOD: string
  POSTAGE_EXTENDSTTL: string
  REUPLOAD_PERIOD: string

  // Homepage
  HOMEPAGE: string
}>

export const SUPPORTED_LEVELS = ['critical', 'error', 'warn', 'info', 'verbose', 'debug'] as const
export type SupportedLevels = typeof SUPPORTED_LEVELS[number]

export const DEFAULT_BEE_API_URL = 'http://localhost:1633'
export const DEFAULT_HOSTNAME = 'localhost'
export const DEFAULT_PORT = 3000
export const DEFAULT_POSTAGE_USAGE_THRESHOLD = 0.7
export const DEFAULT_POSTAGE_USAGE_MAX = 0.9
export const DEFAULT_POSTAGE_REFRESH_PERIOD = 60_000
export const DEFAULT_LOG_LEVEL = 'info'
export const MINIMAL_EXTENDS_TTL_VALUE = 60
export const READINESS_TIMEOUT_MS = 3000
export const ERROR_NO_STAMP = 'No postage stamp'

export const logLevel =
  process.env.LOG_LEVEL && SUPPORTED_LEVELS.includes(process.env.LOG_LEVEL as SupportedLevels)
    ? process.env.LOG_LEVEL
    : DEFAULT_LOG_LEVEL

export function getAppConfig({
  BEE_API_URL,
  AUTH_SECRET,
  ALLOWLIST,
  CID_SUBDOMAINS,
  ENS_SUBDOMAINS,
  HOSTNAME,
  REMOVE_PIN_HEADER,
  EXPOSE_HASHED_IDENTITY,
  READINESS_CHECK,
  HOMEPAGE,
}: EnvironmentVariables = {}): AppConfig {
  return {
    hostname: HOSTNAME || DEFAULT_HOSTNAME,
    beeApiUrl: BEE_API_URL || DEFAULT_BEE_API_URL,
    authorization: AUTH_SECRET,
    allowlist: ALLOWLIST ? ALLOWLIST.split(',') : undefined,
    cidSubdomains: CID_SUBDOMAINS === 'true',
    ensSubdomains: ENS_SUBDOMAINS === 'true',
    removePinHeader: REMOVE_PIN_HEADER ? REMOVE_PIN_HEADER === 'true' : true,
    exposeHashedIdentity: EXPOSE_HASHED_IDENTITY === 'true',
    readinessCheck: READINESS_CHECK === 'true',
    homepage: HOMEPAGE,
  }
}

export function getServerConfig({ PORT, HOSTNAME }: EnvironmentVariables = {}): ServerConfig {
  return { hostname: HOSTNAME || DEFAULT_HOSTNAME, port: Number(PORT || DEFAULT_PORT) }
}

export function getStampsConfig({
  BEE_API_URL,
  POSTAGE_STAMP,
  POSTAGE_DEPTH,
  POSTAGE_AMOUNT,
  POSTAGE_USAGE_THRESHOLD,
  POSTAGE_USAGE_MAX,
  POSTAGE_TTL_MIN,
  POSTAGE_REFRESH_PERIOD,
  POSTAGE_EXTENDSTTL,
}: EnvironmentVariables = {}): StampsConfig | undefined {
  const refreshPeriod = Number(POSTAGE_REFRESH_PERIOD || DEFAULT_POSTAGE_REFRESH_PERIOD)
  const beeApiUrl = BEE_API_URL || DEFAULT_BEE_API_URL

  // Start in hardcoded mode
  if (POSTAGE_STAMP) return { mode: 'hardcoded', stamp: POSTAGE_STAMP }
  // Start autobuy
  else if (!POSTAGE_EXTENDSTTL && POSTAGE_DEPTH && POSTAGE_AMOUNT) {
    return {
      mode: 'autobuy',
      depth: Number(POSTAGE_DEPTH),
      amount: POSTAGE_AMOUNT,
      usageThreshold: Number(POSTAGE_USAGE_THRESHOLD || DEFAULT_POSTAGE_USAGE_THRESHOLD),
      usageMax: Number(POSTAGE_USAGE_MAX || DEFAULT_POSTAGE_USAGE_MAX),
      ttlMin: Number(POSTAGE_TTL_MIN || (refreshPeriod / 1000) * 5),
      refreshPeriod,
      beeApiUrl,
    }
  } else if (
    POSTAGE_EXTENDSTTL === 'true' &&
    POSTAGE_AMOUNT &&
    POSTAGE_DEPTH &&
    Number(POSTAGE_TTL_MIN) >= MINIMAL_EXTENDS_TTL_VALUE
  ) {
    return {
      mode: 'extendsTTL',
      depth: Number(POSTAGE_DEPTH),
      ttlMin: Number(POSTAGE_TTL_MIN),
      amount: POSTAGE_AMOUNT,
      refreshPeriod,
      beeApiUrl,
    }
  }
  // Missing one of the variables needed for the autobuy or extends TTL
  else if (POSTAGE_DEPTH || POSTAGE_AMOUNT || POSTAGE_TTL_MIN) {
    throw new Error(
      `config: please provide POSTAGE_DEPTH=${POSTAGE_DEPTH}, POSTAGE_AMOUNT=${POSTAGE_AMOUNT}, POSTAGE_TTL_MIN=${POSTAGE_TTL_MIN} ${
        POSTAGE_EXTENDSTTL === 'true' ? 'at least 60 seconds ' : ''
      }for the feature to work`,
    )
  }

  // Stamps rewrite is disabled
  return undefined
}

export function getContentConfig({ BEE_API_URL, REUPLOAD_PERIOD }: EnvironmentVariables = {}): ContentConfig | false {
  if (!REUPLOAD_PERIOD) {
    return false
  }

  return {
    beeApiUrl: BEE_API_URL || DEFAULT_BEE_API_URL,
    refreshPeriod: Number(REUPLOAD_PERIOD),
  }
}
