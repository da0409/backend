# 前端服务与 REST API 契约

| 文档状态 | 第一版生效 |
| --- | --- |
| 负责人 | 前端成员 B |
| 最后更新 | 2026-09-24 |
| 本文负责 | 共享类型、服务操作、错误格式和未来 REST 映射 |
| 本文不负责 | 数据库表结构、ORM 模型和云服务配置 |

前端先按本契约实现 Mock Adapter。后端接入时必须保持前端服务接口不变；若后端返回结构不同，由 REST Adapter 转换。

## 1. 通用约定

```ts
type Id = string
type LocalDate = string // YYYY-MM-DD
type Instant = string   // 带时区的 ISO 8601
```

- 所有 ID 都是不透明字符串，前端不得解析 ID 含义。
- 所有列表在没有数据时返回空数组，不返回 `null`。
- 可选字段缺失时使用 `undefined`，持久化或传输时可以省略。
- 前端服务成功时返回 `Promise<T>`，失败时抛出结构化 `ApiError`。
- 第一阶段当前用户由演示会话提供；真实身份认证不在本契约范围内。

## 2. 核心类型

```ts
interface User {
  id: Id
  nickname: string
  avatarAssetId?: Id
  isDemo: boolean
  createdAt: Instant
}

interface LocationRef {
  cityCode: string
  cityName: string
  poiId: string
  poiName: string
  latitude?: number
  longitude?: number
}

type AssetSource = 'preset' | 'user'

interface Asset {
  id: Id
  mimeType: string
  width: number
  height: number
  sizeBytes: number
  source: AssetSource
  createdAt: Instant
}

interface DateWindow {
  startDate: LocalDate
  endDate: LocalDate
}

interface Question {
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

type QuestionDisplayStatus =
  | 'no_answers'
  | 'has_answers'
  | 'has_satisfied_answers'

type TripSource = 'manual' | 'demo'

interface Trip {
  id: Id
  travelerId: Id
  destination: LocationRef
  arrivalDate: LocalDate
  departureDate: LocalDate
  source: TripSource
  participatesInMatching: boolean
  createdAt: Instant
}

type ClaimStatus = 'active' | 'completed' | 'cancelled'

interface Claim {
  id: Id
  questionId: Id
  travelerId: Id
  status: ClaimStatus
  claimedAt: Instant
  updatedAt: Instant
}

interface Answer {
  id: Id
  questionId: Id
  claimId: Id
  authorId: Id
  photoAssetId: Id
  text: string
  onSiteDeclaration: true
  isSatisfiedByAuthor: boolean
  satisfiedAt?: Instant
  isSimulated: boolean
  submittedAt: Instant
}
```

`QuestionDisplayStatus` 是读取时根据 Answer 推导的展示字段，不写回 Question。

## 3. 输入与视图类型

```ts
interface CreateQuestionInput {
  title: string
  description: string
  referenceAssetId: Id
  location: LocationRef
  answerWindow: DateWindow
  shootingGuide?: string
  demoScenarioId?: Id
}

interface CreateTripInput {
  destination: LocationRef
  arrivalDate: LocalDate
  departureDate: LocalDate
  participatesInMatching: boolean
}

interface CreateAnswerInput {
  photoAssetId: Id
  text: string
  onSiteDeclaration: boolean
}

type AnswerSort = 'oldest' | 'newest'

interface QuestionSummary {
  question: Question
  author: User
  referenceAsset: Asset
  displayStatus: QuestionDisplayStatus
  answerCount: number
  satisfiedAnswerCount: number
  activeClaimCount: number
  distanceMeters?: number
}

interface QuestionDetail extends QuestionSummary {
  answers: Array<Answer & { author: User; photoAsset: Asset }>
  currentUserClaim?: Claim
  canClaim: boolean
  canManageSatisfaction: boolean
}

interface DemoScenarioSummary {
  id: Id
  title: string
  cityName: string
  poiName: string
  windowHint: string
  template: Omit<CreateQuestionInput, 'demoScenarioId'>
}
```

