// src/mocks/scenarios/bootstrap.ts
// 依据 docs/TECHNICAL.md 第 7 节与 docs/API.md DemoApi：
// - 首次启动写入固定 fixture
// - 重复 bootstrap 幂等，不重复插入、不覆盖用户创建的数据
// - reset 清库后重写同一套 fixture

import {
  clearAll,
  getOne,
  openDb,
  putMany,
} from '../../db'
import {
  STORE_ASSETS,
  STORE_ASSET_BLOBS,
  STORE_META,
  STORE_QUESTIONS,
  STORE_SESSION,
  STORE_TRIPS,
  STORE_USERS,
  META_KEY_DATA_VERSION,
} from '../../db/schema'
import {
  CURRENT_FIXTURE_VERSION,
  demoAllUsers,
  demoQuestions,
  demoTrips,
  loadDemoAssets,
  presetPhotoAssetIds,
} from '../fixtures'
import type { PresetAssetEntry } from '../fixtures/demoAssets'

interface MetaRecord {
  key: string
  value: unknown
}

async function readDataVersion(): Promise<number | undefined> {
  const meta = await getOne<MetaRecord>(STORE_META, META_KEY_DATA_VERSION)
  return typeof meta?.value === 'number' ? meta.value : undefined
}

/** 资产元数据、Blob 与 fixture 版本同时写入，避免部分替换。 */
async function writeAssetsAndVersion(entries: PresetAssetEntry[]): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE_ASSETS, STORE_ASSET_BLOBS, STORE_META], 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
    for (const entry of entries) {
      tx.objectStore(STORE_ASSETS).put(entry.asset)
      tx.objectStore(STORE_ASSET_BLOBS).put({ assetId: entry.asset.id, blob: entry.blob })
    }
    tx.objectStore(STORE_META).put({ key: META_KEY_DATA_VERSION, value: CURRENT_FIXTURE_VERSION })
  })
}

/** 写入全部固定 fixture：用户、问题、行程、资产元数据、资产 Blob。 */
async function writeAllFixtures(entries: PresetAssetEntry[]): Promise<void> {
  await putMany(STORE_USERS, demoAllUsers)
  await putMany(STORE_QUESTIONS, demoQuestions)
  await putMany(STORE_TRIPS, demoTrips)
  await writeAssetsAndVersion(entries)
}

/**
 * 首次启动或数据版本变化时写入 fixture。
 * 重复调用、数据版本相同的情况：直接返回，不重复插入。
 * 不覆盖用户创建的数据（用户数据不会与 fixture 固定 ID 冲突）。
 */
export async function bootstrapDemoData(): Promise<void> {
  const current = await readDataVersion()
  if (current === CURRENT_FIXTURE_VERSION) {
    return
  }
  if (current === undefined) {
    // 首次启动：写入全部 fixture
    const entries = await loadDemoAssets()
    await writeAllFixtures(entries)
    return
  }
  if (current < CURRENT_FIXTURE_VERSION) {
    // 只替换六张固定 ID 的预置照片；用户实体、图片及领取回答保持原状。
    const entries = (await loadDemoAssets()).filter(entry =>
      presetPhotoAssetIds.includes(entry.asset.id),
    )
    await writeAssetsAndVersion(entries)
    return
  }
  throw new Error(`不支持的演示数据版本：${current}`)
}

/** 清空所有数据并重写固定 fixture */
export async function resetDemoData(): Promise<void> {
  const entries = await loadDemoAssets()
  await clearAll()
  await writeAllFixtures(entries)
  // 清掉之前选中的 active trip，避免 reset 后仍指向已删除行程
  await clearSessionKeys()
}

/** 清空 session store（active trip 等 UI 状态） */
async function clearSessionKeys(): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_SESSION, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
    tx.objectStore(STORE_SESSION).clear()
  })
}
