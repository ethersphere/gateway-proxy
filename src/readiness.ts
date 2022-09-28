import { Bee, BeeDebug, Utils } from '@ethersphere/bee-js'
import { READINESS_TIMEOUT_MS } from './config'
import { logger } from './logger'
import { StampsManager } from './stamps'

export async function checkReadiness(bee: Bee, beeDebug: BeeDebug, stampManager?: StampsManager): Promise<boolean> {
  if (stampManager) {
    const ready = await tryUploadingSingleChunk(bee, stampManager)

    return ready
  } else {
    try {
      const health = await beeDebug.getHealth({ timeout: READINESS_TIMEOUT_MS })
      const ready = health.status === 'ok'

      return ready
    } catch {
      return false
    }
  }
}

async function tryUploadingSingleChunk(bee: Bee, stampsManager: StampsManager): Promise<boolean> {
  const chunk = makeChunk()
  try {
    await bee.uploadChunk(stampsManager.postageStamp, chunk, { timeout: READINESS_TIMEOUT_MS, deferred: true })

    return true
  } catch (error) {
    logger.error('unable to upload chunk to bee', error)

    return false
  }
}

function makeChunk(seed = '', length = 4096): Uint8Array {
  if (length > 4096) {
    throw Error('Chunk length cannot be greater than 4096')
  }
  const data = Buffer.alloc(length)
  let random: Uint8Array = Buffer.from(seed || getDefaultSeed())
  let offset = 0
  while (offset < length) {
    random = Utils.keccak256Hash(random)

    if (length - offset < 32) {
      random = random.slice(0, length - offset)
    }
    data.set(random, offset)
    offset += random.length
  }

  return data
}

function getDefaultSeed(): string {
  // e.g. 2022-09-08T10
  return new Date().toISOString().slice(0, 13)
}