View 类型由 Adapter 聚合，避免页面自行拼接用户、图片和计数。
预制场景的 `template` 通过 `listScenarios()` 提供创建页所需的完整默认值；其中 `location` 和 `referenceAssetId` 在发布时锁定。图片展示仍使用 Asset API。

## 4. 前端服务接口

### Session API

```ts
interface SessionApi {
  getCurrentUser(): Promise<User>
}
```

### Question API

```ts
interface QuestionApi {
  listDiscover(): Promise<QuestionSummary[]>
  listMine(): Promise<QuestionSummary[]>
  getById(id: Id, sort?: AnswerSort): Promise<QuestionDetail>
  create(input: CreateQuestionInput): Promise<Question>
}
```

### Trip API

```ts
interface TripApi {
  listMine(): Promise<Trip[]>
  create(input: CreateTripInput): Promise<Trip>
  importDemoTrip(scenarioId: Id): Promise<Trip>
  setActive(tripId: Id): Promise<void>
  getActive(): Promise<Trip | undefined>
}
```

### Match API

```ts
interface MatchApi {
  listForTrip(tripId: Id): Promise<QuestionSummary[]>
}
```

### Claim API

```ts
interface ClaimApi {
  listMine(): Promise<Claim[]>
  create(questionId: Id): Promise<Claim>
  cancel(claimId: Id): Promise<Claim>
}
```

### Answer API

```ts
interface AnswerApi {
  listMine(): Promise<Answer[]>
  create(claimId: Id, input: CreateAnswerInput): Promise<Answer>
  setSatisfied(answerId: Id, satisfied: boolean): Promise<Answer>
}
```

### Asset API

```ts
interface AssetApi {
  saveImage(file: File): Promise<Asset>
  getObjectUrl(assetId: Id): Promise<string>
  revokeObjectUrl(url: string): void
}
```

### Demo API

```ts
interface DemoApi {
  bootstrap(): Promise<void>
  reset(): Promise<void>
  listScenarios(): Promise<DemoScenarioSummary[]>
  revealFutureReplies(questionId: Id): Promise<Answer[]>
}
```

`revealFutureReplies` 仅属于比赛演示能力。它只接受带已知 `demoScenarioId` 的问题，包括用户使用预制场景新发布的问题；必须幂等，重复调用返回已经创建的模拟回答，不能继续追加副本。

## 5. 校验和权限

- 标题、描述、图片、城市、POI 和回答时间窗不能为空。
- 创建问题或回答时，`referenceAssetId` / `photoAssetId` 必须对应当前已保存的 Asset 元数据与图片 Blob；缺失时返回相应字段的 `VALIDATION_ERROR`，不写入业务实体。
- 使用 `demoScenarioId` 创建问题时，该 ID 必须存在，`location` 和 `referenceAssetId` 必须与对应预制场景一致；标题、描述、回答时间窗和拍摄建议允许修改。
- 手填地点在 Mock Adapter 保存前按城市、POI 展示名规范化：与预置地点同名时复用其稳定 `cityCode` / `poiId`，未知名称生成确定性的手填代码。预制场景的锁定地点保持原值。旧版已保存的手填名称代码在匹配时使用相同规则比较；此规则不提供地图搜索或地理编码。
- 日期窗必须满足 `startDate <= endDate`；行程必须满足 `arrivalDate <= departureDate`。
- 当前用户不能领取自己发布的问题。
- 同一用户对同一问题最多存在一条 `active` Claim。
- 只有 `active` Claim 可以提交回答；提交后 Claim 变为 `completed`。
- 提交回答时，新增 Answer 与 Claim 状态变更必须一起成功或一起失败；重复提交已完成的 Claim 应返回 `CONFLICT`。
- 取消只允许作用于 `active` Claim。
- 回答图片、文字和现场声明均为必填；`onSiteDeclaration` 必须为 `true`。
- 只有 Question 的 `authorId` 对应用户可以修改其回答满意状态。
- 满意状态可以独立作用于多条回答，不修改 Question 生命周期。
- `revealFutureReplies` 生成的日期必须位于 Question 的回答时间窗内。

