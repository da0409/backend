<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast } from 'vant'
import TripForm from '../components/trip/TripForm.vue'
import type { CreateTripInput } from '../services'
import { isApiError, services, isRestMode } from '../services'
import { useActiveTripStore } from '../stores/activeTrip'

const router = useRouter()
const activeTripStore = useActiveTripStore()
const saving = ref(false)
const saveError = ref('')

async function handleSubmit(input: CreateTripInput): Promise<void> {
  if (saving.value) return
  saving.value = true
  saveError.value = ''
  try {
    const questions = await services.question.listDiscover()
    const cityName = input.destination.cityName.trim().normalize('NFKC')
    const poiName = input.destination.poiName.trim().normalize('NFKC')
    const sameCity = questions.find(
      item => item.question.location.cityName.trim().normalize('NFKC') === cityName,
    )?.question.location
    const cityCode = sameCity?.cityCode ?? cityName
    const samePoi = questions.find(
      item => item.question.location.cityCode === cityCode
        && item.question.location.poiName.trim().normalize('NFKC') === poiName,
    )?.question.location
    const trip = await services.trip.create({
      ...input,
      destination: isRestMode ? input.destination : {
        cityName,
        cityCode,
        poiName,
        poiId: samePoi?.poiId ?? poiName,
      },
    })
    if (trip.participatesInMatching) await services.trip.setActive(trip.id)
    await activeTripStore.loadActiveTrip()
    showSuccessToast('行程已保存')
    await router.push('/trips')
  } catch (e) {
    saveError.value = isApiError(e) || e instanceof Error ? e.message : '保存行程失败，请重试'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <main class="trip-create-page page-content">
    <button class="back-link" type="button" @click="router.push('/trips')">← 返回</button>
    <header class="page-header">
      <p class="eyebrow">添加行程</p>
      <h1>新增一条行程</h1>
      <p class="page-description">
        填写目的地和日期后，可以在发现页切换到行程匹配模式。
      </p>
    </header>

    <TripForm :saving="saving" :server-error="saveError" @submit="handleSubmit" />
  </main>
</template>

<style scoped>
.trip-create-page.page-content {
  padding: 24px 18px 0;
}
.back-link {
  min-height: 44px;
  margin-bottom: 8px;
  padding: 4px 0;
  border: 0;
  background: none;
  color: var(--color-primary);
  cursor: pointer;
}
</style>
