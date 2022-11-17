import { BatchId, BeeDebug, NumberString, PostageBatch } from '@ethersphere/bee-js'
import { logger } from './logger'
import { stampPurchaseCounter } from './stamps/counters'

/**
 * Sleep for N miliseconds
 *
 * @param ms Number of miliseconds to sleep
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise<void>(resolve => setTimeout(() => resolve(), ms))
}

export function getErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return String(error)
}

// TODO: https://github.com/ethersphere/gateway-proxy/issues/378 (Revert when Bee 1.9.0 is released)
export async function waitForStampUsable(beeDebug: BeeDebug, batchId: string): Promise<void> {
  for (let tries = 0; tries < 60; tries++) {
    try {
      const batch = await beeDebug.getPostageBatch(batchId)

      if (batch.usable) {
        return
      } else {
        await sleep(3000)
      }
    } catch {
      await sleep(3000)
    }
  }
  throw Error(`Stamp not found/usable: ${batchId}`)
}

/**
 * Calculate usage of a given postage stamp
 *
 * @param stamp Postage stamp which usage should be determined
 */
export function getUsage({ utilization, depth, bucketDepth }: PostageBatch): number {
  return utilization / Math.pow(2, depth - bucketDepth)
}

/**
 * Validate if the value is an integer
 * @param value
 * @returns boolean
 */
export function isInteger(value: unknown): value is number | string | NumberString {
  return (
    (typeof value === 'string' && /^-?(0|[1-9][0-9]*)$/g.test(value)) ||
    (typeof value === 'number' &&
      value > Number.MIN_SAFE_INTEGER &&
      value < Number.MAX_SAFE_INTEGER &&
      Number.isInteger(value))
  )
}

export function assertInteger(value: unknown, name = 'value'): asserts value is number | NumberString {
  if (!isInteger(value)) throw new TypeError(`${name} is not a valid integer`)
}

export function assertDecimal(value: unknown, name = 'value'): boolean {
  if (typeof value === 'number') {
    value = value.toString()
  }

  if (typeof value !== 'string' || (typeof value === 'string' && !/^\d*\.?\d*$/g.test(value))) {
    throw new TypeError(`${name} is not a valid decimal`)
  }

  return true
}

/**
 * Buy new postage stamp and wait until it is usable
 *
 * @param depth Postage stamps depth
 * @param amount Postage stamps amount
 * @param beeDebug Connection to debug endpoint for checking/buying stamps
 * @param options
 *        timeout (optional) How long should the system wait for the stamp to be usable in ms, default to 10000
 *
 * @returns Newly bought postage stamp
 */
export async function buyNewStamp(
  depth: number,
  amount: string,
  beeDebug: BeeDebug,
): Promise<{ batchId: BatchId; stamp: PostageBatch }> {
  logger.info('buying new stamp')
  const batchId = await beeDebug.createPostageBatch(amount, depth, { waitForUsable: false })
  await waitForStampUsable(beeDebug, batchId)
  stampPurchaseCounter.inc()

  const stamp = await beeDebug.getPostageBatch(batchId)
  logger.info('successfully bought new stamp', { stamp })

  return { batchId, stamp }
}
