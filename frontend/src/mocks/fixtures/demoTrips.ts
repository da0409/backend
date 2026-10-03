// src/mocks/fixtures/demoTrips.ts
// 依据 docs/PRODUCT.md FR-04 与 docs/API.md TripApi：
// - 1 条明确标注为「比赛模拟行程」的预置行程
// - 刻意让「上海」的行程与许愿树、老巷的 answerWindow 有重叠
// - 用固定 ID，reset 后链接不失效

import type { Trip } from '../../services/contracts/types'
import { DEMO_SELF_USER_ID } from './demoUsers'

export const DEMO_TRIP_SHANGHAI_ID = 't_demo_shanghai'

export const demoTrips: Trip[] = [
  {
    id: DEMO_TRIP_SHANGHAI_ID,
    travelerId: DEMO_SELF_USER_ID,
    destination: {
      cityCode: '310100',
      cityName: '上海',
      poiId: 'poi_peoples_square_sh',
      poiName: '人民广场',
      latitude: 31.2304,
      longitude: 121.4737,
    },
    arrivalDate: '2027-04-01',
    departureDate: '2027-04-07',
    source: 'demo',
    participatesInMatching: true,
    createdAt: '2026-09-24T00:00:00+08:00',
  },
]