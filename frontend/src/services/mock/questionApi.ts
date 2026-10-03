// src/services/mock/questionApi.ts
// 依据 docs/API.md QuestionApi 与 docs/PRODUCT.md 第 5.2 节：
// - listDiscover：按 curationOrder 升序，undefined 排最后
// - listMine：过滤 authorId === 当前用户
// - getById：聚合 answers / claim / 计数 / 展示状态
// - create：校验必填字段和日期窗

import type {
  Answer,
  AnswerSort,
  Asset,
  Claim,
  CreateQuestionInput,
  Id,
  Question,
  QuestionDetail,
  QuestionDisplayStatus,
  QuestionSummary,
  User,
} from '../contracts'
import { notFoundError, validationError } from '../contracts'
import { normalizeManualLocation } from './locationCodes'
import { getAll, getAllByIndex, getOne, putOne } from '../../db'
import {
  STORE_ANSWERS,
  STORE_ASSETS,
  STORE_CLAIMS,
  STORE_QUESTIONS,
  STORE_USERS,
} from '../../db/schema'
import { DEMO_SELF_USER_ID, demoScenarios } from '../../mocks/fixtures'
import { nowInstant } from '../../utils/date'
import { requireStoredImage } from './assetValidation'

// ---- 内部工具 ----

function newQuestionId(): Id {
  return `q_user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function deriveDisplayStatus(
  answerCount: number,
  satisfiedCount: number,
): QuestionDisplayStatus {
  if (satisfiedCount > 0) return 'has_satisfied_answers'
  if (answerCount > 0) return 'has_answers'
  return 'no_answers'
}

function isNonEmpty(s: unknown): s is string {
  return typeof s === 'string' && s.trim().length > 0
}

function validateCreateQuestionInput(input: CreateQuestionInput): void {
  if (!isNonEmpty(input.title)) {
    throw validationError('标题不能为空', 'title')
  }
  if (!isNonEmpty(input.description)) {
    throw validationError('问题描述不能为空', 'description')
  }
  if (!isNonEmpty(input.referenceAssetId)) {
    throw validationError('请上传参照照片', 'referenceAssetId')
  }
  const loc = input.location
  if (!loc || !isNonEmpty(loc.cityCode)) {
    throw validationError('请选择城市', 'location.cityCode')
  }
  if (!isNonEmpty(loc.poiId)) {
    throw validationError('请选择地点', 'location.poiId')
  }
  const w = input.answerWindow
  if (!w || !isNonEmpty(w.startDate) || !isNonEmpty(w.endDate)) {
    throw validationError('请选择回答时间窗', 'answerWindow')
  }
  if (w.startDate > w.endDate) {
    throw validationError(
      '回答结束日期不能早于开始日期',
      'answerWindow.endDate',
    )
  }

  if (input.demoScenarioId !== undefined) {
    const scenario = demoScenarios.find((s) => s.id === input.demoScenarioId)
    if (!scenario) {
      throw validationError('找不到这个预制场景', 'demoScenarioId')
    }
    if (input.referenceAssetId !== scenario.template.referenceAssetId) {
      throw validationError('预制场景的参照照片不能更换', 'referenceAssetId')
    }
    const location = scenario.template.location
    if (
      loc.cityCode !== location.cityCode ||
      loc.cityName !== location.cityName ||
      loc.poiId !== location.poiId ||
      loc.poiName !== location.poiName ||
      loc.latitude !== location.latitude ||
      loc.longitude !== location.longitude
    ) {
      throw validationError('预制场景的地点不能更换', 'location')
    }
  }
}

async function loadAuthor(authorId: Id): Promise<User> {
  const user = await getOne<User>(STORE_USERS, authorId)
  if (!user) {
    throw notFoundError('找不到问题作者', 'authorId')
  }
  return user
}

async function loadAsset(assetId: Id): Promise<Asset> {
  const asset = await getOne<Asset>(STORE_ASSETS, assetId)
  if (!asset) {
    throw notFoundError('找不到关联图片', 'assetId')
  }
  return asset
}

async function countAnswersAndSatisfied(
  questionId: Id,
): Promise<{ answerCount: number; satisfiedCount: number }> {
  const answers = await getAllByIndex<Answer>(
    STORE_ANSWERS,
    'by_question',
    questionId,
  )
  let satisfied = 0
  for (const a of answers) if (a.isSatisfiedByAuthor) satisfied += 1
  return { answerCount: answers.length, satisfiedCount: satisfied }
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

async function toQuestionSummary(
  question: Question,
): Promise<QuestionSummary> {
  const [author, referenceAsset, counts, activeClaimCount] = await Promise.all([
    loadAuthor(question.authorId),
    loadAsset(question.referenceAssetId),
    countAnswersAndSatisfied(question.id),
    countActiveClaims(question.id),
  ])

  return {
    question,
    author,
    referenceAsset,
    displayStatus: deriveDisplayStatus(counts.answerCount, counts.satisfiedCount),
    answerCount: counts.answerCount,
    satisfiedAnswerCount: counts.satisfiedCount,
    activeClaimCount,
  }
}

function sortByCuration(a: Question, b: Question): number {
  const ao = a.curationOrder
  const bo = b.curationOrder
  if (ao === undefined && bo === undefined) return a.id < b.id ? -1 : 1
  if (ao === undefined) return 1
  if (bo === undefined) return -1
  if (ao !== bo) return ao - bo
  return a.id < b.id ? -1 : 1
}

function sortAnswersByTime(answers: Answer[], sort: AnswerSort): Answer[] {
  const sorted = [...answers].sort((a, b) =>
    a.submittedAt < b.submittedAt ? -1 : a.submittedAt > b.submittedAt ? 1 : 0,
  )
  return sort === 'newest' ? sorted.reverse() : sorted
}

// ---- 公共 API 实现 ----

export const questionApi = {
  async listDiscover(): Promise<QuestionSummary[]> {
    const questions = await getAll<Question>(STORE_QUESTIONS)
    questions.sort(sortByCuration)
    return Promise.all(questions.map(toQuestionSummary))
  },

  async listMine(): Promise<QuestionSummary[]> {
    const questions = await getAll<Question>(STORE_QUESTIONS)
    const mine = questions.filter((q) => q.authorId === DEMO_SELF_USER_ID)
    mine.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    return Promise.all(mine.map(toQuestionSummary))
  },

  async getById(id: Id, sort: AnswerSort = 'oldest'): Promise<QuestionDetail> {
    const question = await getOne<Question>(STORE_QUESTIONS, id)
    if (!question) {
      throw notFoundError('找不到这个问题', 'id')
    }

    const [author, referenceAsset, rawAnswers, claims] = await Promise.all([
      loadAuthor(question.authorId),
      loadAsset(question.referenceAssetId),
      getAllByIndex<Answer>(STORE_ANSWERS, 'by_question', id),
      getAllByIndex<Claim>(STORE_CLAIMS, 'by_question', id),
    ])

    const orderedAnswers = sortAnswersByTime(rawAnswers, sort)

    const answers = await Promise.all(
      orderedAnswers.map(async (a) => {
        const [answerAuthor, photoAsset] = await Promise.all([
          loadAuthor(a.authorId),
          loadAsset(a.photoAssetId),
        ])
        return { ...a, author: answerAuthor, photoAsset }
      }),
    )

    let satisfiedAnswerCount = 0
    for (const a of rawAnswers) if (a.isSatisfiedByAuthor) satisfiedAnswerCount += 1

    let activeClaimCount = 0
    let currentUserClaim: Claim | undefined
    for (const c of claims) {
      if (c.status === 'active') activeClaimCount += 1
      if (c.travelerId === DEMO_SELF_USER_ID && c.status === 'active') {
        currentUserClaim = c
      }
    }

    const canClaim =
      question.authorId !== DEMO_SELF_USER_ID && currentUserClaim === undefined
    const canManageSatisfaction = question.authorId === DEMO_SELF_USER_ID

    return {
      question,
      author,
      referenceAsset,
      displayStatus: deriveDisplayStatus(
        rawAnswers.length,
        satisfiedAnswerCount,
      ),
      answerCount: rawAnswers.length,
      satisfiedAnswerCount,
      activeClaimCount,
      answers,
      currentUserClaim,
      canClaim,
      canManageSatisfaction,
    }
  },

  async create(input: CreateQuestionInput): Promise<Question> {
    validateCreateQuestionInput(input)
    await requireStoredImage(input.referenceAssetId, 'referenceAssetId')

    const question: Question = {
      id: newQuestionId(),
      authorId: DEMO_SELF_USER_ID,
      title: input.title.trim(),
      description: input.description.trim(),
      referenceAssetId: input.referenceAssetId,
      location: input.demoScenarioId ? input.location : normalizeManualLocation(input.location),
      answerWindow: input.answerWindow,
      shootingGuide: input.shootingGuide,
      demoScenarioId: input.demoScenarioId,
      createdAt: nowInstant(),
    }

    await putOne<Question>(STORE_QUESTIONS, question)
    return question
  },
}

export type QuestionApiImpl = typeof questionApi
