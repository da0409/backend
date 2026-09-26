# 本地运行与测试

## 工作区与 Java 25

工程位于 /home/tinyblack/backend，远程为 da0409/backend。所有业务代码为 Java 与 C++；旧项目 /home/tinyblack/hackathon 不参与构建。

当前 WSL 已安装 OpenJDK 25.0.4.1。系统默认 java、javac 指向 Java 25，登录终端通过 /etc/profile.d/java25.sh 设置 JAVA_HOME=/usr/lib/jvm/java-25-openjdk-amd64。Maven 使用仓库提供的 Wrapper 3.9.16，不必另装 Maven。

新终端可运行：

```bash
java -version
javac -version
cd /home/tinyblack/backend
bash mvnw -v
```

在 Windows IDE 中请选择 WSL 的该 JDK；这是 Linux JDK，不能当作 Windows 本机 Java 可执行文件使用。

## 首次配置

以下命令在 Ubuntu/WSL 中执行。当前电脑已完成安装和数据库配置，无需重复创建：

```bash
sudo apt-get update
sudo apt-get install -y openjdk-25-jdk-headless cmake g++ mysql-server ffmpeg
cd /home/tinyblack/backend
sudo systemctl start mysql
sudo bash scripts/provision-local.sh "$(id -u):$(id -g)"
bash scripts/test.sh
sudo bash scripts/install-service.sh "$(id -un)"
```

数据库配置随机生成并只保存在 .local/dev.env 与 .local/test.env，Git 忽略、权限受限，不写入源码。
已有配置时安装脚本拒绝覆盖。开发库 capsule_java，测试库 capsule_java_test，与旧服务数据库分离。
测试会清空测试库业务表，入口和测试类均检查数据库名。

## 日常使用

```bash
cd /home/tinyblack/backend

# 完整构建、Java 测试、C++ 编译和 CTest
bash scripts/test.sh

# 手动启动（已开启后台服务时先停止它，避免端口冲突）
sudo systemctl stop timecapsule-java
bash scripts/start.sh

# 后台服务管理
sudo systemctl start timecapsule-java
sudo systemctl restart timecapsule-java
systemctl status timecapsule-java
journalctl -u timecapsule-java -n 50 --no-pager
```

健康检查：http://localhost:8081/v1/health 。默认仅监听本机。
这是 Java 服务的 8081 端口；8080 是旧 Python 服务，不能用来验收新实现。
本工程没有引入 Swagger 页面，可通过 Postman、curl 或自动化测试调用接口。
C++ 共享库生成在 target/native/libtimecapsule_geo.so，运行 jar 时需保持该目录，或用 -Dgeo.library 指定绝对路径。
jar 启动时执行 Flyway 迁移，不执行包含 DROP TABLE 的原始 schema.sql。

## 手工验收顺序

1. POST /v1/auth/register，提供 username、password、nickname；保存返回 token。
2. 之后携带 Authorization: Bearer token。上传素材到 POST /v1/capsules/media（multipart file），获取 mediaId。
3. POST /v1/capsules，提交正式接口文档字段，回答日期选今天，有素材时明确 blurFace=false。
4. 用另一账号登录。GET /v1/tasks/recommend 提交 destinationPoiId、travelBeginDate、travelEndDate。
5. 用推荐中的 taskId 调用 POST /v1/tasks/{taskId}/accept，获取 assignmentId。
6. POST /v1/tasks/{assignmentId}/checkin 提交 lng、lat；再 POST /v1/tasks/{assignmentId}/reply 提交 content 或 mediaList。
7. GET /v1/capsules/{id}、/v1/replies?capsuleId={id}、/v1/pois/{id}/timeline 查看持久化结果。
8. 尝试越权、重复领取/提交、超出 300 米、错误日期、无效图片，确认失败响应。
9. 重启服务后重复查询，确认数据仍然存在。

时间字段、ID 与 AI 边界见 IMPLEMENTATION.md。测试使用实际 HTTP 端口和 MySQL，不回退内存数据库。

## 运行限制

- AI 未实现，返回 501，不宣称已做人脸处理；客户端上报坐标不证明真实到场。
- 待确认讨论稿中的取消领取、满意标记等不作为本次已实现功能。
- 媒体保存在 var/media；音视频用 ffprobe 验证，图片转为 PNG 并去除元数据，未引用素材暂不自动清理。
- 列表与时间线采用小数据量聚合，生产扩容需要进一步 SQL 分页与索引优化。
- 未对公网开放，未增加生产账号验证、限流、对象存储等部署能力。

纯 Java 实时验收：`java scripts/Smoke.java`；重启后验证：`java scripts/Smoke.java verify`。模拟账号随机生成并仅保存于忽略的 .local/demo.properties。

启动脚本设置 -Djava.net.preferIPv4Stack=true，以兼容 Windows/WSL 的本机端口转发；Windows 验证地址为 http://127.0.0.1:8081/v1/health 。
