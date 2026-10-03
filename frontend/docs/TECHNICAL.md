# 前端技术设计

| 文档状态 | 生效中 |
| --- | --- |
| 负责人 | 前端成员 B |
| 最后更新 | 2026-09-27 |
| 本文负责 | 技术栈、架构、路由、数据流、组件、匹配和质量约束 |
| 本文不负责 | 产品价值、完整字段契约和后端数据库结构 |

## 1. 技术基线

- Vue 3，使用 Composition API 和 `<script setup lang="ts">`。
- TypeScript，开启严格类型检查。
- Vite，负责开发服务器和生产构建。
- Vue Router，负责单页应用路由。
- Pinia，保存跨页面会话状态。
- Vant，提供表单、上传、日期选择、弹层和底部导航等基础交互。
- IndexedDB，保存第一阶段的结构化数据和图片 Blob。

第一阶段不引入 SSR、Nuxt、微前端、GraphQL、Tailwind、复杂领域框架或独立 Mock HTTP 服务器。

## 2. 源码目录

前端初始化后使用以下结构：

```text
src/
├─ app/                 # App、初始化和全局布局
├─ router/              # 路由表和导航守卫
├─ pages/               # 路由级页面
├─ components/
│  ├─ common/           # 通用展示与状态组件
│  ├─ question/         # 问题卡片和问题表单
│  ├─ trip/             # 行程卡片和行程表单
│  └─ timeline/         # 回答卡片和时间线
├─ stores/              # 会话、当前行程、筛选和草稿
├─ services/
│  ├─ contracts/        # 页面依赖的服务接口
│  ├─ mock/             # 第一阶段实现
│  └─ rest/             # 后续真实 HTTP 实现
├─ db/                  # IndexedDB 初始化、升级和表访问
├─ mocks/
│  ├─ fixtures/         # 固定初始数据
│  └─ scenarios/        # 预制故事与未来回答
├─ types/               # 共享业务类型
├─ utils/               # 日期、距离、图片处理
├─ styles/              # 主题变量和全局样式
└─ assets/              # 内置图片和静态资源
```

不为每个功能建立多层 Repository、UseCase 或 Domain 目录。只有出现真实重复时才增加抽象。

## 3. 数据流和职责边界

```text
Page / business component
            ↓
     Pinia / composable
            ↓
 services/contracts
       ↙          ↘
Mock Adapter     REST Adapter
      ↓               ↓
 IndexedDB        后端 REST API
```

- Page：组织页面、路由参数和交互，不访问存储实现。
- Business component：接收 props、触发业务事件，不持有全局实体集合。
- Pinia：只保存跨页面 UI 状态，不作为实体数据库。
- Service contract：页面和 Store 唯一允许调用的数据入口。
- Mock Adapter：模拟固定短延迟，执行业务规则并读写 IndexedDB。
- REST Adapter：以后把相同方法映射到真实 HTTP，不改变页面调用方式。

## 4. Pinia 状态边界

Pinia 只保存：

- 当前演示用户；
- 当前选中的行程；
- 发现区模式和筛选；
- 未提交的表单草稿；
- 全局初始化状态。

Question、Trip、Claim、Answer 和 Asset 的权威数据位于 API Adapter 背后的持久层。不得把全部实体复制进多个 Store 并分别持久化。

## 5. 路由

| 路由 | 页面 | 说明 |
| --- | --- | --- |
| `/` | 默认入口 | 重定向至 `/discover`，不渲染独立首页 |
| `/discover` | 发现 | 全国发现流与匹配模式共用 |
| `/questions/new` | 创建问题 | 表单和预制故事入口 |
| `/questions/new/preview` | 发布预览 | 依赖未提交草稿；直接访问时返回创建页 |
| `/questions/:id` | 问题详情 | 原问题、领取动作、时间线和满意回答 |
| `/trips` | 行程 | 行程列表、当前行程和模拟行程入口 |
| `/trips/new` | 添加行程 | 手动行程表单 |
| `/questions/:id/answer` | 提交回信 | 仅允许当前用户存在有效领取时进入 |
| `/me` | 我的 | 问题、行程、任务、回答和演示重置 |

不存在独立的匹配列表、任务详情、提交成功、身份切换和模拟行程页面。对应能力通过现有页面的模式、弹层或成功状态实现。

## 6. 匹配算法

### 入选条件

