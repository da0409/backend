// src/services/contracts/types.ts
// 依据 docs/API.md 第 1–3、6 节定义共享类型。
// 禁止在此文件里写任何运行时逻辑。

export type Id = string
/** YYYY-MM-DD，按日历日期比较 */
export type LocalDate = string
/** 带时区的 ISO 8601 */
export type Instant = string

export interface User {
  id: Id
  nickname: string
  avatarAssetId?: Id
  isDemo: boolean
  createdAt: Instant
}

export interface LocationRef {
  cityCode: string
  cityName: string
  poiId: string
  poiName: string
  latitude?: number
  longitude?: number
}

export type AssetSource = 'preset' | 'user'

export interface Asset {
  id: Id
  mimeType: string
  width: number
  height: number
  sizeBytes: number
  source: AssetSource
  createdAt: Instant
}

export interface DateWindow {
  startDate: LocalDate
  endDate: LocalDate
}

export interface Question {
  id: Id
  authorId: Id
  title: string
  description: string
  referenceAssetId: Id
  location: LocationRef
  answerWindow: DateWindow
  shootingGuide?: string
  demoScenarioId?: Id
  curationOrder?: number
  createdAt: Instant
}

export type QuestionDisplayStatus =
  | 'no_answers'
  | 'has_answers'
  | 'has_satisfied_answers'

export type TripSource = 'manual' | 'demo'

export interface Trip {
  id: Id
  travelerId: Id
  destination: LocationRef
  arrivalDate: LocalDate
  departureDate: LocalDate
  source: TripSource
  participatesInMatching: boolean
  createdAt: Instant
}

export type ClaimStatus = 'active' | 'completed' | 'cancelled' | 'expired'

export interface Claim {
  id: Id
  questionId: Id
  travelerId: Id
  status: ClaimStatus
  claimedAt: Instant
  updatedAt: Instant
}

export interface Answer {
  id: Id
  questionId: Id
  claimId: Id
  authorId: Id
  photoAssetId: Id
  text: string
  onSiteDeclaration: boolean
  isSatisfiedByAuthor: boolean
  satisfiedAt?: Instant
  isSimulated: boolean
  submittedAt: Instant
}

// ---- 输入类型 ----

export interface CreateQuestionInput {
  title: string
  description: string
  referenceAssetId: Id
  location: LocationRef
  answerWindow: DateWindow
  shootingGuide?: string
  demoScenarioId?: Id
}

export interface CreateTripInput {
  destination: LocationRef
  arrivalDate: LocalDate
  departureDate: LocalDate
  participatesInMatching: boolean
}

export interface CreateAnswerInput {
  photoAssetId: Id
  text: string
  onSiteDeclaration: boolean
}

export type AnswerSort = 'oldest' | 'newest'

// ---- 视图类型 ----

export interface QuestionSummary {
  question: Question
  author: User
  referenceAsset: Asset
  displayStatus: QuestionDisplayStatus
  answerCount: number
  satisfiedAnswerCount: number
  activeClaimCount: number
  distanceMeters?: number
}

export interface QuestionDetail extends QuestionSummary {
  answers: Array<Answer & { author: User; photoAsset: Asset }>
  currentUserClaim?: Claim
  canClaim: boolean
  canManageSatisfaction: boolean
}

export interface DemoScenarioSummary {
  id: Id
  title: string
  cityName: string
  poiName: string
  /** 时间窗模板，用于生成动态按钮文案 */
  windowHint: string
  /** 创建页默认值；地点和参照照片必须保持不变 */
  template: Omit<CreateQuestionInput, 'demoScenarioId'>
}

// ---- 错误类型（依据 docs/API.md 第 6 节）----

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'UNSUPPORTED_IMAGE'
  | 'IMAGE_TOO_LARGE'
  | 'STORAGE_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR'

export interface ApiError {
  code: ApiErrorCode
  message: string
  field?: string
  retryable: boolean
}
