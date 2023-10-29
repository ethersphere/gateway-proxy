import { Request } from 'express'
import { NotEnabledError, requestFilter, subdomainToBzz } from '../src/bzz-link'

describe('bzz.link', () => {
  describe('requestFilter', () => {
    it('should return true for subdomain', async () => {
      const req = { subdomains: ['someEnsName'] } as Request

      expect(requestFilter(req)).toStrictEqual(true)
    })

    it('should return true for multilevel subdomain', async () => {
      const req = { subdomains: ['swarm', 'book'] } as Request

      expect(requestFilter(req)).toStrictEqual(true)
    })

    it('should return false for no subdomain', async () => {
      const req = { subdomains: [] as string[] } as Request

      expect(requestFilter(req)).toStrictEqual(false)
    })
  })

  describe('routerClosure', () => {
    const MANIFEST = {
      cid: 'bah5acgzamh5fl7emnrazttpy7sag6utq5myidv3venspn6l5sevr4lko2n3q',
      reference: '61fa55fc8c6c4199cdf8fc806f5270eb3081d7752364f6f97d912b1e2d4ed377',
    }

    it('should translate valid CID', async () => {
      expect(subdomainToBzz(`${MANIFEST.cid}.some.bee`, 'some.bee', true, true)).toEqual(
        `http://some.bee/bzz/${MANIFEST.reference}`,
      )
    })

    it('should translate valid CID with ENS disabled', async () => {
      expect(subdomainToBzz(`${MANIFEST.cid}.some.bee`, 'some.bee', true, false)).toEqual(
        `http://some.bee/bzz/${MANIFEST.reference}`,
      )
    })

    it('should translate valid ENS', async () => {
      expect(subdomainToBzz('some-ens-domain.some.bee', 'some.bee', true, true)).toEqual(
        `http://some.bee/bzz/some-ens-domain.eth`,
      )
    })

    it('should translate valid ENS with subdomain', async () => {
      expect(subdomainToBzz('book.swarm.bzz.link', 'bzz.link', true, true)).toEqual(
        `http://bzz.link/bzz/book.swarm.eth`,
      )
    })

    it('should translate valid ENS when CID is disabled', async () => {
      expect(subdomainToBzz('some-ens-domain.some.bee', 'some.bee', false, true)).toEqual(
        `http://some.bee/bzz/some-ens-domain.eth`,
      )
    })

    it('should throw when CID support is disabled', async () => {
      expect(() => subdomainToBzz(`${MANIFEST.cid}.some.bee`, 'some.bee', false, true)).toThrow(NotEnabledError)
    })

    it('should throw when ENS support is disabled', async () => {
      expect(() => subdomainToBzz('some-ens-domain.some.bee', 'some.bee', true, false)).toThrow(NotEnabledError)
    })
  })
})
