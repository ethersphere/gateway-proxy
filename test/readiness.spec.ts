import request from 'supertest'
import { createApp } from '../src/server'
import { BaseStampManager } from '../src/stamps/base'

describe('readiness', () => {
  test('should be ready without stamp management', async () => {
    const app = createApp({
      beeApiUrl: 'http://localhost:1633',
      beeDebugApiUrl: 'http://localhost:1635',
    })
    const response = await request(app).get('/readiness')
    expect(response.text).toBe('OK')
  })

  test('should be ready with stamp management', async () => {
    const stampManager = new BaseStampManager(process.env.BEE_POSTAGE as string)
    const app = createApp(
      {
        beeApiUrl: 'http://localhost:1633',
        beeDebugApiUrl: 'http://localhost:1635',
      },
      stampManager,
    )
    const response = await request(app).get('/readiness')
    expect(response.text).toBe('OK')
  })
})
