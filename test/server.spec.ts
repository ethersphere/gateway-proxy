import { app } from '../src/server'
import request from 'supertest'

describe('GET /health', () => {
  it('should return 200 & OK', async () => {
    const res = await request(app).get(`/health`).expect(200)

    expect(res.text).toEqual('OK')
  })
})

describe('GET /readiness', () => {
  it('should return 200 & OK', async () => {
    const res = await request(app).get(`/readiness `).expect(200)

    expect(res.text).toEqual('OK')
  })
})
