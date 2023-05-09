import { SAMPLE_SETTINGS_YAML } from '../../src/settings/sample-settings'
import { makeSettings } from '../../src/settings/settings-factory'
import { parseYaml } from '../../src/settings/settings-service'

test('settings-service', () => {
  const settings = parseYaml(SAMPLE_SETTINGS_YAML)
  const settingsObject = makeSettings(settings)
  expect(settingsObject).toHaveProperty('bee.api', 'http://localhost:1633')
  expect(settingsObject).toHaveProperty('server.logLevel', 'info')
  expect(settingsObject).toHaveProperty('cid', true)
})

test('settings-service error', () => {
  expect(() => makeSettings({})).toThrowError('Could not parse bee.api as string, got nothing. Example: test')
})
