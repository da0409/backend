# 后来呢 Java 与 C++ 后端

沿用现有 Spring Boot 4.1.1、Java 25、MyBatis-Plus、八个 POJO 与 MySQL 表设计，完成 Controller → Service → Mapper 分层。C++ 通过 JNI 执行推荐、签到的距离计算；不使用 Python。

## 开始使用

当前工作目录 /home/tinyblack/backend。Java 25 已安装配置，后台服务 timecapsule-java 正在本机 8081 端口运行。
健康接口：http://127.0.0.1:8081/v1/health 。8080 属于旧项目，不用于验收本工程。

```bash
cd /home/tinyblack/backend
java -version
bash scripts/test.sh
java scripts/Smoke.java
```

最后一条命令会新增明确标注的比赛模拟数据，验证真实 HTTP 完整流程。
新环境需要先按 [运行指南](docs/RUNNING.md) 配置 JDK、MySQL、CMake、g++、ffmpeg 及本地凭据。

## 架构

- controller/：HTTP、请求校验、响应转换，只依赖 Service。
- service/：权限、业务规则、数据库事务。
- mapper/：MyBatis-Plus BaseMapper 与参数化行锁查询。
- pojo/entity/：保留现有实体，只补必要持久字段和映射。
- pojo/dto/：独立请求模型，避免客户端写入实体所有权和状态字段。
- native/：C++17 Haversine 距离库与 CTest，通过 nativegeo/ 的 JNI 调用。
- db/migration/：Flyway 版本化迁移，运行时不使用原始清表脚本。
- scripts/：Shell 环境配置和启动、纯 Java 实时验收工具。

## 已实现与验证

登录、会话、媒体上传、胶囊管理、日期与目的地推荐、领取、300 米签到、回信及地点时间线。
18 项 Java 测试、C++ CTest、Maven verify、真实服务闭环和重启持久化已通过。
测试连接独立 MySQL 库，未使用 H2/SQLite 替代。

正式业务契约以《接口文档(1).md》为准；讨论稿仍待团队确认，不自动变成新需求。
AI、前端接入、公网部署、取消领取、满意标记不计入本次已实现功能。
补充字段及边界见 [实现约定](docs/IMPLEMENTATION.md)，操作方法见 [运行指南](docs/RUNNING.md)。
