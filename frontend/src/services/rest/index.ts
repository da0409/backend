import type { AppServices, Asset, Answer, Claim, Question, QuestionSummary, QuestionDetail, Trip, User, LocationRef, CreateQuestionInput } from '../contracts'
import { validationError, createApiError } from '../contracts'
import { createClient, type RestOptions } from './client'

type StoredTrip = { tripId: string; travelerId: string; destination: LocationRef; arrivalDate: string; departureDate: string; participatesInMatching: boolean; createTime: string }
type Media = { mediaId: string; type: string; width?: number; height?: number; caption?: string }
type Capsule = {
  capsuleId: string; creatorId: string; creatorName: string; title: string; question: string
  poiId: string; poiName: string; cityCode?: string; cityName?: string; lng: number; lat: number
  answerBeginTime: string; answerEndTime: string; createTime: string
  replyCount: number; activeClaimCount: number; mediaList: Media[]
}
type Assignment = { assignmentId: string; capsuleId: string; status: string; acceptTime: string; checkinTime?: string; replyTime?: string }
type Reply = { replyId: string; capsuleId: string; assignmentId: string; travelerId: string; travelerName: string; content: string; mediaList: Media[]; createTime: string; onSiteDeclaration: boolean }

const iso = (value?: string) => value ? (value.includes('T') ? value : value.replace(' ', 'T') + '+08:00') : ''
const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(new Date())
const unsupported = () => { throw createApiError('FORBIDDEN', '此功能仅在本地演示模式中提供') }
const encode = encodeURIComponent

