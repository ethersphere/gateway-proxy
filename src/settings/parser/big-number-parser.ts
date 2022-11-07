import { OutOfBoundsError, ParsingError } from './parsing-error'

const multiplierMap: Record<string, number> = {
  identity: 1,
  k: 1000,
  m: 1000 * 1000,
  b: 1000 * 1000 * 1000,
  t: 1000 * 1000 * 1000 * 1000,
}

export const bigNumberParser = {
  parse(value: string, field: string): number {
    const rawNumber = value.match(/\-?[0-9]+(\.[0-9]+)?/)?.[0]
    const rawUnit = value.match(/[a-zA-Z]+/)?.[0]
    const number = Number(rawNumber)
    const unit = rawUnit ? rawUnit.trim().charAt(0).toLowerCase() : 'identity'

    if (isNaN(number)) {
      throw new ParsingError(field, value, 'number', '20m')
    }

    if (number < 0) {
      throw new OutOfBoundsError(field, value, `Number must be positive.`)
    }

    if (!multiplierMap[unit]) {
      throw new ParsingError(field, value, 'number', '20m')
    }

    return number * multiplierMap[unit]
  },
}
