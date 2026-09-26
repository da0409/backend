# 实现约定

## 基线与分层

保持现有 com.hackathon.backend 包和 pojo/entity 模型，Java 25、Spring Boot 4.1.1。MyBatis-Plus 升级到 Boot 4 专用 starter 3.5.17，避免 Boot 3 自动配置不兼容。依据：https://baomidou.com/en/getting-started/install/ 。

Controller 只依赖 Service，负责 HTTP 与字段校验；Service 实现业务、事务、权限并调用 Mapper；Mapper 通过 MyBatis-Plus 和参数化 SQL 访问 MySQL。不在 Controller 查询数据库。JNI 的 C++ 模块只负责纯距离计算，不包含 HTTP 或数据库逻辑。

## 接口补充

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
