// src/utils/date.ts
// 依据 docs/TECHNICAL.md 第 6、9 节：
// - 业务日期使用 YYYY-MM-DD，按日历日期比较，不转 UTC
// - 事件时间用带时区 ISO 8601
// - 未来回信日期要落在时间窗闭区间内

import type { DateWindow, LocalDate, Instant } from '../services/contracts/types'

/** 当前时间 ISO 8601 */
export function nowInstant(): Instant {
  return new Date().toISOString()
}

/** 当前本地日期 YYYY-MM-DD */
export function todayLocalDate(): LocalDate {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/**
 * 判断两个闭区间 [aStart, aEnd] 与 [bStart, bEnd] 是否重叠。
 * 输入是 YYYY-MM-DD 字符串，按字典序比较即可（同格式等长）。
 */
export function dateRangesOverlap(
  aStart: LocalDate,
  aEnd: LocalDate,
  bStart: LocalDate,
  bEnd: LocalDate,
): boolean {
  return aStart <= bEnd && aEnd >= bStart
}

/** 把 YYYY-MM-DD 转成 Date（本地时区 00:00） */
export function localDateToDate(d: LocalDate): Date {
  const [y, m, day] = d.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, day ?? 1)
}

/** 把 Date 转成 YYYY-MM-DD（本地时区） */
export function dateToLocalDate(date: Date): LocalDate {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/** 日期窗中心点（毫秒时间戳），用于匹配排序 */
export function windowCenterMs(w: DateWindow): number {
  const s = localDateToDate(w.startDate).getTime()
  const e = localDateToDate(w.endDate).getTime()
  return (s + e) / 2
}

/** 日期窗天数（含首尾） */
export function windowDays(w: DateWindow): number {
  const s = localDateToDate(w.startDate).getTime()
  const e = localDateToDate(w.endDate).getTime()
  return Math.floor((e - s) / 86_400_000) + 1
}

/**
 * 在闭区间 [startDate, endDate] 内取两个有序且不同的日期。
 * - 窗口 >= 2 天：取起点 + 起点加一天
 * - 窗口 = 1 天：同一天重复两次（由调用方用不同事件时间区分）
 */
export function pickTwoDatesInWindow(w: DateWindow): [LocalDate, LocalDate] {
  const days = windowDays(w)
  if (days <= 1) return [w.startDate, w.startDate]
  const start = localDateToDate(w.startDate)
  const next = new Date(start.getTime() + 86_400_000)
  return [w.startDate, dateToLocalDate(next)]
}