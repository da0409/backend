# 工作区规则

- 使用中文沟通；代码标识符及 commit 信息用英文。
- 用户指定的主工作区为 /home/tinyblack/backend，frontend/ 是前端，backend/ 是后端。不要在旧 hackathon 副本继续改动。
- 开始任务前阅读根 README.md、TASKS.md，以及对应模块的规则、文档和相关代码。
- 按用户明确要求在当前分支继续工作，不自动创建分支；每次改动更新相关测试，验证通过后创建可回滚的本地 commit。
- GitHub 操作只提供命令，不自行推送或发起 PR。
- 前端保留 Store/composable/services 契约，REST 与 Mock 分离；后端保留 Controller → Service → Mapper，使用 Java 25、MySQL，不引入 Python 或 C++。
- 当前范围包含已授权的真实前后端联调和云端行程，覆盖前端历史文档中“仅 Mock”的阶段限制。
- 不覆盖他人改动，不提交 .local、.env 凭据、上传媒体、node_modules 或构建产物。
- 前端改动执行类型检查、构建及相关测试；后端改动执行 backend/scripts/test.sh（独立测试库）。目录结构变动额外执行 scripts/test-layout.sh。
- 更新相关文档及 TASKS.md/HANDOFF.md，明确未验证项。
