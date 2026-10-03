# 后来呢：前后端统一仓库

后续开发统一在 /home/tinyblack/backend 进行，沿用原后端 Git 仓库及历史。

```text
backend/                 ← Git 仓库根目录
├── frontend/            ← Vue 3 + TypeScript
├── backend/             ← Java 25 + Spring Boot + MySQL
├── AGENTS.md
└── TASKS.md
```

## 本机启动

后端后台服务已经切换至新目录：

```bash
cd /home/tinyblack/backend
sudo systemctl start mysql timecapsule-java
cd frontend
npm run dev
```

前端 http://127.0.0.1:5173，后端 http://127.0.0.1:8081/v1/health。
前端 /v1 代理保持不变。第一次克隆后先在 frontend 执行 npm ci。
新机器按 [后端运行指南](backend/docs/RUNNING.md) 配置 JDK 25、MySQL、ffmpeg 和本地环境变量。
手动启动后端：在 backend 子目录执行 bash scripts/start.sh（须先构建 jar）。

## 验证

在仓库根目录执行：

```bash
bash scripts/test-layout.sh
bash backend/scripts/test.sh
cd frontend
npm run type-check
npm run build
REST_LIVE_BASE=http://127.0.0.1:5173/v1 npm run test:rest
```

浏览器测试在 frontend 目录执行 npm run test:e2e（需要受支持的 Node 和浏览器）。
接口文档见 [行程接口](backend/docs/TRIPS.md)；前端说明见 [frontend/README.md](frontend/README.md)。

## 迁移说明

前端来自 hackathon 本地提交 0ce8933，复制源码、测试、文档和锁文件；没有嵌套 Git 仓库。
原 /home/tinyblack/hackathon 保留为旧副本，后续不要在那里开发。
后端配置 .local、媒体 var 和构建产物 target 已移入 backend 子目录并继续忽略，数据库没有迁移或清空。
Git 提交只能在本仓库进行。若回滚目录重组提交，还需将忽略的运行目录移回原位置并重新安装 systemd 服务；Git 不会自动回滚服务配置或媒体目录。
