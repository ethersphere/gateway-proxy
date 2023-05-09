import { ParsingError } from './parsing-error'

export const boolParser = {
  parse(value: string, field: string): boolean {
    const parsed = value.toLowerCase()

    if (parsed === 'true') {
      return true
    }

    if (parsed === 'false') {
      return false
    }

    throw new ParsingError(field, value, 'boolean', 'true or false')
  },
}