## 6. 错误格式

```ts
type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'UNSUPPORTED_IMAGE'
  | 'IMAGE_TOO_LARGE'
  | 'STORAGE_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR'

interface ApiError {
  code: ApiErrorCode
  message: string
  field?: string
  retryable: boolean
}
```

- 表单错误提供 `field`，页面在对应字段附近展示。
- 失败不能清空尚未提交的表单草稿。
- Mock Adapter 第一阶段不随机制造失败，但仍需对真实校验和存储异常返回统一错误。

## 7. 未来 REST 映射

REST Adapter 预计映射以下接口；后端实现前可调整 URL，但不能改变前端服务语义。

| 操作 | 方法与路径 |
| --- | --- |
| 发现问题 | `GET /api/questions` |
| 我的问题 | `GET /api/me/questions` |
| 问题详情 | `GET /api/questions/{id}` |
| 创建问题 | `POST /api/questions` |
| 我的行程 | `GET /api/me/trips` |
| 创建行程 | `POST /api/trips` |
| 行程匹配 | `GET /api/trips/{id}/matches` |
| 领取问题 | `POST /api/questions/{id}/claims` |
| 取消领取 | `DELETE /api/claims/{id}` |
| 我的领取 | `GET /api/me/claims` |
| 提交回答 | `POST /api/claims/{id}/answers` |
| 我的回答 | `GET /api/me/answers` |
| 标记满意 | `PATCH /api/answers/{id}/satisfaction` |
| 上传图片 | `POST /api/assets`，使用 `multipart/form-data` |

JSON 成功响应统一为：

```json
{ "data": {} }
```

