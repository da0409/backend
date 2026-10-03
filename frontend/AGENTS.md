# AGENTS.md

| 文档状态 | 生效中 |
| --- | --- |
| 负责人 | 前端成员 A、前端成员 B |
| 最后更新 | 2026-09-24 |

本文件规定编码 AI 在本仓库中的工作方式。它不是产品需求文档。

## 语言

- 始终使用中文与用户和队友沟通。
- 代码标识符、接口字段和提交信息使用清晰、稳定的英文。

## 开始任务前必须阅读

1. `AGENTS.md`。
2. `README.md`。
3. `TASKS.md` 中分配给自己的单个任务。
4. 该任务引用的 `docs/PRODUCT.md`、`docs/TECHNICAL.md`、`docs/API.md` 章节。
5. 与任务相关的现有代码、配置和测试。

开始修改前，先复述任务目标、范围、不包含内容和验收标准。一次只领取一个明确任务。

## 当前范围

当前实现 Vue 3 + TypeScript 前端，通过 REST 接入同仓库 Java/MySQL 后端；保留 Mock 模式。

当前不实现：

- AI 分析或 AI 回信；

- 携程订单或用户行程接口；
- 手机定位或轨迹采集；
- 地图搜索和地理编码；
- 视频、录音、聊天、支付、积分与排行榜；
- 微信小程序和原生 App。

不能为了“预留未来能力”擅自实现上述功能。

## 架构约束

- 页面和业务组件只能调用 Store、composable 或 `services/contracts` 暴露的接口。
- 页面不得直接导入 Mock fixture、访问 IndexedDB 或拼接后端 URL。
- Mock 和真实 REST 实现必须通过同一份前端服务契约。
- Question、Trip、Claim 和 Answer 只保存 `assetId`，不保存 Base64 或临时 `blob:` URL。
- 业务日期使用 `YYYY-MM-DD`；事件时间使用带时区的 ISO 8601。
- 产品规则以 `docs/PRODUCT.md` 为准，数据契约以 `docs/API.md` 为准，实现约束以 `docs/TECHNICAL.md` 为准。

## Git 与修改范围

- 按用户要求在当前分支继续改动。
- 每次改动更新测试并在验证通过后创建本地 commit。
- 一个分支只完成一个清晰任务，避免夹带无关格式化或重构。
- 不覆盖队友的未提交修改；遇到重叠修改时先报告。
- GitHub 操作只向用户提供命令，不自行推送或创建 PR。
- 不对共享分支强制推送。

## 验证要求

前端工程初始化后，每个功能任务至少执行：

```text
npm run type-check
npm run build
```

同时按照 `TASKS.md` 中该任务的验收项进行手动检查。无法运行某项验证时，必须说明原因和未验证范围，不能写成“已通过”。

## 文档维护

- 产品行为变化：先更新 `docs/PRODUCT.md`。
- 类型或接口变化：先更新 `docs/API.md`。
- 技术方案变化：更新 `docs/TECHNICAL.md` 和 `docs/DECISIONS.md`。
- 任务开始、阻塞或完成：更新 `TASKS.md`。
- 达到阶段检查点、准备交接或上下文显著膨胀：更新 `HANDOFF.md`。
- 不在任何文档、fixture 或前端代码中写入密码、Token、数据库账号或个人隐私数据。

## 冲突处理顺序

出现冲突时按以下优先级处理：

1. 用户最新且明确的指令；
2. `TASKS.md` 当前任务的范围和验收；
3. `docs/PRODUCT.md` 与 `docs/API.md`；
4. `docs/TECHNICAL.md`；
5. `docs/DECISIONS.md`；
6. `HANDOFF.md` 和归档参考资料。

发现两个生效文档互相矛盾时停止相关实现，指出冲突并请求确认；不要自行选择对自己更方便的一份。
