import { logger } from './logger'

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

export interface IStampsConfig {
  mode: 'autobuy' | 'extendsTTL'
  depth: number
  amount: string
  beeDebugApiUrl: string
  usageThreshold: number
  usageMax: number
  ttlMin: number
  refreshPeriod: number
}

export type StampsConfig = StampsConfigHardcoded | IStampsConfig

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
  POSTAGE_EXTENDSTTL: string
}>

export const SUPPORTED_LEVELS = ['critical', 'error', 'warn', 'info', 'verbose', 'debug'] as const
export type SupportedLevels = typeof SUPPORTED_LEVELS[number]

export const DEFAULT_BEE_API_URL = 'http://localhost:1635'
export const DEFAULT_HOSTNAME = 'localhost'
export const DEFAULT_PORT = 3001
export const DEFAULT_POSTAGE_USAGE_THRESHOLD = 0.7
export const DEFAULT_POSTAGE_USAGE_MAX = 0.9
export const DEFAULT_POSTAGE_REFRESH_PERIOD = 60_000
export const DEFAULT_POSTAGE_TTL_MINIMUM = 3600
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

function calculateMinTTL(POSTAGE_TTL_MIN: string | undefined) {
  if (Number(POSTAGE_TTL_MIN) >= DEFAULT_POSTAGE_TTL_MINIMUM) {
    return POSTAGE_TTL_MIN
  }
  logger.warn(`To extend postage stamps, POSTAGE_TTL_MIN needs to be at least ${DEFAULT_POSTAGE_TTL_MINIMUM} seconds.`)
  logger.warn(`ttlMin setting is being increase to this value automatically.`)

  return DEFAULT_POSTAGE_TTL_MINIMUM
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
}: EnvironmentVariables = {}): StampsConfig | undefined {
  const isExtendsTTLMode = POSTAGE_EXTENDSTTL && POSTAGE_EXTENDSTTL === 'true'
  const mandatoryAutobuy = POSTAGE_DEPTH && POSTAGE_AMOUNT && BEE_DEBUG_API_URL

  // Start in hardcoded mode
  if (POSTAGE_STAMP) return { mode: 'hardcoded', stamp: POSTAGE_STAMP }
  // Start autobuy
  else if (validateMandatoryValues(isExtendsTTLMode, mandatoryAutobuy, POSTAGE_AMOUNT)) {
    const refreshPeriod = Number(POSTAGE_REFRESH_PERIOD || DEFAULT_POSTAGE_REFRESH_PERIOD)

    const res = {
      mode: isExtendsTTLMode ? 'extendsTTL' : 'autobuy',
      depth: Number(POSTAGE_DEPTH),
      amount: POSTAGE_AMOUNT,
      beeDebugApiUrl: BEE_DEBUG_API_URL || DEFAULT_BEE_API_URL,
      usageThreshold: Number(POSTAGE_USAGE_THRESHOLD || DEFAULT_POSTAGE_USAGE_THRESHOLD),
      usageMax: Number(POSTAGE_USAGE_MAX || DEFAULT_POSTAGE_USAGE_MAX),
      ttlMin: isExtendsTTLMode
        ? Number(calculateMinTTL(POSTAGE_TTL_MIN))
        : Number(POSTAGE_TTL_MIN || (refreshPeriod / 1000) * 5),
      refreshPeriod,
    } as IStampsConfig

    return res
  }
  // Missing one of the variables needed for the autobuy or extends TTL
  else if (POSTAGE_DEPTH || POSTAGE_AMOUNT || BEE_DEBUG_API_URL || isExtendsTTLMode) {
    throw new Error(
      `config: please provide ${
        !isExtendsTTLMode
          ? 'POSTAGE_DEPTH: ' + POSTAGE_DEPTH + ', POSTAGE_AMOUNT: ' + POSTAGE_AMOUNT + ' and'
          : 'POSTAGE_AMOUNT: ' + POSTAGE_AMOUNT + ' or (Optional)'
      } BEE_DEBUG_API_URL: ${BEE_DEBUG_API_URL} for the ${isExtendsTTLMode ? 'extends TTL' : 'autobuy'} to work`,
    )
  }

  // Stamps rewrite is disabled
  return undefined
}

function validateMandatoryValues(
  isExtendsTTLMode: boolean | '' | undefined,
  mandatoryAutobuy: string | undefined,
  POSTAGE_AMOUNT: string | undefined,
) {
  // if it's autoplay it needs to have POSTAGE_DEPTH && POSTAGE_AMOUNT && BEE_DEBUG_API_URL
  // if it's extended ttl it needs to have only POSTAGE_AMOUNT
  return (!isExtendsTTLMode && mandatoryAutobuy) || (isExtendsTTLMode && POSTAGE_AMOUNT)
}
