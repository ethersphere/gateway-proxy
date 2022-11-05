import { isInteger, assertBoolean, assertInteger, assertDecimal } from './utils'

export interface AppConfig {
  beeApiUrl: string
  beeDebugApiUrl: string
  authorization?: string
  hostname?: string
  cidSubdomains?: boolean
  ensSubdomains?: boolean
  removePinHeader?: boolean
  exposeHashedIdentity?: boolean
}

export interface ServerConfig {
  hostname: string
  port: number
}

interface StampsConfigHardcoded {
  mode: 'hardcoded'
  stamp: string
}

export interface StampsConfigAutobuy {
  mode: 'autobuy'
  ttlMin: number
  depth: number
  amount: string
  usageThreshold: number
  refreshPeriod: number
  usageMax: number
  beeDebugApiUrl: string
}

export interface StampsConfigExtends {
  mode: 'extends'
  enableTtl: boolean
  enableCapacity: boolean
  ttlMin: number
  depth: number
  amount: string
  usageThreshold: number
  refreshPeriod: number
  beeDebugApiUrl: string
}

export interface ContentConfigReupload {
  beeApiUrl: string
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

  // Server
  PORT: string
  HOSTNAME: string

  // Identity
  EXPOSE_HASHED_IDENTITY: string

  // CID subdomain support
  CID_SUBDOMAINS: string
  ENS_SUBDOMAINS: string

  // Headers manipulation
  REMOVE_PIN_HEADER: string

  // Stamps
  BEE_DEBUG_API_URL: string
  POSTAGE_STAMP: string
  POSTAGE_DEPTH: string
  POSTAGE_AMOUNT: string
  POSTAGE_USAGE_THRESHOLD: string
  POSTAGE_USAGE_MAX: string
  POSTAGE_TTL_MIN: string
  POSTAGE_REFRESH_PERIOD: string
  POSTAGE_EXTENDSTTL: string
  REUPLOAD_PERIOD: string
  POSTAGE_EXTENDS_CAPACITY: string
}>

export const SUPPORTED_LEVELS = ['critical', 'error', 'warn', 'info', 'verbose', 'debug'] as const
export type SupportedLevels = typeof SUPPORTED_LEVELS[number]

export const DEFAULT_BEE_API_URL = 'http://localhost:1633'
export const DEFAULT_BEE_DEBUG_API_URL = 'http://localhost:1635'
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
  BEE_DEBUG_API_URL,
  AUTH_SECRET,
  CID_SUBDOMAINS,
  ENS_SUBDOMAINS,
  HOSTNAME,
  REMOVE_PIN_HEADER,
  EXPOSE_HASHED_IDENTITY,
}: EnvironmentVariables = {}): AppConfig {
  return {
    hostname: HOSTNAME || DEFAULT_HOSTNAME,
    beeApiUrl: BEE_API_URL || DEFAULT_BEE_API_URL,
    beeDebugApiUrl: BEE_DEBUG_API_URL || DEFAULT_BEE_DEBUG_API_URL,
    authorization: AUTH_SECRET,
    cidSubdomains: CID_SUBDOMAINS === 'true',
    ensSubdomains: ENS_SUBDOMAINS === 'true',
    removePinHeader: REMOVE_PIN_HEADER ? REMOVE_PIN_HEADER === 'true' : true,
    exposeHashedIdentity: EXPOSE_HASHED_IDENTITY === 'true',
  }
}

export function getServerConfig({ PORT, HOSTNAME }: EnvironmentVariables = {}): ServerConfig {
  return { hostname: HOSTNAME || DEFAULT_HOSTNAME, port: Number(PORT || DEFAULT_PORT) }
}

export function getStampsConfig({
  BEE_DEBUG_API_URL,
  POSTAGE_STAMP,
  POSTAGE_DEPTH,
  POSTAGE_AMOUNT,
  POSTAGE_USAGE_THRESHOLD,
  POSTAGE_USAGE_MAX,
  POSTAGE_TTL_MIN,
  POSTAGE_REFRESH_PERIOD,
  POSTAGE_EXTENDSTTL,
  POSTAGE_EXTENDS_CAPACITY,
}: EnvironmentVariables = {}): StampsConfig | undefined {
  if (POSTAGE_REFRESH_PERIOD) {
    assertInteger(POSTAGE_REFRESH_PERIOD)
  }

  const refreshPeriod = Number(POSTAGE_REFRESH_PERIOD || DEFAULT_POSTAGE_REFRESH_PERIOD)
  const beeDebugApiUrl = BEE_DEBUG_API_URL || DEFAULT_BEE_DEBUG_API_URL

  // Start in hardcoded mode
  if (POSTAGE_STAMP) return { mode: 'hardcoded', stamp: POSTAGE_STAMP }
  // Start autobuy
  else if (
    (assertBoolean(POSTAGE_EXTENDSTTL) && POSTAGE_EXTENDSTTL === 'true') ||
    (assertBoolean(POSTAGE_EXTENDS_CAPACITY) && POSTAGE_EXTENDS_CAPACITY === 'true')
  ) {
    return createExtendsStampsConfig(
      POSTAGE_EXTENDSTTL,
      POSTAGE_EXTENDS_CAPACITY,
      POSTAGE_AMOUNT,
      POSTAGE_USAGE_THRESHOLD,
      POSTAGE_TTL_MIN,
      POSTAGE_DEPTH,
      refreshPeriod,
      beeDebugApiUrl,
    )
  } else if (POSTAGE_DEPTH && POSTAGE_AMOUNT && BEE_DEBUG_API_URL) {
    return createAutobuyStampsConfig(
      POSTAGE_DEPTH,
      POSTAGE_AMOUNT,
      POSTAGE_USAGE_THRESHOLD,
      POSTAGE_USAGE_MAX,
      POSTAGE_TTL_MIN,
      refreshPeriod,
      beeDebugApiUrl,
    )
  }
  // Missing one of the variables needed for the autobuy or extends TTL
  else if (POSTAGE_DEPTH || POSTAGE_AMOUNT || POSTAGE_TTL_MIN || BEE_DEBUG_API_URL) {
    throw new Error(
      `config: please provide POSTAGE_DEPTH=${POSTAGE_DEPTH}, POSTAGE_AMOUNT=${POSTAGE_AMOUNT}, POSTAGE_TTL_MIN=${POSTAGE_TTL_MIN}
        or BEE_DEBUG_API_URL=${BEE_DEBUG_API_URL} for the feature to work`,
    )
  }

  // Stamps rewrite is disabled
  return undefined
}

