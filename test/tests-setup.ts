/* eslint-disable no-console */
import { bee } from './utils'

export default async function testsSetup(): Promise<void> {
  try {
    if (process.env.BEE_POSTAGE) {
      try {
        if (!(await bee.getPostageBatch(process.env.BEE_POSTAGE)).usable) {
          delete process.env.BEE_POSTAGE
          console.log('BEE_POSTAGE stamp was found but is not usable')
        } else {
          console.log('Using configured BEE_POSTAGE stamp.')
        }
      } catch (e) {
        delete process.env.BEE_POSTAGE
        console.log('BEE_POSTAGE stamp was not found')
      }
    }

    if (!process.env.BEE_POSTAGE) {
      console.log('Creating postage stamps...')

      const stampsOrder: { env: string }[] = []

      if (!process.env.BEE_POSTAGE) {
        stampsOrder.push({ env: 'BEE_POSTAGE' })
      }

      const stamps = await Promise.all(stampsOrder.map(async () => bee.createPostageBatch('414720000', 20)))

      for (let i = 0; i < stamps.length; i++) {
        process.env[stampsOrder[i].env] = stamps[i]
        console.log(`${stampsOrder[i].env}: ${stamps[i]}`)
      }

      console.log('Waiting for the stamps to be usable')
      let allUsable = true
      do {
        for (let i = 0; i < stamps.length; i++) {
          // eslint-disable-next-line max-depth
          try {
            // eslint-disable-next-line max-depth
            if (!(await bee.getPostageBatch(stamps[i])).usable) {
              allUsable = false
              break
            } else {
              allUsable = true
            }
          } catch (e) {
            allUsable = false
            break
          }
        }

        // eslint-disable-next-line no-loop-func
        await new Promise<void>(resolve => setTimeout(() => resolve(), 1_000))
      } while (!allUsable)
      console.log('Usable, yey!')
    }
  } catch (e) {
    // It is possible that for unit tests the Bee nodes does not run
    // so we are only logging errors and not leaving them to propagate
    console.error(e)
  }
}
