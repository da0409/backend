import { test } from 'node:test'
import assert from 'node:assert/strict'
import { File } from 'node:buffer'
import { webcrypto, randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createClient } from '../src/services/rest/client'
import { createRestServices } from '../src/services/rest'

Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true })
class MemoryStorage {
  data = new Map<string, string>()
  getItem(key: string) { return this.data.get(key) ?? null }
  setItem(key: string, value: string) { this.data.set(key, value) }
  removeItem(key: string) { this.data.delete(key) }
  clear() { this.data.clear() }
  key(index: number) { return [...this.data.keys()][index] ?? null }
  get length() { return this.data.size }
}
function options() { return { baseUrl: 'http://localhost/v1', session: new MemoryStorage(), local: new MemoryStorage() } }
const ok = (data: unknown) => new Response(JSON.stringify({ code: 1, msg: 'success', data }), { headers: { 'Content-Type': 'application/json' } })

test('JSON requests attach bearer tokens and unwrap data', async () => {
  const config = options();config.session.setItem('timecapsule.rest.token', 'test-token')
  const client = createClient({ ...config, fetcher: async (url, init) => {
    assert.equal(url, 'http://localhost/v1/example')
    assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer test-token')
    assert.equal(new Headers(init?.headers).get('Content-Type'), 'application/json')
    assert.deepEqual(JSON.parse(String(init?.body)), { sample: 1 })
    return ok({ id: 'example' })
  } })
  assert.deepEqual(await client.request('/example', 'POST', { sample: 1 }), { id: 'example' })
})
test('multipart upload preserves automatic boundary', async () => {
  const client = createClient({ ...options(), fetcher: async (_url, init) => {
    assert.equal(new Headers(init?.headers).has('Content-Type'), false)
    assert.ok(init?.body instanceof FormData);return ok({})
  } })
  await client.send('/capsules/media', { method: 'POST', body: new FormData() })
})
test('unauthorized session is cleared and surfaced; no Mock fallback', async () => {
  const config = options();config.session.setItem('timecapsule.rest.token', 'expired')
  let expired = false
  const client = createClient({ ...config, onUnauthorized: () => { expired = true },
    fetcher: async () => new Response(JSON.stringify({ msg: '令牌已过期' }), { status: 401 }) })
  await assert.rejects(client.request('/capsules'), (e: any) => e.code === 'FORBIDDEN' && e.message === '令牌已过期')
  assert.equal(client.token(), null);assert.equal(expired, true)
})
test('validation and transport errors retain meaningful messages', async () => {
  const client = createClient({ ...options(), fetcher: async () => new Response(JSON.stringify({ msg: '超出 300 米签到范围' }), { status: 422 }) })
  await assert.rejects(client.request('/tasks/x/checkin'), (e: any) => e.code === 'VALIDATION_ERROR' && e.message.includes('300'))
  const offline = createClient({ ...options(), fetcher: async () => { throw new TypeError('offline') } })
  await assert.rejects(offline.request('/capsules'), (e: any) => e.code === 'NETWORK_ERROR' && e.retryable)
})
test('pagination combines pages without truncating at 100', async () => {
  const client = createClient({ ...options(), fetcher: async url => {
    const page = new URL(String(url)).searchParams.get('page')
    return ok({ total: 101, rows: page === '1' ? Array.from({ length: 100 }, (_, i) => i) : [100] })
  } })
  assert.equal((await client.all('/capsules?creatorId=x')).length, 101)
})
test('invalid coordinates fail before posting and unsupported actions never invent success', async () => {
  const api = createRestServices({ ...options(), fetcher: async () => { throw Error('must not request') } })
  await assert.rejects(api.question.create({ title: 'x', description: 'y', referenceAssetId: 'm',
    location: { cityName: 'x', cityCode: 'x', poiName: 'x', poiId: 'x' },
    answerWindow: { startDate: '2099-01-01', endDate: '2099-01-02' } }), (e: any) => e.field === 'location')
  assert.throws(() => api.claim.cancel('id'), (e: any) => e.code === 'FORBIDDEN')
})
test('only expected REST DTO fields map to the frontend; Asia/Shanghai timestamps are explicit', async () => {
  const api = createRestServices({ ...options(), fetcher: async () => ok({ total: 1, rows: [{
    capsuleId: 'capsule', creatorId: 'author', creatorName: '旅行者', title: '问题', question: '还在吗',
    mediaList: [{ mediaId: 'media', type: 'IMAGE', width: 12, height: 8, caption: '从南侧拍摄' }],
    poiId: 'poi', poiName: '地点', lng: 100, lat: 20, cityCode: 'city', cityName: '城市',
    replyCount: 2, activeClaimCount: 3, createTime: '2026-10-02 10:00:00', answerBeginTime: '2026-10-02', answerEndTime: '2099-01-01',
  }] }) })
  const [row] = await api.question.listDiscover()
  assert.equal(row.question.createdAt, '2026-10-02T10:00:00+08:00')
  assert.equal(row.question.referenceAssetId, 'media');assert.equal(row.question.shootingGuide, '从南侧拍摄')
  assert.equal(row.author.id, 'author');assert.equal(row.author.isDemo, false);assert.equal(row.activeClaimCount, 3)
})
test('live adapter: two users, media, cloud trip, matching, checkin, reply, reload and logout', {
  skip: !process.env.REST_LIVE_BASE,
}, async () => {
  const baseUrl = process.env.REST_LIVE_BASE!
  const local = new MemoryStorage()
  const authorSession = new MemoryStorage(), travelerSession = new MemoryStorage()
  const authorOptions = { baseUrl, session: authorSession, local }
  const travelerOptions = { baseUrl, session: travelerSession, local }
  const author = createRestServices(authorOptions), traveler = createRestServices(travelerOptions)
  const suffix = randomUUID().replaceAll('-', '').slice(0, 12)
  const password = randomUUID()
  await author.session.register!('int_a_' + suffix, password, '联调模拟提问者')
  await traveler.session.register!('int_b_' + suffix, password, '联调模拟旅行者')
  const photo = new File([readFileSync('src/assets/lake-editorial.jpg')], 'integration.jpg', { type: 'image/jpeg' }) as unknown as globalThis.File
  const reference = await author.asset.saveImage(photo)
  await assert.rejects(traveler.asset.getObjectUrl(reference.id), (e: any) => e.code === 'FORBIDDEN')
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(new Date())
  const question = await author.question.create({ title: '联调模拟：旧照片里的地点', description: '这是一条明确标注的自动联调模拟内容',
    referenceAssetId: reference.id, shootingGuide: '请从南侧拍摄',
    location: { poiId: 'new-' + suffix, poiName: '联调模拟地点-' + suffix, cityName: '联调模拟城市', cityCode: 'demo', longitude: 100.1789, latitude: 27.1156 },
    answerWindow: { startDate: today, endDate: today } })
  assert.ok((await traveler.question.listDiscover()).some(q => q.question.id === question.id))
  assert.equal((await traveler.question.listMine()).length, 0)
  const url = await traveler.asset.getObjectUrl(reference.id);assert.ok(url.startsWith('blob:'));traveler.asset.revokeObjectUrl(url)
  const trip = await traveler.trip.create({ destination: question.location, arrivalDate: today, departureDate: today, participatesInMatching: true })
  await traveler.trip.setActive(trip.id)
  assert.equal((await author.trip.listMine()).length, 0)
  const reloadTraveler = createRestServices({ baseUrl, session: new MemoryStorage(), local: new MemoryStorage() })
  await reloadTraveler.session.login!('int_b_' + suffix, password)
  assert.equal((await reloadTraveler.trip.listMine())[0].id, trip.id)
  assert.equal((await reloadTraveler.trip.getActive())?.id, trip.id)
  assert.ok((await traveler.match.listForTrip(trip.id)).some(q => q.question.id === question.id))
  const claim = await traveler.claim.create(question.id)
  assert.notEqual(claim.id, question.id)
  assert.equal((await traveler.question.getById(question.id)).canClaim, false)
  const shot = await traveler.asset.saveImage(photo)
  const input = { photoAssetId: shot.id, text: '联调模拟回信：地点依然存在。', onSiteDeclaration: true }
  await assert.rejects(traveler.answer.create(claim.id, input), (e: any) => e.code === 'CONFLICT')
  await assert.rejects(traveler.claim.checkin!(claim.id, { longitude: 0, latitude: 0 }), (e: any) => e.code === 'VALIDATION_ERROR')
  await traveler.claim.checkin!(claim.id, { longitude: 100.1789, latitude: 27.1156 })
  const reply = await traveler.answer.create(claim.id, input)
  await assert.rejects(traveler.answer.create(claim.id, input), (e: any) => e.code === 'CONFLICT')
  const reloaded = await createRestServices(authorOptions).question.getById(question.id)
  assert.equal(reloaded.answers.length, 1);assert.equal(reloaded.answers[0].id, reply.id)
  assert.equal(reloaded.answers[0].author.nickname, '联调模拟旅行者')
  assert.equal(reloaded.question.shootingGuide, '请从南侧拍摄')
  assert.equal((await reloadTraveler.answer.listMine())[0].id, reply.id)
  assert.equal((await reloadTraveler.claim.listMine())[0].status, 'completed')
  const replyUrl = await author.asset.getObjectUrl(shot.id);author.asset.revokeObjectUrl(replyUrl)
  await traveler.session.logout!();assert.equal(traveler.session.hasSession!(), false)
  await assert.rejects(traveler.question.listDiscover(), (e: any) => e.code === 'FORBIDDEN')
  await author.session.logout!()
})
