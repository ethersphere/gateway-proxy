import { Application, Request } from 'express'
import { Server } from 'http'
import { AddressInfo } from 'net'
import request from 'supertest'
import { NoDNSLinkFoundError, NotEnabledError, RedirectCidError, requestFilter, routerClosure } from '../src/bzz-link'
import { DEFAULT_BEE_DEBUG_API_URL } from '../src/config'
import { createApp } from '../src/server'
import { createBzzLinkMockServer } from './bzz-link.mockserver'

describe('bzz.link', () => {
  describe('mock', () => {
    let app: Application
    let server: Server
    let proxy: Server
    let beeMockUrl: string
    beforeAll(async () => {
      server = await createBzzLinkMockServer('cookieName=cookieValue; Domain=localhost')
      const beeMockPort = (server.address() as AddressInfo).port
      beeMockUrl = `http://localhost:${beeMockPort}`

      app = createApp({
        beeApiUrl: beeMockUrl,
        beeDebugApiUrl: DEFAULT_BEE_DEBUG_API_URL,
        hostname: 'bzz.link',
        ensSubdomains: true,
        cidSubdomains: true,
      })
      proxy = await new Promise((resolve, _reject) => {
        const server = app.listen(async () => resolve(server))
      })
    })

    it('should replace the domain for cookies', async () => {
      await request(app)
        .get('/')
        .set('Host', 'some-reference.bzz.link')
        .expect('set-cookie', 'cookieName=cookieValue; Domain=bzz.link')
    })

    afterAll(async () => {
      await new Promise(resolve => server.close(resolve))
      await new Promise(resolve => proxy.close(resolve))
    })
  })

  describe('requestFilter', () => {
    it('should return true for subdomain', async () => {
      const req = { subdomains: ['someEnsName'] } as Request

      expect(requestFilter('', req)).toStrictEqual(true)
    })

    it('should return true for multilevel subdomain', async () => {
      const req = { subdomains: ['swarm', 'book'] } as Request

      expect(requestFilter('', req)).toStrictEqual(true)
    })

    it('should return false for no subdomain', async () => {
      const req = { subdomains: [] as string[] } as Request

      expect(requestFilter('', req)).toStrictEqual(false)
    })
  })

  describe('routerClosure', () => {
    const MANIFEST = {
      cid: 'bah5acgzamh5fl7emnrazttpy7sag6utq5myidv3venspn6l5sevr4lko2n3q',
      legacyCid: 'bafybwidb7jk7zddmigm436h4qbxve4hlgca5o5jdmt3ps7mrfmpc2twto4',
      reference: '61fa55fc8c6c4199cdf8fc806f5270eb3081d7752364f6f97d912b1e2d4ed377',
    }

    it('should translate valid CID', async () => {
      const router = routerClosure('http://some.bee', [], true, true, false)
      const req = { hostname: `${MANIFEST.cid}.bzz.link`, subdomains: [MANIFEST.cid] } as Request

      expect(await router(req)).toEqual(`http://some.bee/bzz/${MANIFEST.reference}`)
    })

    it('should translate valid CID with ENS disabled', async () => {
      const router = routerClosure('http://some.bee', [], true, false, false)
      const req = { hostname: `${MANIFEST.cid}.bzz.link`, subdomains: [MANIFEST.cid] } as Request

      expect(await router(req)).toEqual(`http://some.bee/bzz/${MANIFEST.reference}`)
    })

    it('should translate valid ENS', async () => {
      const router = routerClosure('http://some.bee', [], true, true, false)
      const req = { hostname: `some-ens-domain.bzz.link`, subdomains: ['some-ens-domain'] } as Request

      expect(await router(req)).toEqual(`http://some.bee/bzz/some-ens-domain.eth`)
    })

    it('should translate valid ENS with subdomain', async () => {
      const router = routerClosure('http://some.bee', [], true, true, false)
      const req = { hostname: `book.swarm.bzz.link`, subdomains: ['swarm', 'book'] } as Request

      expect(await router(req)).toEqual(`http://some.bee/bzz/book.swarm.eth`)
    })

    it('should translate valid ENS when CID is disabled', async () => {
      const router = routerClosure('http://some.bee', [], false, true, false)
      const req = { hostname: `some-ens-domain.bzz.link`, subdomains: ['some-ens-domain'] } as Request

      expect(await router(req)).toEqual(`http://some.bee/bzz/some-ens-domain.eth`)
    })

    it('should throw redirection error for legacy CID', async () => {
      const router = routerClosure('http://some.bee', [], true, true, false)
      const req = {
        hostname: `${MANIFEST.legacyCid}.bzz.link`,
        protocol: 'http',
        originalUrl: '/',
        subdomains: [MANIFEST.legacyCid],
      } as Request

      try {
        await router(req)
        throw new Error('Should have thrown an RedirectCidError')
      } catch (e) {
        if (!(e instanceof RedirectCidError)) {
          throw e
        }

        expect(e.newUrl).toEqual(`http://${MANIFEST.cid}.bzz.link/`)
      }
    })

    it('should throw when CID support is disabled', async () => {
      const router = routerClosure('http://some.bee', [], false, true, false)
      const req = { hostname: `${MANIFEST.cid}.bzz.link`, subdomains: [MANIFEST.cid] } as Request

      expect(async () => router(req)).rejects.toThrow(NotEnabledError)
    })

    it('should throw when ENS support is disabled', async () => {
      const router = routerClosure('http://some.bee', [], true, false, false)
      const req = { hostname: `some-ens-domain.bzz.link`, subdomains: ['some-ens-domain'] } as Request

      expect(async () => router(req)).rejects.toThrow(NotEnabledError)
    })

    it('should throw when DNSLINK TXT records are not configured', async () => {
      const router = routerClosure(
        'http://some.bee',
        ['swarm.domain.com', 'some-ens-domain.bzz.link'],
        false,
        false,
        true,
        'dns.query',
      )
      const req = {
        hostname: `some-ens-domain.bzz.link`,
        subdomains: ['some-ens-domain'],
        headers: { host: 'swarm.url.com' },
      } as Request

      expect(async () => router(req)).rejects.toThrow(NoDNSLinkFoundError)
    })
  })
})
