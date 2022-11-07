import { bigNumberParser } from '../../../src/settings/parser/big-number-parser'

test('bigNumberParser', () => {
  expect(bigNumberParser.parse('20', 'test')).toEqual(20)
  expect(bigNumberParser.parse('20k', 'test')).toEqual(20000)
  expect(bigNumberParser.parse('20.5k', 'test')).toEqual(20500)
  expect(bigNumberParser.parse('20K', 'test')).toEqual(20000)
  expect(bigNumberParser.parse('20m', 'test')).toEqual(20000000)
  expect(bigNumberParser.parse('20b', 'test')).toEqual(20000000000)
  expect(bigNumberParser.parse('20t', 'test')).toEqual(20000000000000)
})

test('bigNumberParser error', () => {
  expect(() => bigNumberParser.parse('', 'test')).toThrowError(
    'Could not parse test as number, got nothing. Example: 20',
  )
  expect(() => bigNumberParser.parse('az', 'test')).toThrowError('Could not parse test as number, got az. Example: 20')
  expect(() => bigNumberParser.parse('20x', 'test')).toThrowError(
    'Could not parse test as number, got 20x. Example: 20',
  )
  expect(() => bigNumberParser.parse('-15k', 'test')).toThrowError(
    'Value -15k for test is not acceptable. Number must be positive.',
  )
})
