import { createLogger, format, transports, Logger, Logform } from 'winston'

type SupportedLevels = 'critical' | 'error' | 'warn' | 'info' | 'verbose' | 'debug'

const supportedLevels: Record<SupportedLevels, number> = {
  critical: 0,
  error: 1,
  warn: 2,
  info: 3,
  verbose: 4,
  debug: 5,
}

export const logger: Logger = createLogger({
  // To see more detailed errors, change this to 'debug'
  levels: supportedLevels,
  format: format.combine(
    format.errors({ stack: true }),
    format.metadata(),
    format.timestamp({ format: 'DD/MM hh:mm:ss' }),
    format.colorize(),
    format.printf(formatLogMessage),
  ),
  transports: [new transports.Console()],
})

export function formatLogMessage(info: Logform.TransformableInfo): string {
  const sanitizedMessage = info.message.replace(/\n/g, '\\n')

  const message = `time="${info.timestamp}" level="${info.level}" msg="${sanitizedMessage}" ${JSON.stringify(
    info.metadata,
  )}`

  return message
}