export function createRestServices(options: RestOptions): AppServices {
  const http = createClient(options)
  let current: User | undefined
  function user(raw: { userId: string; nickname: string }): User {
    return { id: raw.userId, nickname: raw.nickname, isDemo: false, createdAt: '' }
  }
  async function me() {
    if (!current) current = user(await http.request('/auth/me'))
    return current
  }
  function asset(raw?: Media): Asset {
    return { id: raw?.mediaId || '', mimeType: raw?.type === 'VIDEO' ? 'video/mp4' : 'image/png',
      width: raw?.width || 0, height: raw?.height || 0, sizeBytes: 0, source: 'user', createdAt: '' }
  }
  function question(raw: Capsule): Question {
    return { id: raw.capsuleId, authorId: raw.creatorId, title: raw.title, description: raw.question,
      referenceAssetId: raw.mediaList?.[0]?.mediaId || '', shootingGuide: raw.mediaList?.[0]?.caption || undefined,
      location: { cityCode: raw.cityCode || '', cityName: raw.cityName || '', poiId: raw.poiId, poiName: raw.poiName,
        longitude: raw.lng, latitude: raw.lat },
      answerWindow: { startDate: raw.answerBeginTime, endDate: raw.answerEndTime }, createdAt: iso(raw.createTime) }
  }
  function summary(raw: Capsule): QuestionSummary {
    return { question: question(raw), author: user({ userId: raw.creatorId, nickname: raw.creatorName || '旅行者' }),
      referenceAsset: asset(raw.mediaList?.[0]), answerCount: raw.replyCount, satisfiedAnswerCount: 0,
      activeClaimCount: raw.activeClaimCount, displayStatus: raw.replyCount > 0 ? 'has_answers' : 'no_answers' }
  }
  async function claim(raw: Assignment): Promise<Claim> {
    return { id: raw.assignmentId, questionId: raw.capsuleId, travelerId: (await me()).id,
      status: raw.status === 'COMPLETED' ? 'completed' : raw.status === 'EXPIRED' ? 'expired' : 'active',
      claimedAt: iso(raw.acceptTime), updatedAt: iso(raw.replyTime || raw.checkinTime || raw.acceptTime) }
  }
  function answer(raw: Reply): Answer {
    return { id: raw.replyId, questionId: raw.capsuleId, claimId: raw.assignmentId, authorId: raw.travelerId,
      photoAssetId: raw.mediaList?.[0]?.mediaId || '', text: raw.content, onSiteDeclaration: raw.onSiteDeclaration,
      isSatisfiedByAuthor: false, isSimulated: false, submittedAt: iso(raw.createTime) }
  }
  async function claims() { return Promise.all((await http.all<Assignment>('/tasks')).map(claim)) }
  async function detail(id: string, sort = 'oldest'): Promise<QuestionDetail> {
    const [raw, replies, mine, viewer] = await Promise.all([
      http.request<Capsule>('/capsules/' + encode(id)), http.all<Reply>('/replies?capsuleId=' + encode(id)), claims(), me(),
    ])
    const existing = mine.find(c => c.questionId === id)
    const answers = replies.map(r => ({ ...answer(r), author: user({ userId: r.travelerId, nickname: r.travelerName }), photoAsset: asset(r.mediaList?.[0]) }))
    answers.sort((a, b) => (a.submittedAt.localeCompare(b.submittedAt) || a.id.localeCompare(b.id)) * (sort === 'newest' ? -1 : 1))
    return { ...summary(raw), answers, currentUserClaim: existing,
      canClaim: raw.creatorId !== viewer.id && !existing && raw.answerEndTime >= today(), canManageSatisfaction: false }
  }
  async function locations() {
    const rows = await http.all<Capsule>('/capsules/discover')
    return [...new Map(rows.map(c => [c.poiId, question(c).location])).values()]
  }
  function trip(raw: StoredTrip): Trip {
    return { id: raw.tripId, travelerId: raw.travelerId, destination: { ...raw.destination, cityCode: raw.destination.cityCode || '', cityName: raw.destination.cityName || '' }, arrivalDate: raw.arrivalDate, departureDate: raw.departureDate, participatesInMatching: raw.participatesInMatching, source: 'manual', createdAt: iso(raw.createTime) }
  }
  function validateLocation(location: LocationRef) {
    if (!location.cityName.trim() || !location.poiName.trim()) throw validationError('请填写城市和具体地点', 'location')
    if (location.longitude == null || location.latitude == null || !Number.isFinite(location.longitude) || !Number.isFinite(location.latitude)
      || Math.abs(location.longitude) > 180 || Math.abs(location.latitude) > 90) throw validationError('请填写有效的经纬度，或选择已有地点', 'location')
  }
  async function createQuestion(input: CreateQuestionInput) {
    validateLocation(input.location)
    if (!input.title.trim() || input.title.length > 128) throw validationError('标题须为 1–128 个字符', 'title')
    if (!input.description.trim() || input.description.length > 512) throw validationError('详细问题须为 1–512 个字符', 'description')
    if ((input.shootingGuide?.length || 0) > 255) throw validationError('拍摄建议不能超过 255 个字符', 'shootingGuide')
    if (!input.referenceAssetId) throw validationError('请先上传照片', 'referenceAssetId')
    if (!input.answerWindow.startDate || input.answerWindow.endDate < today() || input.answerWindow.startDate > input.answerWindow.endDate)
      throw validationError('回答时间范围无效，结束日期不能早于今天', 'answerWindow')
    const known = (await locations()).find(p => p.poiId === input.location.poiId)
    const result = await http.request<{ capsuleId: string }>('/capsules', 'POST', {
      title: input.title, question: input.description, poiId: known?.poiId || 'poi_' + crypto.randomUUID().replaceAll('-', '').slice(0, 24),
      poiName: input.location.poiName, cityCode: input.location.cityCode.slice(0, 16), cityName: input.location.cityName,
      lng: input.location.longitude, lat: input.location.latitude,
      answerBeginTime: input.answerWindow.startDate, answerEndTime: input.answerWindow.endDate,
      blurFace: false, mediaList: [{ mediaId: input.referenceAssetId, caption: input.shootingGuide || '' }],
    })
    return question(await http.request<Capsule>('/capsules/' + encode(result.capsuleId)))
  }
  return {
    session: {
      getCurrentUser: me,
      hasSession: () => Boolean(http.token()),
      async login(username, password) {
        const result = await http.request<{ token: string; user: { userId: string; nickname: string } }>('/auth/login', 'POST', { username, password })
        http.setToken(result.token); current = user(result.user); return current
      },
      async register(username, password, nickname) {
        const result = await http.request<{ token: string; user: { userId: string; nickname: string } }>('/auth/register', 'POST', { username, password, nickname })
        http.setToken(result.token); current = user(result.user); return current
      },
      async logout() {
        try { await http.request('/auth/logout', 'POST') }
        finally { http.setToken(); current = undefined }
      },
    },
    question: {
      async listDiscover() { return (await http.all<Capsule>('/capsules/discover')).map(summary) },
      async listMine() {
        const rows = await http.all<{ capsuleId: string }>('/capsules')
        return Promise.all(rows.map(async r => summary(await http.request<Capsule>('/capsules/' + encode(r.capsuleId)))))
      },
      getById: detail, create: createQuestion,
    },
    location: { list: locations },
    trip: {
      async listMine() { return (await http.all<StoredTrip>('/trips')).map(trip) },
      async create(input) {
        return trip(await http.request<StoredTrip>('/trips', 'POST', {
          destinationPoiId: input.destination.poiId, arrivalDate: input.arrivalDate,
          departureDate: input.departureDate, participatesInMatching: input.participatesInMatching,
        }))
      },
      importDemoTrip: unsupported,
      async setActive(id) { await http.request('/trips/active', 'PUT', { tripId: id }) },
      async getActive() {
        const value = await http.request<StoredTrip | null>('/trips/active')
        return value ? trip(value) : undefined
      },
    },
    match: {
      async listForTrip(id) {
        const rows = await http.all<{ capsuleId: string; distanceMeters: number }>('/trips/' + encode(id) + '/matches')
        return Promise.all(rows.map(async r => ({ ...summary(await http.request<Capsule>('/capsules/' + encode(r.capsuleId))), distanceMeters: r.distanceMeters })))
      },
    },
    claim: {
      listMine: claims,
      async create(id) {
        const result = await http.request<{ assignmentId: string }>('/tasks/' + encode(id) + '/accept', 'POST')
        return claim(await http.request<Assignment>('/tasks/' + encode(result.assignmentId)))
      },
      cancel: unsupported,
      async checkin(id, coords) { await http.request('/tasks/' + encode(id) + '/checkin', 'POST', { lng: coords.longitude, lat: coords.latitude }) },
    },
    answer: {
      async listMine() {
        const mine = await claims()
        const result: Answer[] = []
        for (const c of mine.filter(c => c.status === 'completed')) {
          const replies = await http.all<Reply>('/replies?capsuleId=' + encode(c.questionId))
          result.push(...replies.filter(r => r.assignmentId === c.id).map(answer))
        }
        return result
      },
      async create(id, input) {
        if (!input.photoAssetId || !input.text.trim() || !input.onSiteDeclaration) throw validationError('照片、文字及现场拍摄声明均为必填')
        const result = await http.request<{ replyId: string }>('/tasks/' + encode(id) + '/reply', 'POST', {
          content: input.text, mediaList: [{ mediaId: input.photoAssetId }], onSiteDeclaration: true, blurFace: false,
        })
        return answer(await http.request<Reply>('/replies/' + encode(result.replyId)))
      },
      setSatisfied: unsupported,
    },
    asset: {
      async saveImage(file) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw validationError('仅支持 JPEG、PNG、WebP 图片')
        if (file.size > 20 * 1024 * 1024) throw createApiError('IMAGE_TOO_LARGE', '图片不能超过 20MB')
        const data = new FormData(); data.append('file', file); data.append('type', 'IMAGE')
        const response = await http.send('/capsules/media', { method: 'POST', body: data })
        const body = await response.json() as { data: Media }
        return { ...asset(body.data), sizeBytes: file.size }
      },
      async getObjectUrl(id) {
        if (!id) throw validationError('这条记录没有图片')
        const response = await http.send('/media/' + encode(id))
        return URL.createObjectURL(await response.blob())
      },
      revokeObjectUrl: url => URL.revokeObjectURL(url),
    },
    demo: { bootstrap: async () => {}, reset: unsupported, listScenarios: async () => [], revealFutureReplies: unsupported },
  }
}
