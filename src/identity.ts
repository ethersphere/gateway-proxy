import { BeeDebug } from '@ethersphere/bee-js'
import { createHash } from 'crypto'
import { logger } from './logger'

let interval: NodeJS.Timer | null
let identity = 'unknown'

export function getIdentity(): string {
  return identity
}

export function fetchBeeIdentity(frequencyMs = 15_000) {
  if (process.env.BEE_DEBUG_API_URL) {
    logger.info(`fetching bee identity with frequency ${frequencyMs}ms`)
    interval = setInterval(attemptFetchingBeeIdentity, frequencyMs)
  }
}

async function attemptFetchingBeeIdentity() {
  const url = process.env.BEE_DEBUG_API_URL as string
  const beeDebug = new BeeDebug(url)
  try {
    const { overlay } = await beeDebug.getNodeAddresses()
    identity = mapAddress(overlay)
    logger.info('bee debug overlay', { overlay, identity })
    clearInterval(interval as NodeJS.Timer)
  } catch (e) {
    logger.error('failed to fetch identity', e)
  }
}

function mapAddress(overlay: string): string {
  const hash = createHash('sha1')
  hash.update(overlay)

  return hash.digest('hex')
}
