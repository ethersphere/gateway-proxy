import { BatchId, Bee, Collection } from '@ethersphere/bee-js'
import fs, { statSync } from 'fs'
import path from 'path'

const BEE_API_URL = process.env.BEE_API_URL || 'http://localhost:1633'

export const bee = new Bee(BEE_API_URL)

/**
 * Helper function that to get a postage stamp for the tests.
 */
export function getPostageBatch(): BatchId {
  const stamp = process.env.BEE_POSTAGE as BatchId

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

export const genRandomHex = (size: number): string =>
  [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')
