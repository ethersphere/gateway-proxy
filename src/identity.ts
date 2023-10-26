import { BeeDebug } from '@ethersphere/bee-js'
import { createHash } from 'crypto'
import { logger } from './logger'

let interval: NodeJS.Timer | null
let identity = 'unknown'

export const HASHED_IDENTITY_HEADER = 'X-Bee-Node'

/**
 * Identity is not available during Bee's booting,
 * so we retry the call until we receive proper identity and then stop the retries.
 */
export function getHashedIdentity(): string {
  return identity
}

export async function fetchBeeIdentity(beeDebug: BeeDebug, frequencyMs = 15_000) {
  logger.info(`fetching bee identity with frequency ${frequencyMs}ms`)

  if (!(await attemptFetchingBeeIdentity(beeDebug))) {
    interval = setInterval(async () => attemptFetchingBeeIdentity(beeDebug), frequencyMs)
  }
}

async function attemptFetchingBeeIdentity(beeDebug: BeeDebug) {
  try {
    const { overlay } = await beeDebug.getNodeAddresses()
    identity = mapAddress(overlay)
    logger.info('bee debug overlay', { overlay, identity })
    clearInterval(interval as NodeJS.Timer)

    return true
  } catch (error) {
    logger.error('failed to fetch identity', error)
  }
}

function mapAddress(overlay: string): string {
  const hash = createHash('sha1')
  hash.update(overlay)

  return hash.digest('hex')
}
