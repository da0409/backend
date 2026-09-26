# 当前任务

## BE-JAVA-01 分层后端闭环（历史记录，原生实现已由 BE-JAVA-02 替换）

- 状态：已完成
- 分支：codex/java-cpp-layered-mvp
- 范围：保留实体与表结构，完成 Java Controller/Service/Mapper、MySQL 迁移、登录与权限、胶囊、媒体、任务、回信、POI 时间线；C++ 距离库经 JNI 接入。
- 不包含：Python、前端页面、AI 实现、公网部署、未经确认的讨论稿业务变更。
- 验收：Maven 构建、Java 单元与真实 MySQL 集成测试、C++ CTest、分层依赖检查、真实 HTTP 闭环和持久化；完成 commit。

验收记录（2026-09-26）：18 项 Java 测试、C++ CTest、Maven verify、真实 HTTP 闭环和重启持久化通过。Java 25 已安装，Windows 可访问 8081 健康接口。详见 HANDOFF.md。

## BE-JAVA-02 纯 Java 距离计算

- 状态：已完成
- 分支：codex/pure-java-backend
- 范围：替换全部 C++/JNI 为 Java，移除原生构建与启动依赖，更新测试和运行文档。
- 不包含：业务规则、数据库和接口路径变化；GitHub 操作。
- 验收：干净构建与全部 Java/MySQL 测试、300 米/日期线/非法坐标边界、真实 HTTP 闭环；本地 commit。

验收记录（2026-09-26）：24 项测试、Maven verify、无原生构建产物检查及纯 Java 实际接口闭环通过。健康接口 runtime=java25。GitHub 操作由用户执行。
