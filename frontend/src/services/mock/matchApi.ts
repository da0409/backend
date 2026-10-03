// src/services/mock/matchApi.ts
// 依据 docs/TECHNICAL.md 第 6 节：
// 入选：question.location.cityCode === trip.destination.cityCode
//       且 question.answerWindow.startDate <= trip.departureDate
//       且 question.answerWindow.endDate   >= trip.arrivalDate
// 排序：poiId 相同 > 有坐标按 Haversine 距离升序 > 时间窗中心更接近行程中心
//       > 回答数少 > id 升序
// 缺坐标的问题：保留资格，排在所有有距离的问题之后

import type {
  Answer,
  Asset,
  Claim,
  Id,
  Question,
  QuestionDisplayStatus,
  QuestionSummary,
  Trip,
  User,
} from '../contracts'
import { notFoundError } from '../contracts'
import { getAll, getAllByIndex, getOne } from '../../db'
import {
  STORE_ANSWERS,
  STORE_ASSETS,
  STORE_CLAIMS,
  STORE_QUESTIONS,
  STORE_TRIPS,
  STORE_USERS,
} from '../../db/schema'
import { dateRangesOverlap, windowCenterMs } from '../../utils/date'
import { haversineMeters, hasCoords } from '../../utils/haversine'
import { normalizeManualLocation } from './locationCodes'

async function loadAuthor(authorId: Id): Promise<User> {
  const user = await getOne<User>(STORE_USERS, authorId)
  if (!user) throw notFoundError('找不到问题作者', 'authorId')
  return user
}

async function loadAsset(assetId: Id): Promise<Asset> {
  const asset = await getOne<Asset>(STORE_ASSETS, assetId)
  if (!asset) throw notFoundError('找不到关联图片', 'assetId')
  return asset
}

interface SortInput {
  question: Question
  samePoi: boolean
  tripCenterMs: number
  distanceMeters: number | undefined
  answerCount: number
  satisfiedCount: number
  activeClaimCount: number
}

function compareMatch(a: SortInput, b: SortInput): number {
  // 1. poiId 相同优先
  if (a.samePoi !== b.samePoi) return a.samePoi ? -1 : 1

  // 2. 距离升序（缺坐标排最后）
  const ad = a.distanceMeters ?? Number.POSITIVE_INFINITY
  const bd = b.distanceMeters ?? Number.POSITIVE_INFINITY
  if (ad !== bd) return ad - bd

  // 3. 时间窗中心更接近行程中心优先
  const aDelta = Math.abs(windowCenterMs(a.question.answerWindow) - a.tripCenterMs)
  const bDelta = Math.abs(windowCenterMs(b.question.answerWindow) - b.tripCenterMs)
  if (aDelta !== bDelta) return aDelta - bDelta

  // 4. 回答数少优先
  if (a.answerCount !== b.answerCount) return a.answerCount - b.answerCount

  // 5. id 升序
  return a.question.id < b.question.id ? -1 : 1
}

async function countAnswers(questionId: Id): Promise<{
  total: number
  satisfied: number
}> {
  const answers = await getAllByIndex<Answer>(
    STORE_ANSWERS,
    'by_question',
    questionId,
  )
  let satisfied = 0
  for (const a of answers) if (a.isSatisfiedByAuthor) satisfied += 1
  return { total: answers.length, satisfied }
}

async function countActiveClaims(questionId: Id): Promise<number> {
  const claims = await getAllByIndex<Claim>(
    STORE_CLAIMS,
    'by_question',
    questionId,
  )
  let n = 0
  for (const c of claims) if (c.status === 'active') n += 1
  return n
}

function deriveDisplayStatus(
  answerCount: number,
  satisfiedCount: number,
): QuestionDisplayStatus {
  if (satisfiedCount > 0) return 'has_satisfied_answers'
  if (answerCount > 0) return 'has_answers'
  return 'no_answers'
}

export const matchApi = {
  async listForTrip(tripId: Id): Promise<QuestionSummary[]> {
    const trip = await getOne<Trip>(STORE_TRIPS, tripId)
    if (!trip) {
      throw notFoundError('找不到这条行程', 'tripId')
    }
    if (!trip.participatesInMatching) return []

    const questions = await getAll<Question>(STORE_QUESTIONS)

    // 1. 城市 + 日期闭区间筛选
    const tripLocation = normalizeManualLocation(trip.destination)
    const eligible = questions.filter((q) => {
      if (normalizeManualLocation(q.location).cityCode !== tripLocation.cityCode) return false
      return dateRangesOverlap(
        q.answerWindow.startDate,
        q.answerWindow.endDate,
        trip.arrivalDate,
        trip.departureDate,
      )
    })

    // 2. 计算排序输入
    const tripCenterMs = windowCenterMs({
      startDate: trip.arrivalDate,
      endDate: trip.departureDate,
    })
    const tripPoiId = tripLocation.poiId
    const tripHasCoords = hasCoords(
      trip.destination.latitude,
      trip.destination.longitude,
    )

    const sortInputs: SortInput[] = []
    for (const q of eligible) {
      const counts = await countAnswers(q.id)
      const activeClaimCount = await countActiveClaims(q.id)

      let distanceMeters: number | undefined
      if (
        tripHasCoords &&
        hasCoords(q.location.latitude, q.location.longitude)
      ) {
        distanceMeters = haversineMeters(
          trip.destination.latitude as number,
          trip.destination.longitude as number,
          q.location.latitude as number,
          q.location.longitude as number,
        )
      }

      sortInputs.push({
        question: q,
        samePoi: normalizeManualLocation(q.location).poiId === tripPoiId,
        tripCenterMs,
        distanceMeters,
        answerCount: counts.total,
        satisfiedCount: counts.satisfied,
        activeClaimCount,
      })
    }

    sortInputs.sort(compareMatch)

    // 3. 聚合 summary
    const summaries: QuestionSummary[] = []
    for (const item of sortInputs) {
      const [author, referenceAsset] = await Promise.all([
        loadAuthor(item.question.authorId),
        loadAsset(item.question.referenceAssetId),
      ])
      summaries.push({
        question: item.question,
        author,
        referenceAsset,
        displayStatus: deriveDisplayStatus(item.answerCount, item.satisfiedCount),
        answerCount: item.answerCount,
        satisfiedAnswerCount: item.satisfiedCount,
        activeClaimCount: item.activeClaimCount,
        distanceMeters: item.distanceMeters,
      })
    }

    return summaries
  },
}

export type MatchApiImpl = typeof matchApi
