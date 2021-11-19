import { createLogger, format, transports, Logger, Logform } from 'winston'
import { SupportedLevels, SUPPORTED_LEVELS, logLevel } from './config'

const supportedLevels: Record<SupportedLevels, number> = SUPPORTED_LEVELS.reduce(
  (acc, cur, idx) => ({ ...acc, [cur]: idx }),
  {} as Record<SupportedLevels, number>,
)

export const logger: Logger = createLogger({
  // To see more detailed errors, change this to 'debug'
  levels: supportedLevels,
  format: format.combine(
    format.errors({ stack: true }),
    format.metadata(),
    format.timestamp(),
    format.printf(formatLogMessage),
    format.colorize({ all: true }),
  ),
  transports: [new transports.Console({ level: logLevel })],
})

logger.info(`using max log level=${logLevel}`)

export function formatLogMessage(info: Logform.TransformableInfo): string {
  const sanitizedMessage = info.message.replace(/\n/g, '\\n')

  let message = `time="${info.timestamp}" level="${info.level}" msg="${sanitizedMessage}"`

  if (Object.keys(info.metadata).length > 0) message = `${message} ${JSON.stringify(info.metadata)}`

  return message
}
