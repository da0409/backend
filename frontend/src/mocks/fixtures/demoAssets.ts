// 预置图片只在初始化时读取打包资源；页面仍通过 Asset API 读取 IndexedDB。
import type { Asset } from '../../services/contracts/types'
import xuyuanReferenceUrl from '../../assets/demo/xuyuan-reference.png?url'
import alleyReferenceUrl from '../../assets/demo/alley-reference.png?url'
import bridgeReferenceUrl from '../../assets/demo/bridge-reference.png?url'
import treeReferenceUrl from '../../assets/demo/tree-reference.png?url'
import xuyuanReply1Url from '../../assets/demo/xuyuan-reply-1.png?url'
import xuyuanReply2Url from '../../assets/demo/xuyuan-reply-2.png?url'

export interface PresetAssetEntry {
  asset: Asset
  blob: Blob
}

const createdAt = '2026-09-24T00:00:00+08:00'

const photoSources = [
  { id: 'a_demo_xuyuan_ref', url: xuyuanReferenceUrl },
  { id: 'a_demo_alley_ref', url: alleyReferenceUrl },
  { id: 'a_demo_bridge_ref', url: bridgeReferenceUrl },
  { id: 'a_demo_tree_ref', url: treeReferenceUrl },
  { id: 'a_demo_reply_xuyuan_1', url: xuyuanReply1Url },
  { id: 'a_demo_reply_xuyuan_2', url: xuyuanReply2Url },
] as const

export const presetPhotoAssetIds: string[] = photoSources.map(source => source.id)

async function loadPhoto(source: (typeof photoSources)[number]): Promise<PresetAssetEntry> {
  const response = await fetch(source.url)
  if (!response.ok) throw new Error(`预置图片载入失败：${source.id}`)
  const blob = await response.blob()
  if (!blob.size) throw new Error(`预置图片为空：${source.id}`)
  return {
    asset: {
      id: source.id,
      mimeType: 'image/png',
      width: 1448,
      height: 1086,
      sizeBytes: blob.size,
      source: 'preset',
      createdAt,
    },
    blob,
  }
}

function selfQuestionPlaceholder(): PresetAssetEntry {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
  <rect width="640" height="480" fill="#E8E2F2"/>
  <text x="320" y="220" font-family="sans-serif" font-size="32" fill="#3A2F52" text-anchor="middle">演示地点</text>
  <text x="320" y="270" font-family="sans-serif" font-size="20" fill="#3A2F52" text-anchor="middle">当前用户发布</text>
  <text x="320" y="440" font-family="sans-serif" font-size="14" fill="#3A2F52" text-anchor="middle">比赛模拟素材</text>
</svg>`
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  return {
    asset: {
      id: 'a_demo_self_ref',
      mimeType: 'image/svg+xml',
      width: 640,
      height: 480,
      sizeBytes: blob.size,
      source: 'preset',
      createdAt,
    },
    blob,
  }
}

export async function loadDemoAssets(): Promise<PresetAssetEntry[]> {
  const photos = await Promise.all(photoSources.map(loadPhoto))
  return [...photos, selfQuestionPlaceholder()]
}