export function createAutobuyStampsConfig(
  POSTAGE_DEPTH: string,
  POSTAGE_AMOUNT: string,
  POSTAGE_USAGE_THRESHOLD: string | undefined,
  POSTAGE_USAGE_MAX: string | undefined,
  POSTAGE_TTL_MIN: string | undefined,
  refreshPeriod: number,
  beeDebugApiUrl: string,
): StampsConfigAutobuy {
  // Missing one of the variables needed for the autobuy
  if (!isInteger(POSTAGE_DEPTH) || !isInteger(POSTAGE_AMOUNT)) {
    throw new Error(
      `config: please provide valid values for POSTAGE_DEPTH, POSTAGE_AMOUNT for the autobuy feature to work.
      Current state are POSTAGE_DEPTH=${POSTAGE_DEPTH} and POSTAGE_AMOUNT=${POSTAGE_AMOUNT}`,
    )
  }

  return {
    mode: 'autobuy',
    depth: Number(POSTAGE_DEPTH),
    amount: POSTAGE_AMOUNT,
    usageThreshold: Number(POSTAGE_USAGE_THRESHOLD || DEFAULT_POSTAGE_USAGE_THRESHOLD),
    usageMax: Number(POSTAGE_USAGE_MAX || DEFAULT_POSTAGE_USAGE_MAX),
    ttlMin: Number(POSTAGE_TTL_MIN || (refreshPeriod / 1000) * 5),
    refreshPeriod,
    beeDebugApiUrl,
  }
}

export function createExtendsStampsConfig(
  POSTAGE_EXTENDSTTL: string | undefined,
  POSTAGE_EXTENDS_CAPACITY: string | undefined,
  POSTAGE_AMOUNT: string | undefined,
  POSTAGE_USAGE_THRESHOLD: string | undefined,
  POSTAGE_TTL_MIN: string | undefined,
  POSTAGE_DEPTH: string | undefined,
  refreshPeriod: number,
  beeDebugApiUrl: string,
): StampsConfigExtends {
  if (
    assertBoolean(POSTAGE_EXTENDSTTL) &&
    POSTAGE_EXTENDSTTL === 'true' &&
    (Number(POSTAGE_TTL_MIN) < MINIMAL_EXTENDS_TTL_VALUE ||
      !isInteger(POSTAGE_AMOUNT) ||
      (POSTAGE_TTL_MIN && !isInteger(POSTAGE_TTL_MIN)) ||
      (POSTAGE_DEPTH && !isInteger(POSTAGE_DEPTH)))
  ) {
    throw new Error(
      `config: to extends stamps TTL please provide POSTAGE_TTL_MIN bigger than ${MINIMAL_EXTENDS_TTL_VALUE}, valid values for
      POSTAGE_AMOUNT, POSTAGE_TTL_MIN, POSTAGE_DEPTH. Current states are
      POSTAGE_TTL_MIN=${POSTAGE_TTL_MIN}, POSTAGE_AMOUNT=${POSTAGE_AMOUNT}, POSTAGE_TTL_MIN=${POSTAGE_TTL_MIN} and POSTAGE_DEPTH=${POSTAGE_DEPTH}`,
    )
  }

  if (
    assertBoolean(POSTAGE_EXTENDS_CAPACITY) &&
    POSTAGE_EXTENDS_CAPACITY === 'true' &&
    POSTAGE_USAGE_THRESHOLD &&
    !assertDecimal(POSTAGE_USAGE_THRESHOLD)
  ) {
    throw new Error(
      `config: to extends capacity please provide valid number for POSTAGE_USAGE_THRESHOLD. Current states is
      POSTAGE_USAGE_THRESHOLD=${POSTAGE_USAGE_THRESHOLD}`,
    )
  }

  const amount = POSTAGE_AMOUNT || '0'
  const usageThreshold = Number(POSTAGE_USAGE_THRESHOLD || DEFAULT_POSTAGE_USAGE_THRESHOLD)
  const ttlMin = Number(POSTAGE_TTL_MIN)
  const depth = Number(POSTAGE_DEPTH)

  return {
    mode: 'extends',
    enableTtl: POSTAGE_EXTENDSTTL === 'true',
    enableCapacity: POSTAGE_EXTENDS_CAPACITY === 'true',
    depth,
    ttlMin,
    amount,
    usageThreshold,
    refreshPeriod,
    beeDebugApiUrl,
  }
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
