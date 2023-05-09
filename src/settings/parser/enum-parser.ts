import { ParsingError } from './parsing-error'

export const enumParser = {
  parse<T>(value: string, field: string, options: T[] & string[]): T {
    if (!options.includes(value.toLowerCase())) {
      throw new ParsingError(field, value, 'enum', options.join(', '))
    }

    return value.toLowerCase() as T
  },
}
