import { Bee } from '@ethersphere/bee-js'
import { READINESS_TIMEOUT_MS } from './config'

export async function checkReadiness(bee: Bee): Promise<boolean> {
  const health = await bee.getHealth({ timeout: READINESS_TIMEOUT_MS })
  const topology = await bee.getTopology({ timeout: READINESS_TIMEOUT_MS })

  return health.status === 'ok' && topology.depth >= 1 && topology.depth < 31
}
