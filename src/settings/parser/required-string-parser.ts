import { ParsingError } from './parsing-error'

export const requiredStringParser = {
  parse(value: string, field: string): string {
    if (!value) {
      throw new ParsingError(field, value, 'string', 'test')
    }

    return value
  },
}
