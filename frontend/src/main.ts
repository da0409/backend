// src/main.ts
// 依据 docs/TECHNICAL.md 第 7 节：
// 应用启动时调用 demoApi.bootstrap()，首次启动或数据版本变化时写入 fixture。

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Vant from 'vant'
import 'vant/lib/index.css'
import App from './app/App.vue'
import InitializationError from './app/InitializationError.vue'
import router from './router/index.ts'
import './styles/base.css'

import { services } from './services'
import { isApiError } from './services/contracts'

async function start(): Promise<void> {
  // 挂载前先 bootstrap，确保 fixture 就位
  try {
    await services.demo.bootstrap()
  } catch (e) {
    console.error('[bootstrap] 演示数据初始化失败', e)
    createApp(InitializationError, {
      message: isApiError(e) ? e.message : '本地演示数据暂时无法读取，请稍后重试。',
      onRetry: () => window.location.reload(),
    }).mount('#app')
    return
  }

  const app = createApp(App)
  app.use(createPinia())
  app.use(router)
  app.use(Vant) // 全局注册 Vant 组件（van-button / van-tag 等）
  app.mount('#app')
}

void start()
