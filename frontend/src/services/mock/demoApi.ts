// src/services/mock/demoApi.ts
// 依据 docs/API.md DemoApi 与 docs/PRODUCT.md 第 6 节 FR-33 ~ FR-39：
// - bootstrap / reset：委托给 scenarios/bootstrap.ts
// - listScenarios：返回 fixture 里的 DemoScenarioSummary[]
// - revealFutureReplies：只对带 demoScenarioId 的问题生效，幂等

import type {
  Answer,
  Claim,
  DemoScenarioSummary,
  Id,
  Question,
} from '../contracts'
import { conflictError, notFoundError, storageError } from '../contracts'
import { getOne, openDb } from '../../db'
import {
  STORE_ANSWERS,
  STORE_CLAIMS,
  STORE_QUESTIONS,
} from '../../db/schema'
import {
  bootstrapDemoData,
  resetDemoData,
} from '../../mocks/scenarios/bootstrap'
import {
  demoScenarios,
} from '../../mocks/fixtures'
import {
  localDateToDate,
  pickTwoDatesInWindow,
} from '../../utils/date'

/** 模拟用户 ID，演示数据都挂在它们名下 */
const SIM_USER_1 = 'u_demo_alice'
const SIM_USER_2 = 'u_demo_bob'

/** 每条问题的模拟回答图 */
const SIM_ASSET_1 = 'a_demo_reply_xuyuan_1'
const SIM_ASSET_2 = 'a_demo_reply_xuyuan_2'

/**
 * 计算模拟回答的 Instant：
 * 给定 LocalDate（YYYY-MM-DD），在该日期的 14:00 +08:00 作为事件时间。
 */
function simulatedInstant(localDate: string, hour: number): string {
  const d = localDateToDate(localDate)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

export const demoApi = {
  async bootstrap(): Promise<void> {
    await bootstrapDemoData()
  },

  async reset(): Promise<void> {
    await resetDemoData()
  },

  async listScenarios(): Promise<DemoScenarioSummary[]> {
    return demoScenarios.map((scenario) => ({
      ...scenario,
      template: {
        ...scenario.template,
        location: { ...scenario.template.location },
        answerWindow: { ...scenario.template.answerWindow },
      },
    }))
  },

  async revealFutureReplies(questionId: Id): Promise<Answer[]> {
    if (!questionId) {
      throw notFoundError('缺少问题 ID', 'questionId')
    }

    const question = await getOne<Question>(STORE_QUESTIONS, questionId)
    if (!question) {
      throw notFoundError('找不到这个问题', 'questionId')
    }

    if (!question.demoScenarioId) {
      throw conflictError(
        '只有预制故事可以预览未来回信',
        'questionId',
      )
    }

    if (!demoScenarios.some((scenario) => scenario.id === question.demoScenarioId)) {
      throw conflictError('预制故事配置不一致', 'questionId')
    }

    // 计算两个日期，保证落在 answerWindow 内
    const [d1, d2] = pickTwoDatesInWindow(question.answerWindow)

    const baseClaimAt = simulatedInstant(d1, 9)
    const a1SubmittedAt = simulatedInstant(d1, 14)
    const a2SubmittedAt =
      d1 === d2
        ? simulatedInstant(d2, 16)
        : simulatedInstant(d2, 14)

    // 建两条模拟 Claim（completed），让时间线上有对应的 claim 信息
    const claim1: Claim = {
      id: `c_sim_${questionId}_1`,
      questionId,
      travelerId: SIM_USER_1,
      status: 'completed',
      claimedAt: baseClaimAt,
      updatedAt: a1SubmittedAt,
    }
    const claim2: Claim = {
      id: `c_sim_${questionId}_2`,
      questionId,
      travelerId: SIM_USER_2,
      status: 'completed',
      claimedAt: baseClaimAt,
      updatedAt: a2SubmittedAt,
    }

    const answer1: Answer = {
      id: `an_sim_${questionId}_1`,
      questionId,
      claimId: claim1.id,
      authorId: SIM_USER_1,
      photoAssetId: SIM_ASSET_1,
      text: '我今天路过看到了，木牌还在，就挂在东侧那根粗枝上。',
      onSiteDeclaration: true,
      isSatisfiedByAuthor: false,
      isSimulated: true,
      submittedAt: a1SubmittedAt,
    }

    const answer2: Answer = {
      id: `an_sim_${questionId}_2`,
      questionId,
      claimId: claim2.id,
      authorId: SIM_USER_2,
      photoAssetId: SIM_ASSET_2,
      text: '木牌还在，旁边多了一块新的木牌，看起来是新挂上去的。',
      onSiteDeclaration: true,
      isSatisfiedByAuthor: false,
      isSimulated: true,
      submittedAt: a2SubmittedAt,
    }

    const db = await openDb()
    return new Promise<Answer[]>((resolve, reject) => {
      const tx = db.transaction([STORE_CLAIMS, STORE_ANSWERS], 'readwrite')
      let result: Answer[] = []
      tx.oncomplete = () => resolve(result)
      tx.onerror = () => reject(storageError('生成未来回信失败'))
      tx.onabort = () => reject(storageError('生成未来回信被中止'))

      // 在同一写事务里检查并生成，避免并发触发时覆盖已有回信。
      const request = tx.objectStore(STORE_ANSWERS).index('by_question').getAll(questionId)
      request.onsuccess = () => {
        const existing = (request.result as Answer[]).filter((answer) => answer.isSimulated)
        if (existing.some((answer) => answer.id === answer1.id) &&
            existing.some((answer) => answer.id === answer2.id)) {
          result = existing
          return
        }
        try {
          result = [...existing]
          if (!existing.some((answer) => answer.id === answer1.id)) {
            tx.objectStore(STORE_CLAIMS).put(claim1)
            tx.objectStore(STORE_ANSWERS).put(answer1)
            result.push(answer1)
          }
          if (!existing.some((answer) => answer.id === answer2.id)) {
            tx.objectStore(STORE_CLAIMS).put(claim2)
            tx.objectStore(STORE_ANSWERS).put(answer2)
            result.push(answer2)
          }
        } catch {
          tx.abort()
        }
      }
    })
  },
}

export type DemoApiImpl = typeof demoApi
