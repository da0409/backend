# 实现约定

## 基线与分层

保持现有 com.hackathon.backend 包和 pojo/entity 模型，Java 25、Spring Boot 4.1.1。MyBatis-Plus 升级到 Boot 4 专用 starter 3.5.17，避免 Boot 3 自动配置不兼容。依据：https://baomidou.com/en/getting-started/install/ 。

Controller 只依赖 Service，负责 HTTP 与字段校验；Service 实现业务、事务、权限并调用 Mapper；Mapper 通过 MyBatis-Plus 和参数化 SQL 访问 MySQL。不在 Controller 查询数据库。geo.GeoDistance 使用纯 Java Haversine 计算球面距离，保留 6371000 米地球半径、经纬度范围与有限值校验，并限制浮点误差。构建与运行均不依赖 JNI、CMake 或 C++ 共享库。

## 接口补充

- 健康接口 runtime 更新为 java25，路径、响应结构和业务规则不变。
- /v1 前缀，{code,msg,data}；code=1 成功，错误 code 使用 HTTP 状态。日期 YYYY-MM-DD，事件时间 Asia/Shanghai 的 yyyy-MM-dd HH:mm:ss。
- 新增 /auth/register、/auth/login、/auth/me、/auth/logout。密码哈希，令牌哈希存库，24 小时有效。
- 公共 taskId 与 capsuleId 一一对应，采用同一不透明值；个人领取 assignmentId 独立生成。领取接收公共 taskId，其余操作接收 assignmentId，响应明确返回两者。
- 创建、更新参照素材仅图片/视频，回信允许图片/视频/音频。补充 AUDIO 上传。文字或素材至少一项。
- 推荐为目的地直线距离，不能声称路线绕行；默认 3000 米，最大 10000 米，闭区间日期相交。签到要求当前处于回答窗、上报坐标距地点不超过 300 米。客户端坐标不证明真实在场。
- 同用户同胶囊只领取一次，不能领取自己的胶囊；不同用户可分别领取。回信需 CHECKED_IN；已完成不可重复提交。
- 已有签到或领取后，不允许改变地点和日期。已收到回信的胶囊不允许编辑。
- AI 不实现，接口返回 501；有媒体且 blurFace=true 时明确拒绝，请显式传 false；changeSummary 为 null，不伪造隐私处理结果。
- 不把讨论稿中的取消领取、满意回答、城市硬过滤、免签到视为已确认要求；现有相关实体字段保留。
- 媒体只通过稳定 ID 引用，URL 由响应生成。未发布媒体仅上传者可读；已发布媒体对登录用户可读。
- 原 schema.sql 含 DROP TABLE，新运行流程不执行它；使用版本化非破坏性迁移。使用独立新数据库，不动旧 Python 服务数据库。


## INT-REST-01（2026-10-02）

新增需登录的 GET /v1/capsules/discover?page=1&pageSize=10，返回跨用户问题列表（含媒体、坐标、创建者昵称、进行中领取数量）。原 GET /v1/capsules 仍默认只返回本人数据。前端通过同源 Vite 代理访问 /v1，不涉及数据库迁移。


## BE-TRIP-01 云端行程（2026-10-03）

状态：已完成。用户授权将 REST 行程及当前选择存入 MySQL，覆盖此前本机存储限制。提供需登录的 /v1/trips 创建、分页列表、详情、更新、删除、当前选择和匹配接口；所有操作仅限本人。目的地引用已有 POI，日期有效且结束日期不早于今天。未授权匹配的行程可保存，不可设为当前行程或获取推荐。当前行程按账号跨会话共享，切换事务化，每人最多一条；取消授权或删除会清除选择。REST 前端不再读写本地行程。旧浏览器行程保留但不自动上传，用户可重新创建；Mock 仍独立使用 IndexedDB。无取消领取、满意标记等范围扩展。
