<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon, showFailToast, showSuccessToast } from 'vant'
import TripCard from '../components/trip/TripCard.vue'
import type { Trip } from '../services'
import { services, isRestMode, isApiError } from '../services'
import { useActiveTripStore } from '../stores/activeTrip'

const router = useRouter()
const activeTripStore = useActiveTripStore()

const trips = ref<Trip[]>([])
const loading = ref(true)
const loadError = ref('')
const acting = ref(false)

async function loadPage(): Promise<void> {
  loading.value = true
  loadError.value = ''
  try {
    const [nextTrips] = await Promise.all([
      services.trip.listMine(),
      activeTripStore.loadActiveTrip(),
    ])
    trips.value = nextTrips
  } catch (e) {
    loadError.value = isApiError(e) ? e.message : e instanceof Error ? e.message : '加载行程失败，请重试'
  } finally {
    loading.value = false
  }
}

onMounted(loadPage)

async function handleSelect(tripId: string): Promise<void> {
  try {
    await activeTripStore.selectTrip(tripId)
    showSuccessToast('已设为当前行程')
  } catch (e) {
    showFailToast(isApiError(e) ? e.message : e instanceof Error ? e.message : '设置行程失败')
  }
}

async function handleImportDemo(): Promise<void> {
  if (acting.value || loading.value) return
  acting.value = true
  try {
    const trip = await services.trip.importDemoTrip('sc_xuyuan')
    await services.trip.setActive(trip.id)
    await loadPage()
    if (!loadError.value) showSuccessToast(`已载入模拟行程：${trip.destination.cityName}`)
  } catch (e) {
    showFailToast(isApiError(e) ? e.message : e instanceof Error ? e.message : '载入模拟行程失败')
  } finally {
    acting.value = false
  }
}

function goToCreate(): void {
  router.push('/trips/new')
}
</script>

<template>
  <main class="trips-page page-content">
    <header class="page-header">
      <p class="eyebrow">我的行程</p>
      <h1>行程</h1>
      <p class="page-description">
        添加或载入一条未来行程，系统会在匹配模式下推荐沿途的问题。
      </p>
    </header>

    <p v-if="isRestMode">行程与当前选择已保存到你的账号，换设备登录后仍可查看；只有授权的行程会用于匹配附近问题。旧版浏览器行程不会自动上传，请重新添加。</p>
    <div class="actions">
      <button type="button" class="primary-btn" @click="goToCreate">
        <Icon name="plus" aria-hidden="true" /> 添加手动行程
      </button>
      <button
        v-if="!isRestMode"
        type="button"
        class="secondary-btn"
        :disabled="acting || loading"
        @click="handleImportDemo"
      >
        <Icon name="guide-o" aria-hidden="true" /> 载入模拟行程
      </button>
    </div>

    <p v-if="loading" class="state-tip">加载中…</p>
    <div v-else-if="loadError" class="state-error" role="alert">
      <p>行程加载失败：{{ loadError }}</p>
      <button type="button" class="secondary-btn" @click="loadPage">重新加载</button>
    </div>
    <p v-else-if="trips.length === 0" class="state-tip">
      {{ isRestMode ? '还没有行程，请添加一条手动行程。' : '还没有行程。可以添加一条手动行程，或载入比赛模拟行程。' }}
    </p>
    <ul v-else class="trip-list">
      <li v-for="trip in trips" :key="trip.id">
        <TripCard
          :trip="trip"
          :active="activeTripStore.activeTrip?.id === trip.id"
          @select="handleSelect"
        />
      </li>
    </ul>
  </main>
</template>

<style scoped>
.trips-page.page-content {
  padding: 24px 18px 0;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 20px 0 24px;
}

.primary-btn,
.secondary-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: filter 0.2s ease, border-color 0.2s ease;
}

.primary-btn {
  background: var(--color-primary);
  color: #fff;
}

.primary-btn:hover {
  filter: brightness(0.95);
}

.secondary-btn {
  background: var(--color-surface);
  color: var(--color-text);
  border-color: var(--color-border);
}

.secondary-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.secondary-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.trip-list {
  display: grid;
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.state-tip {
  margin: 24px 0;
  font-size: 14px;
  color: var(--color-muted);
  text-align: center;
}

.state-error {
  display: grid;
  justify-items: center;
  gap: 12px;
  margin: 24px 0;
  color: #b42318;
  font-size: 14px;
  text-align: center;
}
</style>
