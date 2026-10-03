// src/services/contracts/index.ts
// 依据 docs/API.md 第 4 节定义 8 个前端服务接口。
// 页面和 Store 只能 import 这里的类型和接口。

import type {
  Answer,
  AnswerSort,
  Claim,
  CreateAnswerInput,
  CreateQuestionInput,
  CreateTripInput,
  DemoScenarioSummary,
  Id,
  Question,
  QuestionDetail,
  QuestionSummary,
  Trip,
  User,
  Asset,
} from './types'

export * from './types'
export * from './errors'

// ---- Session ----

export interface SessionApi {
  getCurrentUser(): Promise<User>
  hasSession?(): boolean
  login?(username: string, password: string): Promise<User>
  register?(username: string, password: string, nickname: string): Promise<User>
  logout?(): Promise<void>
}

// ---- Question ----

export interface QuestionApi {
  listDiscover(): Promise<QuestionSummary[]>
  listMine(): Promise<QuestionSummary[]>
  getById(id: Id, sort?: AnswerSort): Promise<QuestionDetail>
  create(input: CreateQuestionInput): Promise<Question>
}

// ---- Trip ----

export interface TripApi {
  listMine(): Promise<Trip[]>
  create(input: CreateTripInput): Promise<Trip>
  importDemoTrip(scenarioId: Id): Promise<Trip>
  setActive(tripId: Id): Promise<void>
  getActive(): Promise<Trip | undefined>
}

// ---- Match ----

export interface MatchApi {
  listForTrip(tripId: Id): Promise<QuestionSummary[]>
}

// ---- Claim ----

export interface ClaimApi {
  listMine(): Promise<Claim[]>
  create(questionId: Id): Promise<Claim>
  cancel(claimId: Id): Promise<Claim>
  checkin?(claimId: Id, coordinates: { longitude: number; latitude: number }): Promise<void>
}

// ---- Answer ----

export interface AnswerApi {
  listMine(): Promise<Answer[]>
  create(claimId: Id, input: CreateAnswerInput): Promise<Answer>
  setSatisfied(answerId: Id, satisfied: boolean): Promise<Answer>
}

// ---- Asset ----

export interface AssetApi {
  saveImage(file: File): Promise<Asset>
  getObjectUrl(assetId: Id): Promise<string>
  revokeObjectUrl(url: string): void
}

// ---- Demo ----

export interface DemoApi {
  bootstrap(): Promise<void>
  reset(): Promise<void>
  listScenarios(): Promise<DemoScenarioSummary[]>
  revealFutureReplies(questionId: Id): Promise<Answer[]>
}

// ---- 聚合服务 ----

export interface AppServices {
  location?: { list(): Promise<import('./types').LocationRef[]> }
  session: SessionApi
  question: QuestionApi
  trip: TripApi
  match: MatchApi
  claim: ClaimApi
  answer: AnswerApi
  asset: AssetApi
  demo: DemoApi
}