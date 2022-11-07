export class ParsingError extends Error {
  constructor(field: string, badValue: string, label: string, example: string) {
    super(`Could not parse ${field} as ${label}, got ${badValue || 'nothing'}. Example: ${example}`)
  }
}

export class OutOfBoundsError extends Error {
  constructor(field: string, badValue: string, reason: string) {
    super(`Value ${badValue || 'nothing'} for ${field} is not acceptable. ${reason}`)
  }
}
