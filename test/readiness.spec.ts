import request from 'supertest'
import { createApp } from '../src/server'
import { StampManager } from '../src/stamps'

describe('readiness', () => {
  test('should be ready without stamp management', async () => {
    const app = createApp({
      beeApiUrl: 'http://localhost:1633',
    })
    const response = await request(app).get('/readiness')
    expect(response.text).toBe('OK')
  })

  test('should be ready with stamp management', async () => {
    const stampManager = new StampManager()
    await stampManager.start({ mode: 'hardcoded', stamp: process.env.BEE_POSTAGE as string })
    const app = createApp(
      {
        beeApiUrl: 'http://localhost:1633',
      },
      stampManager,
    )
    const response = await request(app).get('/readiness')
    expect(response.text).toBe('OK')
  })
})
