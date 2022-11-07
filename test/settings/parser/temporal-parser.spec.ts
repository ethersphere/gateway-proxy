import { temporalParser } from '../../../src/settings/parser/temporal-parser'

test('temporalParser', () => {
  expect(temporalParser.parse('1s', 'test')).toEqual(1000)
  expect(temporalParser.parse('1m', 'test')).toEqual(60000)
  expect(temporalParser.parse('1h', 'test')).toEqual(3600000)
  expect(temporalParser.parse('1d', 'test')).toEqual(86400000)
})

test('temporalParser error', () => {
  expect(() => temporalParser.parse('', 'test')).toThrowError(
    "Value nothing for test is not acceptable. Unit must be 's', 'm', 'h' or 'd'.",
  )
  expect(() => temporalParser.parse('az', 'test')).toThrowError('Could not parse test as time, got az. Example: 20s')
  expect(() => temporalParser.parse('20x', 'test')).toThrowError('Could not parse test as time, got 20x. Example: 20s')
  expect(() => temporalParser.parse('-15k', 'test')).toThrowError(
    'Could not parse test as time, got -15k. Example: 20s',
  )
})
