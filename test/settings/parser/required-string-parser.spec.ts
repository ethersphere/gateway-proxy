import { requiredStringParser } from '../../../src/settings/parser/required-string-parser'

test('requiredStringParser', () => {
  expect(requiredStringParser.parse('test', 'test')).toEqual('test')
})

test('requiredStringParser error', () => {
  expect(() => requiredStringParser.parse('', 'test')).toThrowError(
    'Could not parse test as string, got nothing. Example: test',
  )
})
