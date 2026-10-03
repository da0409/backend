// src/mocks/fixtures/index.ts
// 统一导出所有 fixture，供 bootstrap 和 mock adapter 使用。

export * from './demoUsers'
export * from './demoAssets'
export * from './demoQuestions'
export * from './demoTrips'
export * from './demoStories'

import { demoAllUsers } from './demoUsers'
import { demoQuestions } from './demoQuestions'
import { demoTrips } from './demoTrips'

/** 当前 fixture 版本，与 schema.ts 里 FIXTURE_VERSION 对应 */
export const CURRENT_FIXTURE_VERSION = 2

/**
 * 一次性拿到全部 fixture 实体，bootstrap 直接遍历写入即可。
 * 注意：asset 的元数据和 blob 由 bootstrap 单独处理，不走这里。
 */
export function getAllFixtureEntities() {
  return {
    users: demoAllUsers,
    questions: demoQuestions,
    trips: demoTrips,
  }
}
