import { boolParser } from '../../../src/settings/parser/bool-parser'

test('boolParser', () => {
  expect(boolParser.parse('true', 'test')).toEqual(true)
  expect(boolParser.parse('false', 'test')).toEqual(false)
})

test('boolParser error', () => {
  expect(() => boolParser.parse('', 'test')).toThrowError('Could not parse test as boolean, got nothing. Example: true')
  expect(() => boolParser.parse('az', 'test')).toThrowError('Could not parse test as boolean, got az. Example: true')
})
