import { Bee, BeeDebug, Utils } from '@ethersphere/bee-js'
import { READINESS_TIMEOUT_MS } from './config'
import { logger } from './logger'
import { StampsManager } from './stamps'

const MAX_CHUNK_SIZE = 4096

type ReadinessStatus = 'OK' | 'NO_STAMP' | 'HEALTH_CHECK_FAILED' | 'OTHER_ERROR'

export async function checkReadiness(
  bee: Bee,
  beeDebug: BeeDebug,
  stampManager?: StampsManager,
): Promise<ReadinessStatus> {
  if (stampManager) {
    const ready = await tryUploadingSingleChunk(bee, stampManager)

    return ready
  } else {
    try {
      const health = await beeDebug.getHealth({ timeout: READINESS_TIMEOUT_MS })
      const ready = health.status === 'ok'

      return ready ? 'OK' : 'HEALTH_CHECK_FAILED'
    } catch {
      return 'OTHER_ERROR'
    }
  }
}

async function tryUploadingSingleChunk(bee: Bee, stampsManager: StampsManager): Promise<ReadinessStatus> {
  const chunk = makeChunk()
  try {
    await bee.uploadChunk(stampsManager.postageStamp, chunk, { timeout: READINESS_TIMEOUT_MS, deferred: true })

    return 'OK'
  } catch (error) {
    logger.error('unable to upload chunk to bee', error)

    if (error && Reflect.get(error, 'message') === 'No postage stamp') {
      return 'NO_STAMP'
    }

    return 'OTHER_ERROR'
  }
}

function makeChunk(seed = '', length = MAX_CHUNK_SIZE): Uint8Array {
  if (length > MAX_CHUNK_SIZE) {
    throw Error(`Chunk length cannot be greater than ${MAX_CHUNK_SIZE}`)
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
