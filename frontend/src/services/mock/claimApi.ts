// src/services/mock/claimApi.ts
// 依据 docs/API.md ClaimApi 与 docs/PRODUCT.md 第 5.3 节、FR-15 / FR-16：
// - create：不能领取自己的问题；同一用户对同一问题最多一条 active
// - cancel：只允许作用于 active Claim
// - listMine：当前用户的全部 Claim

import type { Claim, Id } from '../contracts'
import {
  conflictError,
  forbiddenError,
  notFoundError,
  validationError,
} from '../contracts'
import {
  getAllByIndex,
  getOne,
  putOne,
} from '../../db'
import {
  STORE_CLAIMS,
  STORE_QUESTIONS,
} from '../../db/schema'
import { DEMO_SELF_USER_ID } from '../../mocks/fixtures'
import { nowInstant } from '../../utils/date'
import type { Question } from '../contracts'

function newClaimId(): Id {
  return `c_user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export const claimApi = {
  async listMine(): Promise<Claim[]> {
    const claims = await getAllByIndex<Claim>(
      STORE_CLAIMS,
      'by_traveler',
      DEMO_SELF_USER_ID,
    )
    claims.sort((a, b) => (a.claimedAt < b.claimedAt ? 1 : -1))
    return claims
  },

  async create(questionId: Id): Promise<Claim> {
    if (!questionId) {
      throw validationError('缺少问题 ID', 'questionId')
    }

    const question = await getOne<Question>(STORE_QUESTIONS, questionId)
    if (!question) {
      throw notFoundError('找不到这个问题', 'questionId')
    }

    // 不能领取自己的问题
    if (question.authorId === DEMO_SELF_USER_ID) {
      throw forbiddenError('不能领取自己发布的问题', 'questionId')
    }

    // 同一用户对同一问题最多一条 active Claim
    const existing = await getAllByIndex<Claim>(
      STORE_CLAIMS,
      'by_question',
      questionId,
    )
    const myActive = existing.find(
      (c) => c.travelerId === DEMO_SELF_USER_ID && c.status === 'active',
    )
    if (myActive) {
      throw conflictError('你已经领取过这个问题', 'questionId')
    }

    const now = nowInstant()
    const claim: Claim = {
      id: newClaimId(),
      questionId,
      travelerId: DEMO_SELF_USER_ID,
      status: 'active',
      claimedAt: now,
      updatedAt: now,
    }

    await putOne<Claim>(STORE_CLAIMS, claim)
    return claim
  },

  async cancel(claimId: Id): Promise<Claim> {
    if (!claimId) {
      throw validationError('缺少领取 ID', 'claimId')
    }

    const claim = await getOne<Claim>(STORE_CLAIMS, claimId)
    if (!claim) {
      throw notFoundError('找不到这条领取', 'claimId')
    }

    if (claim.travelerId !== DEMO_SELF_USER_ID) {
      throw forbiddenError('不能取消他人的领取', 'claimId')
    }

    if (claim.status !== 'active') {
      throw conflictError('只有进行中的领取可以取消', 'claimId')
    }

    const updated: Claim = {
      ...claim,
      status: 'cancelled',
      updatedAt: nowInstant(),
    }

    await putOne<Claim>(STORE_CLAIMS, updated)
    return updated
  },
}

export type ClaimApiImpl = typeof claimApi