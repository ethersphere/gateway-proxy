import { OutOfBoundsError, ParsingError } from './parsing-error'

const multiplierMap: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
}

export const temporalParser = {
  parse(value: string, field: string): number {
    const rawNumber = value.match(/[0-9]+/)?.[0]
    const rawUnit = value.match(/[a-zA-Z]+/)?.[0]

    if (!rawUnit) {
      throw new OutOfBoundsError(field, value, "Unit must be 's', 'm', 'h' or 'd'.")
    }

    const number = Number(rawNumber)
    const unit = rawUnit.trim().charAt(0).toLowerCase()

    if (isNaN(number)) {
      throw new ParsingError(field, value, 'time', '20s')
    }

    if (number < 0) {
      throw new OutOfBoundsError(field, value, `Time must be positive.`)
    }

    if (!multiplierMap[unit]) {
      throw new ParsingError(field, value, 'time', '20s')
    }

    return number * multiplierMap[unit]
  },
}
