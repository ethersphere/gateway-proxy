import {
  BatchId,
  Bee,
  Collection,
  Duration,
  NumberString,
  PostageBatch,
  RedundancyLevel,
  Size,
  Utils,
} from '@ethersphere/bee-js'
import { Types } from 'cafe-utility'
import fs, { statSync } from 'fs'
import path from 'path'

const BEE_API_URL = process.env.BEE_API_URL || 'http://localhost:1633'

export const bee = new Bee(BEE_API_URL)

/**
 * Helper function that to get a postage stamp for the tests.
 */
export function getPostageBatch(): BatchId {
  const stamp = new BatchId(Types.asString(process.env.BEE_POSTAGE))

  if (!stamp) {
    throw new Error('There is no postage stamp')
  }

  return stamp
}

/**
 * Creates array in the format of Collection with data loaded from directory on filesystem.
 * The function loads all the data into memory!
 *
 * @param dir path to the directory
 */
export async function makeCollectionFromFS(dir: string): Promise<Collection> {
  if (typeof dir !== 'string') {
    throw new TypeError('dir has to be string!')
  }

  if (dir === '') {
    throw new TypeError('dir must not be empty string!')
  }

  return buildCollectionRelative(dir, '')
}

async function buildCollectionRelative(dir: string, relativePath: string): Promise<Collection> {
  // Handles case when the dir is not existing or it is a file ==> throws an error
  const dirname = path.join(dir, relativePath)
  const entries = await fs.promises.opendir(dirname)
  let collection: Collection = []

  for await (const entry of entries) {
    const fullPath = path.join(dir, relativePath, entry.name)
    const entryPath = path.join(relativePath, entry.name)

    if (entry.isFile()) {
      collection.push({
        path: entryPath,
        fsPath: fullPath,
        size: statSync(fullPath).size,
      })
    } else if (entry.isDirectory()) {
      collection = [...(await buildCollectionRelative(dir, entryPath)), ...collection]
    }
  }

  return collection
}

export interface RawPostageBatch {
  batchID: string
  utilization: number
  usable: boolean
  label: string
  depth: number
  amount: string
  bucketDepth: number
  blockNumber: number
  immutableFlag: boolean
  exists: boolean
  batchTTL: number
}

export function mapPostageBatch(
  raw: RawPostageBatch,
  encryption?: boolean,
  erasureCodeLevel?: RedundancyLevel,
): PostageBatch {
  const usage = Utils.getStampUsage(raw.utilization, raw.depth, raw.bucketDepth)
  const duration = Duration.fromSeconds(raw.batchTTL)
  const effectiveBytes = Utils.getStampEffectiveBytes(raw.depth, encryption, erasureCodeLevel)

  return {
    batchID: new BatchId(raw.batchID),
    utilization: raw.utilization,
    usable: raw.usable,
    label: raw.label,
    depth: raw.depth,
    amount: raw.amount as NumberString,
    bucketDepth: raw.bucketDepth,
    blockNumber: raw.blockNumber,
    immutableFlag: raw.immutableFlag,
    usage,
    usageText: `${Math.round(usage * 100)}%`,
    size: Size.fromBytes(effectiveBytes),
    remainingSize: Size.fromBytes(Math.ceil(effectiveBytes * (1 - usage))),
    theoreticalSize: Size.fromBytes(Utils.getStampTheoreticalBytes(raw.depth)),
    duration,
    calculateSize(encryption, redundancyLevel) {
      const effectiveBytes = Utils.getStampEffectiveBytes(raw.depth, encryption, redundancyLevel)

      return Size.fromBytes(effectiveBytes)
    },
    calculateRemainingSize(encryption, redundancyLevel) {
      const effectiveBytes = Utils.getStampEffectiveBytes(raw.depth, encryption, redundancyLevel)

      return Size.fromBytes(Math.ceil(effectiveBytes * (1 - this.usage)))
    },
  }
}
