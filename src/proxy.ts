import axios from 'axios'
import { Dates, Objects, Strings, Types } from 'cafe-utility'
import { Application, Response } from 'express'
import { IncomingHttpHeaders } from 'http'
import { subdomainToBzz } from './bzz-link'
import { logger } from './logger'
import { StampsManager } from './stamps'
import { getErrorMessage } from './utils'

export const GET_PROXY_ENDPOINTS = ['/chunks/*', '/bytes/*', '/bzz/*', '/feeds/*']
export const POST_PROXY_ENDPOINTS = ['/chunks', '/bytes', '/bzz', '/soc/*', '/feeds/*']

const BAD_PATH = `bzz/${'00'.repeat(32)}`
const SWARM_STAMP_HEADER = 'swarm-postage-batch-id'
const SWARM_PIN_HEADER = 'swarm-pin'

interface Options {
  beeApiUrl: string
  removePinHeader: boolean
  stampManager: StampsManager | null
  allowlist?: string[]
  hostname?: string
  cidSubdomains?: boolean
  ensSubdomains?: boolean
  remap: Record<string, string>
  userAgents?: string[]
}

export function createProxyEndpoints(app: Application, options: Options) {
  app.use(async (req, res, next) => {
    const subdomain = options.hostname && req.hostname ? Strings.before(req.hostname, options.hostname) : null

    if (!options.hostname || !subdomain || req.method !== 'GET') {
      next()

      return
    }

    try {
      const newUrl = subdomainToBzz(
        subdomain.slice(0, -1), // remove trailing dot
        options.cidSubdomains ?? false,
        options.ensSubdomains ?? false,
        options.remap,
      )
      await fetchAndRespond(
        'GET',
        Strings.joinUrl('bzz', newUrl, req.path),
        req.query,
        req.headers,
        req.body,
        res,
        options,
      )
    } catch (error) {
      logger.error(`proxy failed: ${getErrorMessage(error)}`)
      res.status(500).send('Internal server error')
    }
  })
  app.get(GET_PROXY_ENDPOINTS, async (req, res) => {
    if (req.path.includes(BAD_PATH)) {
      res.status(400)
      res.send({ error: 'bad path' })

      return
    }
    await fetchAndRespond('GET', req.path, req.query, req.headers, req.body, res, options)
  })
  app.post(POST_PROXY_ENDPOINTS, async (req, res) => {
    await fetchAndRespond('POST', req.path, req.query, req.headers, req.body, res, options)
  })
}

async function fetchAndRespond(
  method: 'GET' | 'POST',
  path: string,
  query: Record<string, unknown>,
  headers: IncomingHttpHeaders,
  body: any,
  res: Response,
  options: Options,
) {
  if (options.removePinHeader) {
    delete headers[SWARM_PIN_HEADER]
  }

  try {
    if (method === 'POST' && options.stampManager) {
      headers[SWARM_STAMP_HEADER] = options.stampManager.postageStamp
    }
    let response = await axios({
      method,
      url: Strings.joinUrl(options.beeApiUrl, path) + Objects.toQueryString(query, true),
      data: body,
      headers,
      timeout: Dates.minutes(20),
      validateStatus: status => status < 500,
      responseType: 'arraybuffer',
      maxRedirects: 0,
    })

    if (response.status === 404 || (response.status >= 300 && response.status < 400)) {
      const url = Strings.joinUrl(options.beeApiUrl, path) + '.html' + Objects.toQueryString(query, true)
      const probeResponse = await axios({
        method,
        url,
        data: body,
        headers,
        timeout: Dates.minutes(20),
        validateStatus: status => status < 500,
        responseType: 'arraybuffer',
        maxRedirects: 0,
      })

      if (probeResponse.status >= 200 && probeResponse.status < 300) {
        response = probeResponse
      }
    }

    let isHtml = false
    const sliceFn = Objects.getDeep(response.data, 'slice')

    if (Types.isFunction(sliceFn)) {
      const beginning = (sliceFn.call(response.data, 0, 50) as Buffer).toString('utf8')
      isHtml = beginning.toLowerCase().startsWith('<!doctype html')
    }

    if (isHtml && response.headers['content-type'] !== 'text/html') {
      response.headers['content-type'] = 'text/html'
    }

    if (options.allowlist) {
      const allowed = (options.userAgents || [])
        .filter(x => x)
        .some(x => headers['user-agent']?.toLowerCase().includes(x.toLowerCase()))

      const currentCid = Strings.searchSubstring(path, x => x.length > 48 && x.startsWith('bah'))
      const currentHash = Strings.searchHex(path, 64)

      const isBlockedHash = currentHash && !options.allowlist.includes(currentHash)
      const isBlockedCid = currentCid && !options.allowlist.includes(currentCid)

      if (
        !allowed &&
        (isBlockedHash || isBlockedCid) &&
        ((response.headers['content-disposition'] || '').toLowerCase().includes('.htm') || isHtml)
      ) {
        res.status(403).send('Forbidden')

        return
      }
    }

    // remove headers that should not be forwarded
    delete response.headers['content-length']
    delete response.headers['content-encoding']
    delete response.headers['transfer-encoding']
    delete response.headers['connection']
    delete response.headers['etag']
    delete response.headers['last-modified']
    delete response.headers['cache-control']

    res.set(response.headers).status(response.status).send(response.data)
  } catch (error) {
    res.status(500).send('Internal server error')
    logger.error(`proxy failed: ${getErrorMessage(error)}`)
  }
}
