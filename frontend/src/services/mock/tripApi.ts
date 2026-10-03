// src/services/mock/tripApi.ts
// 依据 docs/API.md TripApi 与 docs/PRODUCT.md FR-03 / FR-04：
// - listMine：读当前用户的所有行程
// - create：手动行程，写 IndexedDB，刷新不丢
// - importDemoTrip：从 fixture 里的 demo 行程复制一条给当前用户
// - setActive / getActive：当前行程存在 session store

import type { CreateTripInput, Id, Trip } from '../contracts'
import { notFoundError, validationError } from '../contracts'
import {
  getAllByIndex,
  getOne,
  putOne,
} from '../../db'
import {
  STORE_SESSION,
  STORE_TRIPS,
  SESSION_KEY_ACTIVE_TRIP,
} from '../../db/schema'
import {
  DEMO_SELF_USER_ID,
  DEMO_TRIP_SHANGHAI_ID,
  demoTrips,
} from '../../mocks/fixtures'
import { nowInstant } from '../../utils/date'
import { normalizeManualLocation } from './locationCodes'

interface SessionRecord {
  key: string
  value: unknown
}

function newTripId(): Id {
  return `t_user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function isNonEmpty(s: unknown): s is string {
  return typeof s === 'string' && s.trim().length > 0
}

function validateCreateTripInput(input: CreateTripInput): void {
  const d = input.destination
  if (!d || !isNonEmpty(d.cityCode)) {
    throw validationError('请选择城市', 'destination.cityCode')
  }
  if (!isNonEmpty(d.poiId)) {
    throw validationError('请选择地点', 'destination.poiId')
  }
  if (!isNonEmpty(input.arrivalDate)) {
    throw validationError('请选择到达日期', 'arrivalDate')
  }
  if (!isNonEmpty(input.departureDate)) {
    throw validationError('请选择离开日期', 'departureDate')
  }
  if (input.arrivalDate > input.departureDate) {
    throw validationError('离开日期不能早于到达日期', 'departureDate')
  }
}

export const tripApi = {
  async listMine(): Promise<Trip[]> {
    const trips = await getAllByIndex<Trip>(
      STORE_TRIPS,
      'by_traveler',
      DEMO_SELF_USER_ID,
    )
    trips.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    return trips
  },

  async create(input: CreateTripInput): Promise<Trip> {
    validateCreateTripInput(input)

    const trip: Trip = {
      id: newTripId(),
      travelerId: DEMO_SELF_USER_ID,
      destination: normalizeManualLocation(input.destination),
      arrivalDate: input.arrivalDate,
      departureDate: input.departureDate,
      source: 'manual',
      participatesInMatching: input.participatesInMatching,
      createdAt: nowInstant(),
    }

    await putOne<Trip>(STORE_TRIPS, trip)
    return trip
  },

  async importDemoTrip(scenarioId: Id): Promise<Trip> {
    // 第一阶段只有一条 demo 行程，且它的 id 固定。
    // scenarioId 目前不用，但保留参数以匹配契约。
    void scenarioId

    const source = demoTrips.find((t) => t.id === DEMO_TRIP_SHANGHAI_ID)
    if (!source) {
      throw notFoundError('找不到模拟行程', 'scenarioId')
    }

    const trip: Trip = {
      ...source,
      travelerId: DEMO_SELF_USER_ID,
      createdAt: nowInstant(),
    }

    await putOne<Trip>(STORE_TRIPS, trip)
    return trip
  },

  async setActive(tripId: Id): Promise<void> {
    const trip = await getOne<Trip>(STORE_TRIPS, tripId)
    if (!trip) {
      throw notFoundError('找不到这条行程', 'tripId')
    }
    await putOne<SessionRecord>(STORE_SESSION, {
      key: SESSION_KEY_ACTIVE_TRIP,
      value: tripId,
    })
  },

  async getActive(): Promise<Trip | undefined> {
    const record = await getOne<SessionRecord>(
      STORE_SESSION,
      SESSION_KEY_ACTIVE_TRIP,
    )
    if (!record || typeof record.value !== 'string') return undefined
    return getOne<Trip>(STORE_TRIPS, record.value)
  },
}

export type TripApiImpl = typeof tripApi
