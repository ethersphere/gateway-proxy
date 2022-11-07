import fs from 'fs'
import { FAILSAFE_SCHEMA, load } from 'js-yaml'
import { SAMPLE_SETTINGS_YAML } from './sample-settings'
import { Settings } from './settings'
import { makeSettings } from './settings-factory'

export function createOrGetSettings(path: string): Settings {
  if (!checkYamlPath(path)) {
    deploySampleSettings(path)
  }

  return makeSettings(loadYamlFromFile(path))
}

export function deploySampleSettings(path: string) {
  fs.writeFileSync(path, SAMPLE_SETTINGS_YAML)
}

export function checkYamlPath(path: string): boolean {
  return fs.existsSync(path)
}

export function loadYamlFromFile(path: string): Record<string, unknown> {
  return parseYaml(fs.readFileSync(path, 'utf8'))
}

export function parseYaml(yaml: string): Record<string, unknown> {
  return load(yaml, {
    schema: FAILSAFE_SCHEMA,
  }) as Record<string, unknown>
}
