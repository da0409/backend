import type { Id } from '../contracts'
import { validationError } from '../contracts'
import { getAssetBlob, getAssetMeta } from '../../db/assetStore'

/** 防止业务实体引用缺少元数据或 Blob 的图片。 */
export async function requireStoredImage(assetId: Id, field: string): Promise<void> {
  const [asset, blob] = await Promise.all([
    getAssetMeta(assetId),
    getAssetBlob(assetId),
  ])
  if (!asset || !blob) {
    throw validationError('找不到已保存的图片，请重新选择', field)
  }
}
