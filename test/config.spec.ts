import {
  DEFAULT_BEE_API_URL,
  DEFAULT_HOSTNAME,
  DEFAULT_PORT,
  DEFAULT_POSTAGE_USAGE_THRESHOLD,
  DEFAULT_POSTAGE_USAGE_MAX,
  DEFAULT_POSTAGE_REFRESH_PERIOD,
  getAppConfig,
  getServerConfig,
  getStampsConfig,
  EnvironmentVariables,
  StampsConfig,
} from '../src/config'

describe('getAppConfig', () => {
  it('should return default values', () => {
    const config = getAppConfig()
    expect(config.beeApiUrl).toEqual(DEFAULT_BEE_API_URL)
    expect(config.authorization).toBeUndefined()
  })

  it('should set beeUrl and authorization', () => {
    const BEE_API_URL = 'http://whatever.local'
    const AUTH_SECRET = 'some_super_secret_string'

    const config = getAppConfig({ BEE_API_URL, AUTH_SECRET })
    expect(config.beeApiUrl).toEqual(BEE_API_URL)
    expect(config.authorization).toEqual(AUTH_SECRET)
  })

  it('should set removePinHeader correctly', () => {
    const configDefault = getAppConfig()

    expect(configDefault.removePinHeader).toEqual(true)

    const configTrue = getAppConfig({ REMOVE_PIN_HEADER: 'true' })

    expect(configTrue.removePinHeader).toEqual(true)

    const configFalse = getAppConfig({ REMOVE_PIN_HEADER: 'false' })

    expect(configFalse.removePinHeader).toEqual(false)
  })
})

describe('getServerConfig', () => {
  it('should return default values', () => {
    const config = getServerConfig()
    expect(config.hostname).toEqual(DEFAULT_HOSTNAME)
    expect(config.port).toEqual(DEFAULT_PORT)
  })

  it('should set port and host', () => {
    const HOSTNAME = '0.0.0.0'
    const PORT = '5000'

    const config = getServerConfig({ HOSTNAME, PORT })
    expect(config.hostname).toEqual(HOSTNAME)
    expect(config.port).toEqual(Number(PORT))
  })
})

describe('getStampsConfig', () => {
  const POSTAGE_STAMP = 'f1e4ff753ea1cb923269ed0cda909d13a10d624719edf261e196584e9e764e50'
  const POSTAGE_AMOUNT = '100'
  const POSTAGE_DEPTH = '20'
  const BEE_DEBUG_API_URL = 'http://localhost:1635'
  const POSTAGE_USAGE_THRESHOLD = '0.6'
  const POSTAGE_USAGE_MAX = '0.8'
  const POSTAGE_TTL_MIN = '200'
  const POSTAGE_REFRESH_PERIOD = '10'

  const values: { env: EnvironmentVariables; output: StampsConfig | undefined; description: string }[] = [
    { description: 'undefined for no input', env: {}, output: undefined },
    {
      description: '{mode: hardcoded, stamp} for {POSTAGE_STAMP}',
      env: { POSTAGE_STAMP },
      output: { mode: 'hardcoded', stamp: POSTAGE_STAMP },
    },
    {
      description: '{mode: hardcoded, stamp} for when both hardcoded and autobuy values are provided',
      env: { POSTAGE_STAMP, POSTAGE_AMOUNT, POSTAGE_DEPTH, BEE_DEBUG_API_URL },
      output: { mode: 'hardcoded', stamp: POSTAGE_STAMP },
    },
    {
      description: '{mode: autobuy, ...} with default values',
      env: { POSTAGE_AMOUNT, POSTAGE_DEPTH, BEE_DEBUG_API_URL },
      output: {
        mode: 'autobuy',
        depth: Number(POSTAGE_DEPTH),
        amount: POSTAGE_AMOUNT,
        beeDebugApiUrl: BEE_DEBUG_API_URL,
        usageTreshold: DEFAULT_POSTAGE_USAGE_THRESHOLD,
        usageMax: DEFAULT_POSTAGE_USAGE_MAX,
        ttlMin: (DEFAULT_POSTAGE_REFRESH_PERIOD / 1000) * 5,
        refreshPeriod: DEFAULT_POSTAGE_REFRESH_PERIOD,
      },
    },
    {
      description: '{mode: autobuy, ...} with overwritten default values',
      env: {
        POSTAGE_AMOUNT,
        POSTAGE_DEPTH,
        BEE_DEBUG_API_URL,
        POSTAGE_USAGE_MAX,
        POSTAGE_USAGE_THRESHOLD,
        POSTAGE_TTL_MIN,
        POSTAGE_REFRESH_PERIOD,
      },
      output: {
        mode: 'autobuy',
        depth: Number(POSTAGE_DEPTH),
        amount: POSTAGE_AMOUNT,
        beeDebugApiUrl: BEE_DEBUG_API_URL,
        usageTreshold: Number(POSTAGE_USAGE_THRESHOLD),
        usageMax: Number(POSTAGE_USAGE_MAX),
        ttlMin: Number(POSTAGE_TTL_MIN),
        refreshPeriod: Number(POSTAGE_REFRESH_PERIOD),
      },
    },
    {
      description:
        '{mode: autobuy, ...} with TTL being 5 times the refresh period when no ttl is provided but refresh period is',
      env: { POSTAGE_AMOUNT, POSTAGE_DEPTH, BEE_DEBUG_API_URL, POSTAGE_REFRESH_PERIOD },
      output: {
        mode: 'autobuy',
        depth: Number(POSTAGE_DEPTH),
        amount: POSTAGE_AMOUNT,
        beeDebugApiUrl: BEE_DEBUG_API_URL,
        usageTreshold: DEFAULT_POSTAGE_USAGE_THRESHOLD,
        usageMax: DEFAULT_POSTAGE_USAGE_MAX,
        ttlMin: (Number(POSTAGE_REFRESH_PERIOD) / 1000) * 5,
        refreshPeriod: Number(POSTAGE_REFRESH_PERIOD),
      },
    },
  ]

  values.forEach(({ env, output, description }) => {
    it(`should return ${description}`, () => {
      const config = getStampsConfig(env)
      expect(config).toEqual(output)
    })
  })

  const throwValues: EnvironmentVariables[] = [
    { BEE_DEBUG_API_URL },
    { POSTAGE_DEPTH },
    { POSTAGE_AMOUNT },
    { BEE_DEBUG_API_URL, POSTAGE_DEPTH },
    { BEE_DEBUG_API_URL, POSTAGE_AMOUNT },
    { POSTAGE_DEPTH, POSTAGE_AMOUNT },
  ]

  throwValues.forEach(v => {
    it(`should throw for ${JSON.stringify(v)}`, () => {
      expect(() => {
        getStampsConfig(v)
      }).toThrowError(
        'config: please provide POSTAGE_DEPTH, POSTAGE_AMOUNT and BEE_DEBUG_API_URL for the autobuy to work',
      )
    })
  })
})
