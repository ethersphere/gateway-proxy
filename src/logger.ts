import type { Server } from 'http'
import requestStats from 'request-stats'
import { Logform, Logger, createLogger, format, transports } from 'winston'

import { Strings } from 'cafe-utility'
import { SUPPORTED_LEVELS, SupportedLevels, logLevel } from './config'

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
  let message = `time="${info.timestamp}" level="${info.level}" msg="${info.message}"`

  if (Object.keys(info.metadata).length > 0) {
    if (info.metadata.config) {
      delete info.metadata.config.data
    }
    message = `${message} ${Strings.represent(info.metadata, 'key-value')}`
  }

  return message.replace(/\n/g, '\\n')
}

export function subscribeLogServerRequests(server: Server): void {
  const stats = requestStats(server)
  stats.on('complete', details => {
    const {
      time,
      req: { bytes, method, ip, path, raw },
      res: { status },
    } = details
    logger.info('api access', {
      duration: (time / 1000).toFixed(9), // convert from ms to seconds
      ip,
      method,
      size: bytes,
      status,
      uri: path,
      'user-agent': raw.headers['user-agent'],
    })
  })
}
