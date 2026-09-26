# 工作交接

更新时间：2026-09-26。

## 工作区与任务

- 新仓库：/home/tinyblack/backend，origin 指向 da0409/backend。
- 分支：codex/pure-java-backend，从本地已同步 main 创建。
- BE-JAVA-01、BE-JAVA-02 已完成；旧仓库 /home/tinyblack/hackathon 未作修改。
- 当前聊天工具默认目录仍可能显示旧项目，后续命令必须明确使用新仓库路径。

## 环境

- OpenJDK 25.0.4.1，JAVA_HOME=/usr/lib/jvm/java-25-openjdk-amd64。
- /etc/profile.d/java25.sh 为登录终端设置环境；仓库 scripts/java-env.sh 供启动和测试脚本使用。
- 仓库 Maven Wrapper 3.9.16；ffmpeg 和 MySQL 可用；不再依赖原生编译工具。
- 本机后台服务 timecapsule-java，端口 8081；JVM preferIPv4Stack=true 解决 Windows/WSL 转发问题。
- 新开发库 capsule_java、测试库 capsule_java_test；不动旧项目数据库。
- 本地生成配置 .local/、媒体 var/、构建 target/ 不提交。

## 完成内容

- Controller 只依赖 Service；Service 处理权限和事务；Mapper 负责 MyBatis/MySQL 查询。
- 保留原有实体和表设计，修复派生字段映射、自增主键和 Boot 4 starter 兼容。
- Spring Boot 4.1.1 + MyBatis-Plus Boot4 starter 3.5.17。
- 原始 schema.sql 保留作参考，不执行其中 DROP TABLE；通过 Flyway V1/V2 建表及补充会话、关联约束。
- Java 完成账号、素材、胶囊、推荐、领取签到、回信和时间线；纯 Java GeoDistance 执行真实业务距离计算。
- 鉴权 token 哈希持久化，密码 BCrypt；联调配置随机生成，不进 Git。
- scripts/Smoke.java 为纯 Java 的真实 HTTP 验收工具，无 Python。

## 验证

- Maven verify：成功，Java 25 编译与可执行 jar 打包完成。
- 24 项 Java 测试全部通过：16 项真实 HTTP/MySQL 集成测试、1 项分层测试、7 项距离单元测试。
- 距离测试：通过，含 299.9/300.1 米、跨日期线、极点、对跖点、对称性和所有参数的非法坐标边界。
- 纯 Java 真实 HTTP 注册、图片上传、胶囊、推荐、领取、签到、回信、时间线：通过。
- 重启 systemd 服务后 Smoke verify：数据仍在。
- Windows 访问 127.0.0.1:8081/v1/health：成功。
- 新工程没有前端 package.json，原仓库 npm type-check/build 不适用于此独立 Java 仓库。
- 上游 Lombok/测试工具在 Java 25 有 Unsafe/动态 agent 弃用提示；不影响本次构建和测试。

## 后续限制

- AI 接口返回 501，有媒体需明确 blurFace=false；不宣称已执行人脸处理。
- 坐标由客户端上报，距离校验不证明真实到场。
- 待确认讨论稿的取消、满意标记、免签到等未擅自纳入本次业务变更。
- 分页采用小数据量内存聚合；未实现生产限流、对象存储、自动媒体回收或公网部署。
- 前端需按新仓库约定接入；没有 Swagger 页面。
- 运行、测试与服务管理见 docs/RUNNING.md。
