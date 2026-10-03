// src/services/mock/answerApi.ts
// 依据 docs/API.md AnswerApi 与 docs/PRODUCT.md FR-18 / FR-26 / FR-27：
// - create：只有 active Claim 能提交；提交后 Claim 变 completed
//         照片、文字、现场声明均必填
// - setSatisfied：只有问题作者能操作；可以有多条满意回答
// - listMine：当前用户的全部回答

import type {
  Answer,
  Claim,
  CreateAnswerInput,
  Id,
  Question,
} from '../contracts'
import {
  conflictError,
  forbiddenError,
  notFoundError,
  storageError,
  validationError,
} from '../contracts'
import { getAllByIndex, getOne, openDb, putOne } from '../../db'
import {
  STORE_ANSWERS,
  STORE_CLAIMS,
  STORE_QUESTIONS,
} from '../../db/schema'
import { DEMO_SELF_USER_ID } from '../../mocks/fixtures'
import { nowInstant } from '../../utils/date'
import { requireStoredImage } from './assetValidation'

function newAnswerId(): Id {
  return `an_user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function isNonEmpty(s: unknown): s is string {
  return typeof s === 'string' && s.trim().length > 0
}

function validateCreateAnswerInput(input: CreateAnswerInput): void {
  if (!isNonEmpty(input.photoAssetId)) {
    throw validationError('请上传现场照片', 'photoAssetId')
  }
  if (!isNonEmpty(input.text)) {
    throw validationError('请写下你的回答', 'text')
  }
  if (input.onSiteDeclaration !== true) {
    throw validationError('请勾选现场拍摄声明', 'onSiteDeclaration')
  }
}

async function saveAnswerForActiveClaim(
  claimId: Id,
  input: CreateAnswerInput,
): Promise<Answer> {
  const db = await openDb()
  return new Promise<Answer>((resolve, reject) => {
    const tx = db.transaction([STORE_CLAIMS, STORE_ANSWERS], 'readwrite')
    let answer: Answer | undefined
    let failure: unknown

    tx.oncomplete = () => {
      if (answer) resolve(answer)
      else reject(storageError('提交回答失败'))
    }
    tx.onerror = () => reject(storageError('提交回答失败'))
    tx.onabort = () => reject(failure ?? storageError('提交回答被中止'))

    const fail = (reason: unknown): void => {
      failure = reason
      tx.abort()
    }

    const request = tx.objectStore(STORE_CLAIMS).get(claimId)
    request.onsuccess = () => {
      const currentClaim = request.result as Claim | undefined
      if (!currentClaim) return fail(notFoundError('找不到这条领取', 'claimId'))
      if (currentClaim.travelerId !== DEMO_SELF_USER_ID) {
        return fail(forbiddenError('不能替他人提交回答', 'claimId'))
      }
      if (currentClaim.status !== 'active') {
        return fail(conflictError('只有进行中的领取可以提交回答', 'claimId'))
      }

      const submittedAt = nowInstant()
      answer = {
        id: newAnswerId(),
        questionId: currentClaim.questionId,
        claimId: currentClaim.id,
        authorId: DEMO_SELF_USER_ID,
        photoAssetId: input.photoAssetId,
        text: input.text.trim(),
        onSiteDeclaration: true,
        isSatisfiedByAuthor: false,
        isSimulated: false,
        submittedAt,
      }

      try {
        tx.objectStore(STORE_ANSWERS).put(answer)
        tx.objectStore(STORE_CLAIMS).put({
          ...currentClaim,
          status: 'completed',
          updatedAt: submittedAt,
        } satisfies Claim)
      } catch {
        fail(storageError('提交回答失败'))
      }
    }
  })
}

export const answerApi = {
  async listMine(): Promise<Answer[]> {
    const answers = await getAllByIndex<Answer>(
      STORE_ANSWERS,
      'by_author',
      DEMO_SELF_USER_ID,
    )
    answers.sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1))
    return answers
  },

  async create(claimId: Id, input: CreateAnswerInput): Promise<Answer> {
    if (!claimId) {
      throw validationError('缺少领取 ID', 'claimId')
    }

    validateCreateAnswerInput(input)

    const claim = await getOne<Claim>(STORE_CLAIMS, claimId)
    if (!claim) {
      throw notFoundError('找不到这条领取', 'claimId')
    }

    if (claim.travelerId !== DEMO_SELF_USER_ID) {
      throw forbiddenError('不能替他人提交回答', 'claimId')
    }

    if (claim.status !== 'active') {
      throw conflictError('只有进行中的领取可以提交回答', 'claimId')
    }

    await requireStoredImage(input.photoAssetId, 'photoAssetId')

    return saveAnswerForActiveClaim(claimId, input)
  },

  async setSatisfied(answerId: Id, satisfied: boolean): Promise<Answer> {
    if (!answerId) {
      throw validationError('缺少回答 ID', 'answerId')
    }

    const answer = await getOne<Answer>(STORE_ANSWERS, answerId)
    if (!answer) {
      throw notFoundError('找不到这条回答', 'answerId')
    }

    const question = await getOne<Question>(STORE_QUESTIONS, answer.questionId)
    if (!question) {
      throw notFoundError('找不到关联问题', 'questionId')
    }

    if (question.authorId !== DEMO_SELF_USER_ID) {
      throw forbiddenError('只有问题作者可以标记满意回答', 'answerId')
    }

    const updated: Answer = {
      ...answer,
      isSatisfiedByAuthor: satisfied,
      satisfiedAt: satisfied ? nowInstant() : undefined,
    }

    await putOne<Answer>(STORE_ANSWERS, updated)
    return updated
  },
}

export type AnswerApiImpl = typeof answerApi
