import { depthParser } from '../../../src/settings/parser/depth-parser'

test('depthParser', () => {
  expect(depthParser.parse('20', 'test')).toEqual(20)
})

test('depthParser error', () => {
  expect(() => depthParser.parse('', 'test')).toThrowError('Could not parse test as depth, got nothing. Example: 22')
  expect(() => depthParser.parse('az', 'test')).toThrowError('Could not parse test as depth, got az. Example: 22')
  expect(() => depthParser.parse('-15', 'test')).toThrowError(
    'Value -15 for test is not acceptable. Depth must be between 20 and 64.',
  )
})
