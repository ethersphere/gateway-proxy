import { BeeDebug } from '@ethersphere/bee-js'
import { createHash } from 'crypto'

let identity: string | null = null

export function getIdentity(): string {
  return identity || 'unknown'
}

export async function initializeIdentity() {
  if (process.env.BEE_DEBUG_API_URL) {
    const url = process.env.BEE_DEBUG_API_URL
    const beeDebug = new BeeDebug(url)
    const nodeAddresses = await beeDebug.getNodeAddresses()
    const hash = createHash('sha1')
    hash.update(nodeAddresses.overlay)
    identity = hash.digest('hex')
  }
}