使用稳定的 `cityCode`，不比较展示名称。日期区间按闭区间判断：

Mock 对手填地点在创建时统一为稳定代码；匹配旧版手填记录时先按同一规则规范化其代码，再执行以下比较。规范化仅使用已知预置地点名称和确定性手填键，不查询地图服务。

```text
question.location.cityCode === trip.destination.cityCode
且
question.answerWindow.startDate <= trip.departureDate
且
question.answerWindow.endDate >= trip.arrivalDate
```

### 排序

依次比较：

1. `poiId` 相同的问题优先；
2. 双方都有坐标时，按 Haversine 距离升序；
3. 问题时间窗中心与行程日期区间中心更接近者优先；
4. 回答数量少者优先；
5. 最后按问题 ID 升序，确保结果稳定。

如果任一方缺少坐标，则该问题没有可比较距离；保留其资格，在具有有效距离的问题之后继续参与后续排序。全国发现流使用 fixture 中的固定 `curationOrder`，不调用随机数。

## 7. 本地数据和初始化

- 应用启动时调用 `demoApi.bootstrap()`。
- `bootstrap()` 失败时只显示初始化错误和重试入口，不挂载正常路由页面；重试重新执行初始化，不自动清空本地数据。
- 首次启动或数据版本变化时写入固定 fixture。
- 预置图片变更时递增 fixture 数据版本；升级仅替换固定 ID 的预置 Asset 元数据与 Blob，并在同一事务写入版本号，保留用户创建的实体和图片。
- fixture 必须使用确定 ID，避免重置后链接失效。
- 用户修改写入 IndexedDB，刷新页面后继续存在。
- 写入操作在 IndexedDB 事务完成后才返回成功；提交回答与完成领取使用同一事务，模拟未来回信的两条回答与领取也使用同一事务。
- `demoApi.reset()` 清除当前数据并重新写入固定 fixture。
- Mock 请求使用固定短延迟；第一阶段不随机制造网络或上传失败。
- 数据库升级必须通过版本化迁移处理，不能依赖用户手动清缓存。

## 8. 图片处理

- 组件向 `assetApi.saveImage(file)` 提交 `File`，不直接写 IndexedDB。
- 支持浏览器可以解码预览的图片类型；至少覆盖 JPG、JPEG、PNG 和 WebP。
- 用户图片在保存前尝试压缩：长边不超过 1600px，目标大小不超过 1MB。
- 无法解码、类型不支持或超过允许上限时返回字段级错误，保留其他表单输入。
- IndexedDB 保存 Blob；Question 和 Answer 只保存 `assetId`。
- 展示地址由 `assetApi.getObjectUrl(assetId)` 在运行时生成，并在组件销毁或替换时释放。
- 预制图片仍通过 Asset 记录访问，不能让业务组件依赖特殊静态路径。
- 六张预置场景 PNG 作为打包资源，在初始化或 fixture 升级时读取并写入 IndexedDB；业务页面仍只通过 Asset API 获取和释放 object URL。当前用户自有的示例问题继续使用标明演示性质的内置占位图。

## 9. 日期和演示时间

- 回答时间窗和行程日期统一使用 `YYYY-MM-DD`，按日历日期比较，不转 UTC。
- `createdAt`、`claimedAt`、`submittedAt` 等事件时间使用带时区的 ISO 8601。
- UI 按浏览器本地时区格式化事件时间。
- 未来回信日期根据用户选择的回答时间窗计算，并保证落在闭区间内。
- 两条模拟回答取时间窗中两个不同且有序的日期；时间窗不足两天时允许同一天使用不同事件时间。
- 未来回信按钮优先显示自然相对时间；无法稳定概括时显示具体年月。

## 10. 组件边界

通用组件：

```text
AppShell
BottomNav
PageHeader
DemoBadge
EmptyState
LoadingState
ErrorState
ImageUploader
```

业务组件：

```text
QuestionCard
QuestionForm
LocationPicker
TimeWindowPicker
QuestionStatusBadge
TripCard
TripForm
MatchModeBar
AnswerCard
AnswerComposer
AnswerTimeline
PhotoComparison
ClaimActionBar
FutureReplyPreview
```

只有重复使用、包含独立业务规则或足够复杂时才新增组件。不得仅为一个标题或 Vant Button 建立包装组件。

## 11. 视觉基线

