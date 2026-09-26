# 当前任务

## BE-JAVA-01 分层后端闭环

- 状态：已完成
- 分支：codex/java-cpp-layered-mvp
- 范围：保留实体与表结构，完成 Java Controller/Service/Mapper、MySQL 迁移、登录与权限、胶囊、媒体、任务、回信、POI 时间线；C++ 距离库经 JNI 接入。
- 不包含：Python、前端页面、AI 实现、公网部署、未经确认的讨论稿业务变更。
- 验收：Maven 构建、Java 单元与真实 MySQL 集成测试、C++ CTest、分层依赖检查、真实 HTTP 闭环和持久化；完成 commit。

验收记录（2026-09-26）：18 项 Java 测试、C++ CTest、Maven verify、真实 HTTP 闭环和重启持久化通过。Java 25 已安装，Windows 可访问 8081 健康接口。详见 HANDOFF.md。
