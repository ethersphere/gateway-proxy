import { getErrorMessage } from '../src/utils'

test('getErrorMessage', () => {
  expect(getErrorMessage('error')).toEqual('error')
  expect(getErrorMessage(42)).toEqual('42')
  expect(getErrorMessage(true)).toEqual('true')
  expect(getErrorMessage(new Error('error'))).toEqual('error')
  expect(getErrorMessage(new Error())).toEqual('')
  expect(getErrorMessage(undefined)).toEqual('undefined')
})
