import { Request, Response } from 'express'
import * as swarmCid from '@ethersphere/swarm-cid'
import { logger } from './logger'

export class NotEnabledError extends Error {}

export class RedirectCidError extends Error {
  public newUrl: string

  constructor(message: string, cid: string) {
    super(message)
    this.newUrl = cid
  }
}

/**
 * Function that evaluates if the request was made with subdomain.
 *
 * @param pathname
 * @param req
 */
export function requestFilter(pathname: string, req: Request): boolean {
  return req.subdomains.length >= 1
}

/**
 * Closure that routes subdomain CID/ENS to /bzz endpoint.
 *
 * @param target
 * @param isCidEnabled
 * @param isEnsEnabled
 */
export function routerClosure(target: string, isCidEnabled: boolean, isEnsEnabled: boolean) {
  return (req: Request): string => {
    const bzzResource = subdomainToBzz(req, isCidEnabled, isEnsEnabled)

    logger.debug(`bzz link proxy`, { hostname: req.hostname, bzzResource })

    return `${target}/bzz/${bzzResource}`
  }
}

/**
 * Express error handler that handles BZZ link error cases.
 *
 * @param err
 * @param req
 * @param res
 * @param next
 */
export function errorHandler(err: Error, req: Request, res: Response, next: (e: Error) => void): void {
  if (res.headersSent) {
    next(err)

    return
  }

  if (err instanceof NotEnabledError) {
    res.writeHead(500).end(`Error 500: ${err.message}`)

    return
  }

  if (err instanceof RedirectCidError) {
    // Using Permanently Moved HTTP code for redirection
    res.redirect(301, err.newUrl)

    return
  }

  next(err)
}

/**
 * Helper function that translates subdomain (CID/ENS) into Bzz resource
 *
 * @param req
 * @param isCidEnabled
 * @param isEnsEnabled
 */
function subdomainToBzz(req: Request, isCidEnabled: boolean, isEnsEnabled: boolean): string {
  const host = req.hostname.split('.')
  const subdomain = [...req.subdomains].reverse().join('.')

  try {
    const result = swarmCid.decodeCid(subdomain)

    if (!isCidEnabled) {
      logger.warn('cid subdomain support disabled, but got cid', { subdomain })
      throw new NotEnabledError('CID subdomain support is disabled, but got a CID!')
    }

    // We got old CID redirect to new one with proper multicodec
    if (result.type === undefined) {
      host[0] = swarmCid.encodeManifestReference(result.reference).toString()
      const newUrl = `${req.protocol}://${host.join('.')}${req.originalUrl}`
      logger.info(`redirecting to new cid`, newUrl)
      throw new RedirectCidError('old CID format, redirect to new one', newUrl)
    }

    return result.reference
  } catch (e) {
    if (e instanceof NotEnabledError || e instanceof RedirectCidError) {
      throw e
    }

    if (!isEnsEnabled) {
      logger.warn('ens subdomain support disabled, but got ens', { subdomain })
      throw new NotEnabledError('ENS subdomain support is disabled, but got an ENS domain!')
    }

    return `${subdomain}.eth`
  }
}
