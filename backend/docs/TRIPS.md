# 行程存储接口

所有接口均需 Authorization: Bearer <登录令牌>，只读写当前账号行程。数据存入 MySQL t_trip；客户端不能指定所有者。
成功响应统一为 { "code": 1, "msg": "success", "data": ... }。

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| POST | /v1/trips | 创建，返回 201 和行程对象 |
| GET | /v1/trips?page=1&pageSize=10 | 本人列表，data 为 {total, rows} |
| GET | /v1/trips/{id} | 详情 |
| PUT | /v1/trips/{id} | 完整更新 |
| DELETE | /v1/trips/{id} | 删除，data 为 null |
| GET | /v1/trips/active | 当前未过期行程，无则 null |
| PUT | /v1/trips/active | 选择当前行程，body 为 {"tripId":"行程ID"} |
| DELETE | /v1/trips/active | 清除当前选择 |
| GET | /v1/trips/{id}/matches?radiusMeters=3000&page=1&pageSize=10 | 按已保存的目的地和日期匹配问题 |

创建和更新请求（destinationPoiId 必须替换为已有问题的真实 POI ID）：

```json
{
  "destinationPoiId": "existing-poi-id",
  "arrivalDate": "2099-01-01",
  "departureDate": "2099-01-03",
  "participatesInMatching": true
}
```

行程响应字段：tripId、travelerId、destination（poiId、poiName、cityCode、cityName、longitude、latitude）、arrivalDate、departureDate、participatesInMatching、active、createTime、updateTime。
业务日期为 YYYY-MM-DD。事件时间沿用后端 yyyy-MM-dd HH:mm:ss（Asia/Shanghai）；前端转换为带 +08:00 的 ISO 8601。
分页页码至少 1，pageSize 为 1–100；半径为 1–10000 米。创建不会自动选择当前行程，前端保存已授权行程后单独调用选择接口。

未登录返回 401；操作他人或不存在的行程返回 404；无效日期、POI、分页返回 422；未授权匹配时选择或推荐返回 409。结束日期不能早于今天，开始日期不能晚于结束日期。过期行程仍在列表中，但不作为当前行程；匹配沿用推荐服务的日期校验。
取消授权会清除该行程的当前选择，删除当前行程也会清除选择。每个账号的选择跨会话共享，最后一次成功选择生效，不做实时推送，其他设备刷新后读取。

实现为 TripController → TripService → TripMapper。用户行锁串行化切换、更新、删除；生成列唯一索引保证每个账号最多一个当前行程。用户外键为限制删除，需要先处理行程再删除用户。
Flyway V3__user_trips.sql 自动创建新表，不修改既有业务表。迁移执行成功后不要编辑 V3。回滚应用提交不会删除 t_trip 或其中数据；不要通过删表回滚用户行程。

前端 REST 已接入创建、列表、当前选择和匹配；更新、删除、清除选择接口可直接调用，尚未增加相应编辑按钮。
旧版 localStorage 行程保留在原浏览器，不自动上传，请手动重新创建；Mock 继续使用独立 IndexedDB。

验证：后端 27 项测试通过，覆盖跨会话持久化、账号隔离、授权撤回、日期/分页校验和并发当前选择。前端 8 项 REST 测试、2 项真实浏览器测试、类型检查及构建通过；浏览器使用全新上下文登录同账号确认行程和当前选择可恢复。
