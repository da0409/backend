// src/db/assetStore.ts
// 依据 docs/API.md AssetApi 与 docs/TECHNICAL.md 第 8 节：
// - Asset 元数据存 STORE_ASSETS
// - Asset Blob 存 STORE_ASSET_BLOBS
// - 业务实体只存 assetId，不存 Base64 或 blob: URL

import { getOne, putOne, deleteOne, openDb } from './index'
import { STORE_ASSETS, STORE_ASSET_BLOBS } from './schema'
import type { Asset, Id } from '../services/contracts/types'
import { storageError } from '../services/contracts/errors'

/** 一条 Blob 记录 */
interface AssetBlobRecord {
  assetId: Id
  blob: Blob
}

export async function getAssetMeta(assetId: Id): Promise<Asset | undefined> {
  return getOne<Asset>(STORE_ASSETS, assetId)
}

export async function putAssetMeta(asset: Asset): Promise<void> {
  await putOne<Asset>(STORE_ASSETS, asset)
}

export async function getAssetBlob(assetId: Id): Promise<Blob | undefined> {
  const record = await getOne<AssetBlobRecord>(STORE_ASSET_BLOBS, assetId)
  return record?.blob
}

export async function putAssetBlob(assetId: Id, blob: Blob): Promise<void> {
  await putOne<AssetBlobRecord>(STORE_ASSET_BLOBS, { assetId, blob })
}

export async function deleteAsset(assetId: Id): Promise<void> {
  await deleteOne(STORE_ASSETS, assetId)
  await deleteOne(STORE_ASSET_BLOBS, assetId)
}

/** 一次性写入 Asset 元数据 + Blob（saveImage 用） */
export async function saveAssetWithBlob(asset: Asset, blob: Blob): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE_ASSETS, STORE_ASSET_BLOBS], 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(storageError('保存图片失败'))
    tx.onabort = () => reject(storageError('保存图片被中止'))

    try {
      tx.objectStore(STORE_ASSETS).put(asset)
      tx.objectStore(STORE_ASSET_BLOBS).put({ assetId: asset.id, blob })
    } catch {
      tx.abort()
      reject(storageError('保存图片失败'))
    }
  })
}
