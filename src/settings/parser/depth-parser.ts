import { OutOfBoundsError, ParsingError } from './parsing-error'

export const depthParser = {
  parse(value: string, field: string): number {
    const parsed = Number(value)

    if (!parsed) {
      throw new ParsingError(field, value, 'depth', '22')
    }

    if (parsed < 20 || parsed > 64) {
      throw new OutOfBoundsError(field, value, `Depth must be between 20 and 64.`)
    }

    return parsed
  },
}
