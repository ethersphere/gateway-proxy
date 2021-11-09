import { StampsManager } from '../src/stamps'

describe('constructor', () => {
  const throwValues = [{ POSTAGE_AMOUNT: '1000' }, { POSTAGE_DEPTH: '20' }]

  throwValues.forEach(param =>
    it('should throw', async () => {
      expect(() => new StampsManager(param)).toThrowError(
        'Please provide POSTAGE_DEPTH, POSTAGE_AMOUNT and BEE_DEBUG_API_URL environment variable',
      )
    }),
  )
})

describe('shouldReplaceStamp', () => {
  it('should return false if no postage stamp is provided', async () => {
    expect(new StampsManager().shouldReplaceStamp).toEqual(false)
  })

  it('should return true if postage stamp is provided', async () => {
    const stamp = '0000000000000000000000000000000000000000000000000000000000000000'
    expect(new StampsManager({ POSTAGE_STAMP: stamp }).shouldReplaceStamp).toEqual(true)
  })
})

describe('getPostageStamp', () => {
  it('should throw if no postage stamp is provided', async () => {
    expect(() => new StampsManager().getPostageStamp).toThrowError('No postage stamp')
  })

  it('should return correct postage stamp', async () => {
    const stamp = '0000000000000000000000000000000000000000000000000000000000000000'
    expect(new StampsManager({ POSTAGE_STAMP: stamp }).getPostageStamp).toEqual(stamp)
  })
})