失败响应统一为：

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "回答结束日期不能早于开始日期",
    "field": "answerWindow.endDate",
    "retryable": false
  }
}
```

列表的 `data` 直接是数组。第一阶段数据量小，不定义分页；后端需要分页时由 REST Adapter 在不改变页面语义的前提下聚合或扩展契约。

`importDemoTrip`、`setActive`、`getActive`、`bootstrap`、`reset` 和 `revealFutureReplies` 属于本地演示控制，不要求真实业务后端提供同名接口。

## 8. 契约变更记录

| 日期 | 变更 |
| --- | --- |
| 2026-09-24 | 建立第一版前端服务契约、核心类型、错误格式和 REST 映射草案 |
| 2026-09-27 | 明确预制场景创建模板、锁定字段和新发布问题的未来回信语义 |
| 2026-09-27 | 明确创建问题与回答时的 Asset 引用完整性校验 |
| 2026-09-27 | 明确回答与领取状态必须原子提交，重复提交已完成领取返回冲突 |


## INT-REST-01 真实后端联调（2026-10-02）

用户授权接入同级 backend Java/MySQL 项目，覆盖此前仅 Mock 的限制。保留两个独立仓库；按用户直接指令在当前分支继续，每仓库独立提交，GitHub 操作仅提供命令。

REST 模式使用真实登录、问题、媒体、推荐、领取、坐标签到与回信；Mock 模式保留独立演示数据。REST 不自动制造身份、地点坐标或未来回信。不支持的取消领取、满意标记和演示重置入口隐藏；行程当前仅按用户保存在本机，明确标注，不宣称已同步 MySQL。签到坐标手动输入用于本地联调，不证明真实到场。

### INT-REST-01 实际映射与类型补充

- session 增加可选 hasSession/login/register/logout；Mock 保持固定演示用户，REST 必须显式登录。
- claim 增加可选 checkin(claimId, {longitude, latitude})；REST 的 ClaimStatus 增加 expired。已完成、过期和已领取任务不再显示重复领取按钮。
- Answer.onSiteDeclaration 使用 boolean，如旧记录没有声明，页面显示“未提供现场拍摄声明”。
- location.list() 为可选服务，REST 返回当前已发布胶囊中的地点，不查询第三方地图。
- 字段转换：question.id ↔ capsuleId，description ↔ question，referenceAssetId/photoAssetId ↔ mediaId，claim.id ↔ assignmentId。taskId 用于领取；后续签到/回信使用 assignmentId。
- 拍摄建议存储在第一张参照照片的 caption。REST 标题上限 128、问题 512、建议 255 字符。
- 事件时间由后端 Asia/Shanghai 的 yyyy-MM-dd HH:mm:ss 转成带 +08:00 的 ISO 字符串。日期不转换时区。
- 所有 JSON 响应解包 {code,msg,data}；分页聚合 {total,rows}。HTTP 错误转换为原 ApiError，401 清除登录凭据，不回退到 Mock。
- 图片必须由携带 Authorization 的 fetch 获取 Blob，再生成临时 object URL；实体只保存 mediaId。
- 行程本地 key 按后端 userId 隔离。未授权参与匹配的行程可以保存，但不能设为匹配行程。

| 前端操作 | 实际后端接口 |
| --- | --- |
| 注册/登录/当前用户/退出 | POST /v1/auth/register、POST /v1/auth/login、GET /v1/auth/me、POST /v1/auth/logout |
| 全国发现 | GET /v1/capsules/discover |
| 我的问题/发布 | GET /v1/capsules、POST /v1/capsules |
| 问题详情/回信 | GET /v1/capsules/{id}、GET /v1/replies?capsuleId={id} |
| 照片上传/读取 | POST /v1/capsules/media、GET /v1/media/{id} |
| 推荐 | GET /v1/tasks/recommend?destinationPoiId=...&travelBeginDate=...&travelEndDate=... |
| 我的领取/领取 | GET /v1/tasks、POST /v1/tasks/{taskId}/accept |
| 签到/回信 | POST /v1/tasks/{assignmentId}/checkin、POST /v1/tasks/{assignmentId}/reply |

本节优先于历史“未来 REST 映射”草案；不要求后端兼容旧的 /api/questions URL。


## BE-TRIP-01 云端行程（2026-10-03）

状态：已完成。用户授权将 REST 行程及当前选择存入 MySQL，覆盖此前本机存储限制。提供需登录的 /v1/trips 创建、分页列表、详情、更新、删除、当前选择和匹配接口；所有操作仅限本人。目的地引用已有 POI，日期有效且结束日期不早于今天。未授权匹配的行程可保存，不可设为当前行程或获取推荐。当前行程按账号跨会话共享，切换事务化，每人最多一条；取消授权或删除会清除选择。REST 前端不再读写本地行程。旧浏览器行程保留但不自动上传，用户可重新创建；Mock 仍独立使用 IndexedDB。无取消领取、满意标记等范围扩展。


### 行程 REST 路由

POST/GET `/v1/trips` 创建/分页列表；GET/PUT/DELETE `/v1/trips/{id}` 详情/完整更新/删除；GET/PUT/DELETE `/v1/trips/active` 读取/选择/清除当前行程；GET `/v1/trips/{id}/matches` 按保存的行程推荐。
创建/更新参数为 destinationPoiId、arrivalDate、departureDate、participatesInMatching；选择参数为 tripId。所有接口需 Bearer 登录，所有者从登录状态取得。响应 tripId 映射为前端 id，createTime 转换为带时区的 createdAt，source 为 manual。列表 data 为 {total,rows}，无当前选择时 data 为 null。详情对象包含 destination 和 active。前端本轮仅暴露原有契约中的创建、列表、选择、读取和匹配，未增加编辑/删除界面。
