// src/stores/activeTrip.ts
// 依据 docs/TECHNICAL.md 第 4 节：
// Pinia 只保存"当前选中的行程"这种 UI 状态。
// 行程权威数据永远在 IndexedDB 里，由 tripApi 读写。

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Trip } from '../services/contracts'
import { services } from '../services'

export const useActiveTripStore = defineStore('activeTrip', () => {
  const activeTrip = ref<Trip | null>(null)
  const loading = ref(false)

  const hasActiveTrip = computed(() => activeTrip.value !== null)

  async function loadActiveTrip(): Promise<void> {
    loading.value = true
    try {
      const trip = await services.trip.getActive()
      activeTrip.value = trip ?? null
    } finally {
      loading.value = false
    }
  }

  async function selectTrip(tripId: string): Promise<void> {
    await services.trip.setActive(tripId)
    const trip = await services.trip.getActive()
    activeTrip.value = trip ?? null
  }

  function clear(): void {
    activeTrip.value = null
  }

  return {
    activeTrip,
    loading,
    hasActiveTrip,
    loadActiveTrip,
    selectTrip,
    clear,
  }
})