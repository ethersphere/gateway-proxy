import { BeeDebug } from '@ethersphere/bee-js'
import { createHash } from 'crypto'
import { logger } from './logger'

let identity = 'unknown'

export function getIdentity(): string {
  return identity
}

export function startIdentityBackgroundJob(frequencyMs = 60_000) {
  logger.info('BEE_DEBUG_API_URL', process.env.BEE_DEBUG_API_URL)

  if (process.env.BEE_DEBUG_API_URL) {
    logger.info(`starting identity background job with frequency ${frequencyMs}ms`)
    setInterval(refreshIdentity, frequencyMs)
  }
}

async function refreshIdentity() {
  const url = process.env.BEE_DEBUG_API_URL as string
  const beeDebug = new BeeDebug(url)
  try {
    const { overlay } = await beeDebug.getNodeAddresses()
    logger.info('bee debug overlay', overlay)
    const hash = createHash('sha1')
    hash.update(overlay)
    identity = hash.digest('hex')
  } catch (e) {
    logger.error('failed to get identity', e)
  }
}
