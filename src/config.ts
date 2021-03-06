export interface AppConfig {
  beeApiUrl: string
  authorization?: string
  hostname?: string
  cidSubdomains?: boolean
  ensSubdomains?: boolean
  removePinHeader?: boolean
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
  depth: number
  amount: string
  beeDebugApiUrl: string
  usageTreshold: number
  usageMax: number
  ttlMin: number
  refreshPeriod: number
}

export type StampsConfig = StampsConfigHardcoded | StampsConfigAutobuy

export type EnvironmentVariables = Partial<{
  // Logging
  LOG_LEVEL: string

  // Proxy
  BEE_API_URL: string
  AUTH_SECRET: string

  // Server
  PORT: string
  HOSTNAME: string

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

export const logLevel =
  process.env.LOG_LEVEL && SUPPORTED_LEVELS.includes(process.env.LOG_LEVEL as SupportedLevels)
    ? process.env.LOG_LEVEL
    : DEFAULT_LOG_LEVEL

export function getAppConfig({
  BEE_API_URL,
  AUTH_SECRET,
  CID_SUBDOMAINS,
  ENS_SUBDOMAINS,
  HOSTNAME,
  REMOVE_PIN_HEADER,
}: EnvironmentVariables = {}): AppConfig {
  return {
    hostname: HOSTNAME || DEFAULT_HOSTNAME,
    beeApiUrl: BEE_API_URL || DEFAULT_BEE_API_URL,
    authorization: AUTH_SECRET,
    cidSubdomains: CID_SUBDOMAINS === 'true',
    ensSubdomains: ENS_SUBDOMAINS === 'true',
    removePinHeader: REMOVE_PIN_HEADER ? REMOVE_PIN_HEADER === 'true' : true,
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
}: EnvironmentVariables = {}): StampsConfig | undefined {
  // Start in hardcoded mode
  if (POSTAGE_STAMP) return { mode: 'hardcoded', stamp: POSTAGE_STAMP }
  // Start autobuy
  else if (POSTAGE_DEPTH && POSTAGE_AMOUNT && BEE_DEBUG_API_URL) {
    const refreshPeriod = Number(POSTAGE_REFRESH_PERIOD || DEFAULT_POSTAGE_REFRESH_PERIOD)

    return {
      mode: 'autobuy',
      depth: Number(POSTAGE_DEPTH),
      amount: POSTAGE_AMOUNT,
      beeDebugApiUrl: BEE_DEBUG_API_URL,
      usageTreshold: Number(POSTAGE_USAGE_THRESHOLD || DEFAULT_POSTAGE_USAGE_THRESHOLD),
      usageMax: Number(POSTAGE_USAGE_MAX || DEFAULT_POSTAGE_USAGE_MAX),
      ttlMin: Number(POSTAGE_TTL_MIN || (refreshPeriod / 1000) * 5),
      refreshPeriod,
    }
  }
  // Missing one of the variables needed for the autobuy
  else if (POSTAGE_DEPTH || POSTAGE_AMOUNT || BEE_DEBUG_API_URL) {
    throw new Error(
      'config: please provide POSTAGE_DEPTH, POSTAGE_AMOUNT and BEE_DEBUG_API_URL for the autobuy to work',
    )
  }

  // Stamps rewrite is disabled
  return undefined
}
