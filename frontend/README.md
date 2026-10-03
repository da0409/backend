# 后来呢？前端与 Java 后端联调

前端位于统一仓库 frontend/，Java 25 / MySQL 后端位于 ../backend/，共享仓库根目录的 Git 历史。

## 本机启动（WSL）

当前电脑的 Java、MySQL 和后台服务已经配置好：

```bash
sudo systemctl start mysql timecapsule-java
cd /home/tinyblack/backend/frontend
npm ci
npm run dev
```

打开 http://127.0.0.1:5173 。先注册账号或登录；不要使用原来的固定演示用户登录。
后端健康检查：http://127.0.0.1:8081/v1/health 。
从前端代理检查：http://127.0.0.1:5173/v1/health 。

在新电脑首次配置后端，请按同级 backend 的 docs/RUNNING.md 配置 Java 25、MySQL、ffmpeg 和数据库环境变量。Flyway 会在已有数据库内自动建表。前端不需要数据库账号密码。

## 配置

默认 REST 模式，前端请求同源 /v1，Vite 转发至 127.0.0.1:8081。
需要改地址时复制 .env.example 为 .env.local，修改 BACKEND_PROXY_TARGET，然后重启前端。
必须使用 npm 脚本，它们明确加载 vite.config.ts，避免本地遗留 vite.config.js 抢先加载。

`127.0.0.1` 指运行服务的当前电脑。最简单的联调方式是在同一台电脑启动前后端。跨电脑访问需要另行配置监听地址和访问权限。
生产部署需要由 Web 服务器代理 /v1；Vite 开发代理不会打包进 dist。

## 已对接范围

- 真实注册、登录、退出、会话过期处理。Token 仅保存在当前标签页 sessionStorage。
- 真实照片上传和带鉴权的图片显示。
- 跨用户发现、发布预览、创建胶囊、我的问题、回信时间线。
- 行程和当前选择存入 MySQL，按账号隔离，换设备登录后可恢复；只有授权的行程参与匹配。旧版浏览器行程不会自动上传，请重新创建。
- 领取、手动输入当前位置坐标签到、上传现场照片并回信。
- 签到由后端校验当前回答日期窗及 300 米范围，30 分钟有效。手动坐标仅供联调，不证明真实到场。
- 新地点必须提供准确的 WGS84 经纬度；行程可选择已有问题中的地点，不进行地图搜索或名称地理编码。
- 拍摄建议保存到参照媒体的 caption 字段。
- REST 模式不显示取消领取、满意标记、预制未来回信或清空演示数据入口。这些功能仍只在 Mock 模式提供。
- 照片不自动模糊人脸，上传前请自行检查隐私；AI 未接入。

## 验收顺序

1. 注册账号 A，发布一条带照片、地点坐标和回答时间范围的问题。测试当天签到时，时间范围必须包含当天。
2. 在另一个浏览器或无痕窗口注册账号 B。
3. 添加目的地相同、时间范围相交的行程，允许匹配。
4. 在发现页点击匹配行程，打开账号 A 的问题并领取。
5. 在回信页明确输入当前坐标，签到成功后上传照片、填写文字、勾选声明并提交。
6. 回到账号 A，刷新详情，确认出现账号 B 的回信和照片。
7. 错误位置应签到失败；未签到和重复提交应失败。

不要将多个用户在同一标签页同时登录。退出后再切换账号。

## Mock 演示

```bash
npm run dev:mock
```

先停止占用 5173 的 REST 前端，再启动 Mock。Mock 只使用原来的 IndexedDB 数据，不读写 MySQL。
REST 出错时不会自动退回 Mock，也不会把旧演示记录当作服务器数据。

## 检查与测试

```bash
npm run type-check
npm run build
npm run build:mock
npm run test:rest
# 前后端已启动时，真实验收会新增明确标注的模拟账号、问题和回信：
REST_LIVE_BASE=http://127.0.0.1:5173/v1 npm run test:rest
```

浏览器测试使用 Node 20 以上（建议 Node 22）：

```bash
npx playwright install chromium
npm run test:e2e
```

本机默认 Node 18 时可用临时 Node 22，不修改系统默认环境：

```bash
npm exec --yes --package=node@22 -- node node_modules/playwright/cli.js install chromium
npm exec --yes --package=node@22 -- node node_modules/playwright/cli.js test
```

浏览器测试同样会产生标注为联调模拟的数据，不会清空开发库。真实接口适配测试和浏览器测试需要本机 /v1 代理连接可用后端。

产品与接口边界详见 docs/PRODUCT.md、docs/API.md 的 INT-REST-01 补充。

Windows 已装 Node 20+ 与 Edge 时，也可在前端目录用 PowerShell 运行：

```powershell
node ./node_modules/playwright/cli.js test integration.spec.ts
```

Windows 测试配置自动选用本机 Edge，无需下载 Chromium。
Mock 回归：另开终端执行 npm run dev:mock -- --port 5174，再在测试进程设置 E2E_MODE=mock、E2E_BASE_URL=http://127.0.0.1:5174，仅运行 mock.spec.ts。
