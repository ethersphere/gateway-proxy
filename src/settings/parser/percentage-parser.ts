import { OutOfBoundsError, ParsingError } from './parsing-error'

export const percentageParser = {
  parse(value: string, field: string): number {
    const parsed = parseFloat(value)

    if (isNaN(parsed)) {
      throw new ParsingError(field, value, 'percentage', '85%')
    }

    if (parsed < 0 || parsed > 100) {
      throw new OutOfBoundsError(field, value, `Percentage must be between 0 and 100.`)
    }

    return parsed * 0.01
  },
}
