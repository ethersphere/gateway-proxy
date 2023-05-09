import { percentageParser } from '../../../src/settings/parser/percentage-parser'

test('percentageParser', () => {
  expect(percentageParser.parse('20%', 'test')).toEqual(0.2)
  expect(percentageParser.parse('20.5%', 'test')).toBeCloseTo(0.205, 5)
})

test('percentageParser error', () => {
  expect(() => percentageParser.parse('', 'test')).toThrowError(
    'Could not parse test as percentage, got nothing. Example: 85%',
  )
  expect(() => percentageParser.parse('az', 'test')).toThrowError(
    'Could not parse test as percentage, got az. Example: 85%',
  )
  expect(() => percentageParser.parse('-15', 'test')).toThrowError(
    'Value -15 for test is not acceptable. Percentage must be between 0 and 100.',
  )
})
