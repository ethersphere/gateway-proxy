import * as swarmCid from '@ethersphere/swarm-cid'
import { Strings } from 'cafe-utility'
import { logger } from './logger'

export class NotEnabledError extends Error {}

export function subdomainToBzz(
  requestHostname: string,
  appHostname: string,
  isCidEnabled: boolean,
  isEnsEnabled: boolean,
): string {
  let relevantSubdomain = Strings.before(requestHostname, appHostname)

  if (relevantSubdomain.endsWith('.')) {
    relevantSubdomain = Strings.beforeLast(relevantSubdomain, '.')
  }

  try {
    const result = swarmCid.decodeCid(relevantSubdomain)

    if (!isCidEnabled) {
      logger.warn('cid subdomain support disabled, but got cid', { relevantSubdomain })
      throw new NotEnabledError('CID subdomain support is disabled, but got a CID!')
    }

    return result.reference
  } catch (e) {
    if (e instanceof NotEnabledError) {
      throw e
    }

    if (!isEnsEnabled) {
      logger.warn('ens subdomain support disabled, but got ens', { relevantSubdomain })
      throw new NotEnabledError('ENS subdomain support is disabled, but got an ENS domain!')
    }

    return `${relevantSubdomain}.eth`
  }
}
