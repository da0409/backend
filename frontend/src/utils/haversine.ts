// src/utils/haversine.ts
// 依据 docs/TECHNICAL.md 第 6 节：匹配排序第 2 级使用 Haversine 距离。

/** 地球平均半径（米） */
const EARTH_RADIUS_M = 6_371_000

/** 角度转弧度 */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/**
 * 两个坐标点之间的距离（米）。
 * 输入坐标单位是十进制度数。
 */
export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_M * c
}

/** 两个坐标是否都有效（都是有限数） */
export function hasCoords(
  latitude: number | undefined,
  longitude: number | undefined,
): boolean {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  )
}