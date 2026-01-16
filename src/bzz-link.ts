import { Reference } from '@ethersphere/bee-js'
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
    const result = new Reference(subdomain)
    const isCid = subdomain === result.toCid('manifest') || subdomain === result.toCid('feed')

    if (isCid && !isCidEnabled) {
      logger.warn('cid subdomain support disabled, but got cid', { subdomain })
      throw new NotEnabledError('CID subdomain support is disabled, but got a CID!')
    }

    return result.toHex()
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
