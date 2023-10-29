import axios from 'axios'
import { Dates, Objects, Strings } from 'cafe-utility'
import { Application, Request, Response } from 'express'
import { logger } from './logger'
import { StampsManager } from './stamps'
import { getErrorMessage } from './utils'

export const GET_PROXY_ENDPOINTS = ['/chunks/*', '/bytes/*', '/bzz/*', '/feeds/*']
export const POST_PROXY_ENDPOINTS = ['/chunks', '/bytes', '/bzz', '/soc/*', '/feeds/*']

const SWARM_STAMP_HEADER = 'swarm-postage-batch-id'
const SWARM_PIN_HEADER = 'swarm-pin'

interface Options {
  beeApiUrl: string
  removePinHeader: boolean
  stampManager: StampsManager | null
  allowlist?: string[]
}

export function createProxyEndpoints(app: Application, options: Options) {
  app.get(GET_PROXY_ENDPOINTS, async (req, res) => {
    await fetchAndRespond(req, res, options)
  })
  app.post(POST_PROXY_ENDPOINTS, async (req, res) => {
    await fetchAndRespond(req, res, options)
  })
}

async function fetchAndRespond(req: Request, res: Response, options: Options) {
  const { headers, path } = req

  if (options.removePinHeader) {
    delete headers[SWARM_PIN_HEADER]
  }

  if (req.method === 'POST' && options.stampManager) {
    headers[SWARM_STAMP_HEADER] = options.stampManager.postageStamp
  }
  try {
    const response = await axios({
      method: req.method,
      url: Strings.joinUrl(options.beeApiUrl, path) + Objects.toQueryString(req.query, true),
      data: req.body,
      headers,
      timeout: Dates.minutes(20),
      validateStatus: status => status < 500,
      responseType: 'arraybuffer',
      maxRedirects: 0,
    })

    if (options.allowlist) {
      const currentHash = Strings.searchHex(path, 64)

      if (
        currentHash &&
        (response.headers['content-disposition'] || '').includes('.html') &&
        !options.allowlist.includes(currentHash)
      ) {
        res.status(403).send('Forbidden')

        return
      }
    }

    if (Array.isArray(response.headers['set-cookie'])) {
      response.headers['set-cookie'] = response.headers['set-cookie'].map((cookie: string) => {
        return cookie.replace(/Domain=.*?(;|$)/, `Domain=${req.hostname};`)
      })
    }
    res.set(response.headers).status(response.status).send(response.data)
  } catch (error) {
    res.status(500).send('Internal server error')
    logger.error(`proxy failed: ${getErrorMessage(error)}`)
  }
}
