import { createApp } from '../src/server'
import request from 'supertest'

const BEE_API_URL = process.env.BEE_API_URL || 'http://localhost:1633'
const BEE_API_URL_WRONG = process.env.BEE_API_URL_WRONG || 'http://localhost:2021'
const AUTH_SECRET = process.env.AUTH_SECRET || 'super_secret_token'

const app = createApp({ BEE_API_URL })
const appWrong = createApp({ BEE_API_URL: BEE_API_URL_WRONG })
const appAuth = createApp({ BEE_API_URL, AUTH_SECRET })
const appAuthWrong = createApp({ BEE_API_URL: BEE_API_URL_WRONG, AUTH_SECRET })

describe('GET /health', () => {
  it('should return 200 & OK', async () => {
    const res = await request(app).get(`/health`).expect(200)

    expect(res.text).toEqual('OK')
  })

  it('with authorization enabled should return 403 & Forbidden', async () => {
    const res = await request(appAuth).get(`/health`).expect(403)

    expect(res.text).toEqual('Forbidden')
  })

  it('with authorization enabled should return 200 & OK', async () => {
    const res = await request(appAuth).get(`/health`).set('authorization', AUTH_SECRET).expect(200)

    expect(res.text).toEqual('OK')
  })
})

describe('GET /readiness', () => {
  it('should return 200 & OK', async () => {
    const res = await request(app).get(`/readiness`).expect(200)

    expect(res.text).toEqual('OK')
  })
  it('should return 502 & Bad Gateway', async () => {
    const res = await request(appWrong).get(`/readiness`).expect(502)

    expect(res.text).toEqual('Bad Gateway')
  })

  it('with authorization enabled should return 403 & Forbidden', async () => {
    const res = await request(appAuth).get(`/readiness`).expect(403)

    expect(res.text).toEqual('Forbidden')
  })

  it('with authorization enabled should return 502 & Bad Gateway', async () => {
    const res = await request(appAuthWrong).get(`/readiness`).set('authorization', AUTH_SECRET).expect(502)

    expect(res.text).toEqual('Bad Gateway')
  })

  it('with authorization enabled should return 200 & OK', async () => {
    const res = await request(appAuth).get(`/readiness`).set('authorization', AUTH_SECRET).expect(200)

    expect(res.text).toEqual('OK')
  })
})
