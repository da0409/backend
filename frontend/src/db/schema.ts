// src/db/schema.ts
// 依据 docs/TECHNICAL.md 第 7、8 节定义 IndexedDB 结构。
// 版本号写死在这里，升级时递增 DB_VERSION 并在 db/index.ts 里处理迁移。

export const DB_NAME = 'houlai-ne-demo'
export const DB_VERSION = 1

/** 对象存储名 */
export const STORE_USERS = 'users'
export const STORE_ASSETS = 'assets'
export const STORE_ASSET_BLOBS = 'assetBlobs'
export const STORE_QUESTIONS = 'questions'
export const STORE_TRIPS = 'trips'
export const STORE_CLAIMS = 'claims'
export const STORE_ANSWERS = 'answers'
export const STORE_SESSION = 'session'
export const STORE_META = 'meta'

/** 全部 store 列表，清库时用 */
export const ALL_STORES = [
  STORE_USERS,
  STORE_ASSETS,
  STORE_ASSET_BLOBS,
  STORE_QUESTIONS,
  STORE_TRIPS,
  STORE_CLAIMS,
  STORE_ANSWERS,
  STORE_SESSION,
  STORE_META,
] as const

export type StoreName = (typeof ALL_STORES)[number]

/** 当前 active trip 的 key，存在 STORE_SESSION 里 */
export const SESSION_KEY_ACTIVE_TRIP = 'activeTripId'

/** 数据版本 key，存在 STORE_META 里。版本变化时用于重写 fixture。 */
export const META_KEY_DATA_VERSION = 'dataVersion'

/** fixture 数据版本，改动 fixture 时递增 */
export const FIXTURE_VERSION = 2

/**
 * 建库逻辑：在 onupgradeneeded 里调用。
 * 只在版本变化时执行，不会覆盖已有数据。
 */
export function upgradeSchema(db: IDBDatabase): void {
  const existing = new Set(Array.from(db.objectStoreNames))

  if (!existing.has(STORE_USERS)) {
    db.createObjectStore(STORE_USERS, { keyPath: 'id' })
  }

  if (!existing.has(STORE_ASSETS)) {
    db.createObjectStore(STORE_ASSETS, { keyPath: 'id' })
  }

  if (!existing.has(STORE_ASSET_BLOBS)) {
    db.createObjectStore(STORE_ASSET_BLOBS, { keyPath: 'assetId' })
  }

  if (!existing.has(STORE_QUESTIONS)) {
    const store = db.createObjectStore(STORE_QUESTIONS, { keyPath: 'id' })
    store.createIndex('by_author', 'authorId', { unique: false })
    store.createIndex('by_city', 'location.cityCode', { unique: false })
    store.createIndex('by_curation', 'curationOrder', { unique: false })
  }

  if (!existing.has(STORE_TRIPS)) {
    const store = db.createObjectStore(STORE_TRIPS, { keyPath: 'id' })
    store.createIndex('by_traveler', 'travelerId', { unique: false })
  }

  if (!existing.has(STORE_CLAIMS)) {
    const store = db.createObjectStore(STORE_CLAIMS, { keyPath: 'id' })
    store.createIndex('by_question', 'questionId', { unique: false })
    store.createIndex('by_traveler', 'travelerId', { unique: false })
    store.createIndex('by_status', 'status', { unique: false })
  }

  if (!existing.has(STORE_ANSWERS)) {
    const store = db.createObjectStore(STORE_ANSWERS, { keyPath: 'id' })
    store.createIndex('by_question', 'questionId', { unique: false })
    store.createIndex('by_claim', 'claimId', { unique: false })
    store.createIndex('by_author', 'authorId', { unique: false })
  }

  if (!existing.has(STORE_SESSION)) {
    db.createObjectStore(STORE_SESSION, { keyPath: 'key' })
  }

  if (!existing.has(STORE_META)) {
    db.createObjectStore(STORE_META, { keyPath: 'key' })
  }
}
