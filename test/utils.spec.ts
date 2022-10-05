import { getErrorMessage } from '../src/utils'

test('getErrorMessage', () => {
  expect(getErrorMessage('error')).toEqual('error')
  expect(getErrorMessage(new Error('error'))).toEqual('error')
  expect(getErrorMessage(undefined)).toEqual(undefined)
})
