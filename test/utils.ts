import fs from 'fs'
import path from 'path'
import { Bee, BeeDebug, BatchId, DebugPostageBatch, Collection } from '@ethersphere/bee-js'

const USABLE_TIMEOUT = 7_000
const BEE_API_URL = process.env.BEE_API_URL || 'http://localhost:1633'
const BEE_DEBUG_API_URL = process.env.BEE_DEBUG_API_URL || 'http://localhost:1635'

export const bee = new Bee(BEE_API_URL)
export const beeDebug = new BeeDebug(BEE_DEBUG_API_URL)

/**
 * Sleep for N miliseconds
 *
 * @param ms Number of miliseconds to sleep
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise<void>(resolve => setTimeout(() => resolve(), ms))
}

async function timeout(ms: number, message = 'Execution reached timeout!'): Promise<Error> {
  await sleep(ms)
  throw new Error(message)
}

export async function waitForBatchToBeUsable(batchId: string, pollingInterval = 200): Promise<void> {
  await Promise.race([
    timeout(USABLE_TIMEOUT, 'Awaiting of usable postage batch timed out!'),
    async () => {
      let stamp: DebugPostageBatch

      do {
        await sleep(pollingInterval)
        stamp = await beeDebug.getPostageBatch(batchId as BatchId)
      } while (!stamp.usable)
    },
  ])
}

const DEFAULT_BATCH_AMOUNT = '1'
const DEFAULT_BATCH_DEPTH = 17

/**
 * Returns already existing batch or will create one.
 *
 * If some specification is passed then it is guaranteed that the batch will have this property(ies)
 *
 * @param amount
 * @param depth
 * @param immutable
 */
export async function getOrCreatePostageBatch(
  amount?: string,
  depth?: number,
  immutable?: boolean,
): Promise<DebugPostageBatch> {
  // Non-usable stamps are ignored by Bee
  const allUsableStamps = (await beeDebug.getAllPostageBatch()).filter(stamp => stamp.usable)

  if (allUsableStamps.length === 0) {
    const batchId = await beeDebug.createPostageBatch(amount ?? DEFAULT_BATCH_AMOUNT, depth ?? DEFAULT_BATCH_DEPTH)

    await waitForBatchToBeUsable(batchId)

    return beeDebug.getPostageBatch(batchId)
  }

  // User does not want any specific batch, lets give him the first one
  if (amount === undefined && depth === undefined && immutable === undefined) {
    return allUsableStamps[0]
  }

  // User wants some specific batch
  for (const stamp of allUsableStamps) {
    let meetingAllCriteria = false

    if (amount !== undefined) {
      meetingAllCriteria = amount === stamp.amount
    } else {
      meetingAllCriteria = true
    }

    if (depth !== undefined) {
      meetingAllCriteria = meetingAllCriteria && depth === stamp.depth
    }

    if (immutable !== undefined) {
      meetingAllCriteria = meetingAllCriteria && immutable === stamp.immutableFlag
    }

    if (meetingAllCriteria) {
      return stamp
    }
  }

  // No stamp meeting the criteria was found ==> we need to create a new one
  const batchId = await beeDebug.createPostageBatch(amount ?? DEFAULT_BATCH_AMOUNT, depth ?? DEFAULT_BATCH_DEPTH)

  await waitForBatchToBeUsable(batchId)

  return beeDebug.getPostageBatch(batchId)
}

/**
 * Creates array in the format of Collection with data loaded from directory on filesystem.
 * The function loads all the data into memory!
 *
 * @param dir path to the directory
 */
export async function makeCollectionFromFS(dir: string): Promise<Collection<Uint8Array>> {
  if (typeof dir !== 'string') {
    throw new TypeError('dir has to be string!')
  }

  if (dir === '') {
    throw new TypeError('dir must not be empty string!')
  }

  return buildCollectionRelative(dir, '')
}

async function buildCollectionRelative(dir: string, relativePath: string): Promise<Collection<Uint8Array>> {
  // Handles case when the dir is not existing or it is a file ==> throws an error
  const dirname = path.join(dir, relativePath)
  const entries = await fs.promises.opendir(dirname)
  let collection: Collection<Uint8Array> = []

  for await (const entry of entries) {
    const fullPath = path.join(dir, relativePath, entry.name)
    const entryPath = path.join(relativePath, entry.name)

    if (entry.isFile()) {
      collection.push({
        path: entryPath,
        data: new Uint8Array(await fs.promises.readFile(fullPath)),
      })
    } else if (entry.isDirectory()) {
      collection = [...(await buildCollectionRelative(dir, entryPath)), ...collection]
    }
  }

  return collection
}
