import { optionalStringParser } from '../../../src/settings/parser/optional-string-parser'

test('optionalStringParser', () => {
  expect(optionalStringParser.parse('', 'test')).toEqual('')
  expect(optionalStringParser.parse('test', 'test')).toEqual('test')
})
