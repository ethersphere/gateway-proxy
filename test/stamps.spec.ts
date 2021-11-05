import { getPostageStamp, shouldReplaceStamp } from '../src/stamps'

describe('shouldReplaceStamp', () => {
  it('should return false if no postage stamp is provided', async () => {
    expect(shouldReplaceStamp()).toEqual(false)
  })

  it('should return true if postage stamp is provided', async () => {
    const stamp = '0000000000000000000000000000000000000000000000000000000000000000'
    expect(shouldReplaceStamp({ POSTAGE_STAMP: stamp })).toEqual(true)
  })
})

describe('getPostageStamp', () => {
  it('should throw if no postage stamp is provided', async () => {
    expect(() => getPostageStamp()).toThrowError('No postage stamp')
  })

  it('should return correct postage stamp', async () => {
    const stamp = '0000000000000000000000000000000000000000000000000000000000000000'
    expect(getPostageStamp({ POSTAGE_STAMP: stamp })).toEqual(stamp)
  })
})
