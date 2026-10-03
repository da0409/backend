// src/services/mock/assetApi.ts
// 依据 docs/API.md AssetApi 与 docs/TECHNICAL.md 第 8 节：
// - 组件向 assetApi.saveImage(file) 提交 File，不直接写 IndexedDB
// - 支持 JPG / JPEG / PNG / WebP
// - 长边不超过 1600px，目标大小不超过 1MB
// - 无法解码 / 类型不支持 / 超限时返回字段级错误
// - 展示地址由 getObjectUrl 在运行时生成

import type { Asset, AssetApi, Id } from '../contracts'
import {
  imageTooLargeError,
  unsupportedImageError,
  notFoundError,
} from '../contracts'
import { getAssetBlob, saveAssetWithBlob } from '../../db/assetStore'
import { nowInstant } from '../../utils/date'

const ACCEPTED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
])

const MAX_LONG_EDGE = 1600
const MAX_BYTES = 1024 * 1024 // 1MB

/** 内存里的 objectUrl 引用计数，避免重复创建和过早释放 */
const objectUrlCache = new Map<Id, string>()

/** 生成新的 Asset ID（不用 crypto.randomUUID 以兼容更多浏览器） */
function newAssetId(): Id {
  return `a_user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/** 用 createImageBitmap 读取图片尺寸并尝试缩放，失败则退回原图 */
async function tryResize(file: File): Promise<{
  blob: Blob
  width: number
  height: number
  mimeType: string
}> {
  const originalMime = file.type || 'image/png'

  // 1. 尝试解码
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw unsupportedImageError('无法解码这张图片，请换一张', 'file')
  }

  const { width: w, height: h } = bitmap

  // 2. 计算缩放比例
  const longEdge = Math.max(w, h)
  const scale = longEdge > MAX_LONG_EDGE ? MAX_LONG_EDGE / longEdge : 1
  const targetW = Math.round(w * scale)
  const targetH = Math.round(h * scale)

  // 3. 优先画到 canvas 上，再转成 jpeg（除非本来就是 png/webp）
  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw unsupportedImageError('浏览器不支持图片处理', 'file')
  }
  ctx.drawImage(bitmap, 0, 0, targetW, targetH)
  bitmap.close()

  const targetMime =
    originalMime === 'image/png' || originalMime === 'image/webp'
      ? originalMime
      : 'image/jpeg'

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b)
        else reject(unsupportedImageError('图片压缩失败', 'file'))
      },
      targetMime,
      0.85,
    )
  })

  return { blob, width: targetW, height: targetH, mimeType: targetMime }
}

export const assetApi: AssetApi = {
  async saveImage(file: File): Promise<Asset> {
    if (!ACCEPTED_MIME.has(file.type)) {
      throw unsupportedImageError(
        '只支持 JPG、PNG 或 WebP 图片',
        'file',
      )
    }

    let resized: { blob: Blob; width: number; height: number; mimeType: string }
    try {
      resized = await tryResize(file)
    } catch (e) {
      if (e && typeof e === 'object' && 'code' in e) throw e
      throw unsupportedImageError('图片处理失败', 'file')
    }

    if (resized.blob.size > MAX_BYTES) {
      throw imageTooLargeError('图片压缩后仍超过 1MB，请换一张', 'file')
    }

    const asset: Asset = {
      id: newAssetId(),
      mimeType: resized.mimeType,
      width: resized.width,
      height: resized.height,
      sizeBytes: resized.blob.size,
      source: 'user',
      createdAt: nowInstant(),
    }

    await saveAssetWithBlob(asset, resized.blob)
    return asset
  },

  async getObjectUrl(assetId: Id): Promise<string> {
    const cached = objectUrlCache.get(assetId)
    if (cached) return cached

    const blob = await getAssetBlob(assetId)
    if (!blob) {
      throw notFoundError('找不到这张图片，可能已被清理', 'assetId')
    }

    const url = URL.createObjectURL(blob)
    objectUrlCache.set(assetId, url)
    return url
  },

  revokeObjectUrl(url: string): void {
    for (const [assetId, u] of objectUrlCache.entries()) {
      if (u === url) {
        URL.revokeObjectURL(u)
        objectUrlCache.delete(assetId)
        return
      }
    }
    // 若不在缓存中，也尝试释放一次
    URL.revokeObjectURL(url)
  },
}