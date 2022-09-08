import { Bee, Utils } from '@ethersphere/bee-js'
import { logger } from './logger'
import { StampsManager } from './stamps'

export async function tryUploadingSingleChunk(stampsManager: StampsManager): Promise<boolean> {
  const chunk = makeChunk()
  const bee = new Bee(process.env.BEE_API_URL || 'http://localhost:1633')
  try {
    await bee.uploadChunk(stampsManager.postageStamp, chunk, { timeout: 3_000, deferred: true })

    return true
  } catch (error) {
    logger.error('unable to upload chunk to bee', error)

    return false
  }
}

function makeChunk(seed = '', length = 4096): Uint8Array {
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