首批以默认入口的发现页采用以下变量验证视觉方向：

```text
background: #FFFFFF
text:       #111827
primary:    #2563EB
secondary:  #64748B
surface:    #FFFFFF
surfaceSoft: #F3F7FF
border:     #E2E8F0
```

- 照片是主要视觉，不使用大面积渐变和玻璃拟态。
- 使用轻边框、轻阴影和中等圆角。
- 发现页按 2026-09-25 确认的参考图采用无外框的白底图文布局：手机照片左右约 3px、4:3 比例、14px 圆角；文字左右约 20px，问题标题 28px，地点图标与 15px 地点文字使用主题蓝色 #2563EB，日期保持黑色，标签 14px、日期 15px 加粗等宽。期待回信使用浅蓝圆角状态卡、浅蓝日历图标底块与竖分隔线；不足 360px 时日期换至下行并改为横分隔线，静态说明合并为右对齐的“静态样例 · 不可领取”。桌面照片高度上限 420px，内容最大宽度仍为 760px。
- 底部导航为白底、浅色顶边线，保留四项路由、至少 44px 点击区域与安全区。网页不绘制参考图中的手机系统状态栏或底部系统手势条。
- 按 2026-09-24 用户反馈改为白蓝基线；应用不展示共享品牌页眉，根地址直接进入发现页，发现页不提供返回首页按钮。用户于 2026-09-25 确认首版验收通过，ADR-016 已确定。
- 邮戳、日期和路线元素只作少量点缀。
- 使用系统字体，不依赖远程字体加载。
- Vant 只提供交互能力，核心卡片、时间线和照片对照使用自定义样式。
- 视觉基线在发现页通过人工检查后，才扩展到全站。

## 12. 质量检查

前端初始化后必须提供并通过：

```text
npm run type-check
npm run build
```

最低人工检查：

- 375px 左右手机视口完成主流程；
- 电脑浏览器能够操作；
- 刷新后数据不丢失；
- 浏览器控制台没有阻塞错误；
- 重置后得到相同初始数据；
- 页面源码没有直接导入 `mocks/` 或 `db/`。

自动化测试优先覆盖纯函数：日期重叠、匹配排序、状态推导和未来回答日期生成。第一阶段不追求全量端到端测试。


## INT-REST-01 真实后端联调（2026-10-02）

用户授权接入同级 backend Java/MySQL 项目，覆盖此前仅 Mock 的限制。保留两个独立仓库；按用户直接指令在当前分支继续，每仓库独立提交，GitHub 操作仅提供命令。

REST 模式使用真实登录、问题、媒体、推荐、领取、坐标签到与回信；Mock 模式保留独立演示数据。REST 不自动制造身份、地点坐标或未来回信。不支持的取消领取、满意标记和演示重置入口隐藏；行程当前仅按用户保存在本机，明确标注，不宣称已同步 MySQL。签到坐标手动输入用于本地联调，不证明真实到场。


### FIX-PUBLISH-01（2026-10-03）
创建页使用错误摘要统一展示并聚焦校验失败原因，LocationPicker 将 errors 传递给 REST 实现。真实模式在进入预览前检查后端已有字段约束，服务层校验继续保留；不改变后端业务规则。


## BE-TRIP-01 云端行程（2026-10-03）

状态：已完成。用户授权将 REST 行程及当前选择存入 MySQL，覆盖此前本机存储限制。提供需登录的 /v1/trips 创建、分页列表、详情、更新、删除、当前选择和匹配接口；所有操作仅限本人。目的地引用已有 POI，日期有效且结束日期不早于今天。未授权匹配的行程可保存，不可设为当前行程或获取推荐。当前行程按账号跨会话共享，切换事务化，每人最多一条；取消授权或删除会清除选择。REST 前端不再读写本地行程。旧浏览器行程保留但不自动上传，用户可重新创建；Mock 仍独立使用 IndexedDB。无取消领取、满意标记等范围扩展。


## REPO-01 统一仓库（2026-10-03）

用户要求统一在原后端 Git 仓库开发。前端现在位于 /home/tinyblack/backend/frontend，后端位于 /home/tinyblack/backend/backend，共享根 .git。覆盖历史独立仓库路径说明；源码及服务契约保持不变，前端 /v1 代理继续连接 8081。原 hackathon 是保留副本，不再作为开发源。配置、媒体及依赖继续忽略。
