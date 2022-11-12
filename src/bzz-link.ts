import { Request, Response } from 'express'
import * as swarmCid from '@ethersphere/swarm-cid'
import { logger } from './logger'
import { resolve, Result } from '@dnslink/js'
import { DEFAULT_QUERY_DNSLINK_ENDPOINT } from './config'

export class NotEnabledError extends Error {}

export class RedirectCidError extends Error {
  public newUrl: string

  constructor(message: string, cid: string) {
    super(message)
    this.newUrl = cid
  }
}

export class NoDNSLinkFoundError extends Error {}

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
 * Function that search for DNSLink configuration on TXT records
 *
 * @param domain
 */
async function dnsLookup(domain: string, queryDnsLinkEndpoint = DEFAULT_QUERY_DNSLINK_ENDPOINT): Promise<Result> {
  let result = null
  try {
    result = await resolve(domain, {
      endpoints: [queryDnsLinkEndpoint],
      timeout: 1000, // timeout for the operation
      retries: 3, // retries in case of transport error
    })
  } catch (ex) {
    logger.error(`dnslink lookup error`, ex)
    throw new NoDNSLinkFoundError(`dnslink lookup error resolving domain ${domain}`)
  }

  return result
}

/**
 * Closure that routes subdomain CID/ENS to /bzz endpoint.
 *
 * @param target
 * @param isCidEnabled
 * @param isEnsEnabled
 */
export function routerClosure(
  target: string,
  domain: string,
  isCidEnabled: boolean,
  isEnsEnabled: boolean,
  isDnslinkEnabled: boolean,
  dnsQuery?: string,
): { (req: Request): Promise<string> } {
  return async (req: Request): Promise<string> => {
    if (isDnslinkEnabled) {
      const result = await dnsLookup(domain, dnsQuery)

      const { txtEntries } = result
      const bzzResource = JSON.parse(JSON.stringify(txtEntries[0])).value.split('/')[2]
      logger.info(`bzz link proxy`, { hostname: req.hostname, bzzResource })

      return `${target}/bzz/${bzzResource}`
    } else {
      const bzzResource = subdomainToBzz(req, isCidEnabled, isEnsEnabled)
      logger.info(`bzz link proxy`, { hostname: req.hostname, bzzResource })

      return `${target}/bzz/${bzzResource}`
    }
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
