import { enumParser } from '../../../src/settings/parser/enum-parser'

test('enumParser', () => {
  expect(enumParser.parse('test', 'test', ['test'])).toEqual('test')
})

test('enumParser error', () => {
  expect(() => enumParser.parse('az', 'test', ['test1', 'test2'])).toThrowError(
    'Could not parse test as enum, got az. Example: test1, test2',
  )
})
