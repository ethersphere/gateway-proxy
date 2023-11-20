import * as swarmCid from '@ethersphere/swarm-cid'
import { logger } from './logger'

export class NotEnabledError extends Error {}

export function subdomainToBzz(
  subdomain: string,
  isCidEnabled: boolean,
  isEnsEnabled: boolean,
  remap: Record<string, string>,
): string {
  if (subdomain in remap) {
    return remap[subdomain]
  }
  try {
    const result = swarmCid.decodeCid(subdomain)

    if (!isCidEnabled) {
      logger.warn('cid subdomain support disabled, but got cid', { subdomain })
      throw new NotEnabledError('CID subdomain support is disabled, but got a CID!')
    }

    return result.reference
  } catch (e) {
    if (e instanceof NotEnabledError) {
      throw e
    }

    if (!isEnsEnabled) {
      logger.warn('ens subdomain support disabled, but got ens', { subdomain })
      throw new NotEnabledError('ENS subdomain support is disabled, but got an ENS domain!')
    }

    return `${subdomain}.eth`
  }
}
