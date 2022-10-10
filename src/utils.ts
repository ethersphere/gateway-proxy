import { BeeDebug } from '@ethersphere/bee-js'

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

export async function waitForStampUsable(beeDebug: BeeDebug, batchId: string): Promise<void> {
  for (let tries = 0; tries < 60; tries++) {
    try {
      const batch = await beeDebug.getPostageBatch(batchId)

      if (batch.usable) {
        return
      }
    } catch {
      await sleep(3000)
    }
  }
  throw Error(`Stamp not found/usable: ${batchId}`)
}
