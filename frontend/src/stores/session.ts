// src/stores/session.ts
// 依据 docs/TECHNICAL.md 第 4 节：
// Pinia 只保存跨页面 UI 状态，不保存实体权威数据。

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '../services/contracts'
import { services, isApiError } from '../services'

export const useSessionStore = defineStore('session', () => {
  const currentUser = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isDemoUser = computed(() => currentUser.value?.isDemo === true)

  async function loadCurrentUser(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      currentUser.value = await services.session.getCurrentUser()
    } catch (e) {
      error.value = isApiError(e) ? e.message : e instanceof Error ? e.message : '加载当前用户失败'
    } finally {
      loading.value = false
    }
  }

  function clear(): void {
    currentUser.value = null
    error.value = null
  }

  return { currentUser, loading, error, isDemoUser, loadCurrentUser, clear }
})