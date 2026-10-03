<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon, showFailToast, showSuccessToast, showToast } from 'vant'
import MatchModeBar from '../components/common/MatchModeBar.vue'
import QuestionCard from '../components/question/QuestionCard.vue'
import type { QuestionSummary } from '../services'
import { services, isRestMode, isApiError } from '../services'
import { useActiveTripStore } from '../stores/activeTrip'
import { useSessionStore } from '../stores/session'

const router = useRouter()
const activeTripStore = useActiveTripStore()
const sessionStore = useSessionStore()

const mode = ref<'nationwide' | 'trip'>('nationwide')
const nationwide = ref<QuestionSummary[]>([])
const matched = ref<QuestionSummary[]>([])
const loading = ref(true)
const loadError = ref('')

const canMatch = computed(() => activeTripStore.activeTrip?.participatesInMatching === true)
const matchHint = computed(() =>
  activeTripStore.activeTrip
    ? '当前行程未参与匹配。请到行程页选择一条允许匹配的行程。'
    : '添加行程后可匹配沿途的问题。',
)
const currentUserId = computed(() => sessionStore.currentUser?.id ?? '')
const displayList = computed(() =>
  mode.value === 'trip' ? matched.value : nationwide.value,
)

async function loadDiscover(): Promise<void> {
  loading.value = true
  loadError.value = ''
  try {
    if (!sessionStore.currentUser) {
      await sessionStore.loadCurrentUser()
      if (sessionStore.error) throw new Error(sessionStore.error)
    }
    await activeTripStore.loadActiveTrip()

    nationwide.value = await services.question.listDiscover()

    if (canMatch.value && activeTripStore.activeTrip) {
      matched.value = await services.match.listForTrip(
        activeTripStore.activeTrip.id,
      )
    }
  } catch (e) {
    loadError.value = isApiError(e) ? e.message : e instanceof Error ? e.message : '加载问题失败，请重试'
  } finally {
    loading.value = false
  }
}

onMounted(loadDiscover)

async function loadDemoTrip(): Promise<void> {
  try {
    const trip = await services.trip.importDemoTrip('sc_xuyuan')
    await services.trip.setActive(trip.id)
    await activeTripStore.loadActiveTrip()
    matched.value = await services.match.listForTrip(trip.id)
    showSuccessToast(`已载入行程：${trip.destination.cityName}`)
    mode.value = 'trip'
  } catch (e) {
    showFailToast(isApiError(e) ? e.message : e instanceof Error ? e.message : '载入模拟行程失败')
  }
}

async function handleClaim(questionId: string): Promise<void> {
  try {
    const claim = await services.claim.create(questionId)
    showSuccessToast('领取成功')
    router.push(`/questions/${claim.questionId}/answer`)
  } catch (e) {
    showFailToast(isApiError(e) ? e.message : e instanceof Error ? e.message : '领取失败')
  }
}

function updateMode(next: 'nationwide' | 'trip'): void {
  if (next === 'trip' && !canMatch.value) {
    showToast(matchHint.value)
    return
  }
  mode.value = next
}
</script>

<template>
  <main class="discover-page page-content">
    <h1 class="visually-hidden">发现</h1>

    <MatchModeBar
      :mode="mode"
      :can-match="canMatch"
      :disabled-hint="matchHint"
      @update:mode="updateMode"
    />

    <div v-if="!canMatch && mode === 'nationwide'" class="trip-prompt">
      <Icon name="guide-o" aria-hidden="true" />
      <div class="trip-prompt-text">
        <p v-if="activeTripStore.activeTrip">当前行程未参与匹配。请到行程页选择一条允许匹配的行程。</p>
        <p v-else>{{ isRestMode ? "添加一条行程，匹配目的地附近的问题。" : "还没有行程？载入一条比赛模拟行程，看看沿途有哪些问题等待回答。" }}</p>
        <RouterLink v-if="activeTripStore.activeTrip" to="/trips" class="load-trip-btn">查看行程</RouterLink>
        <RouterLink v-else-if="isRestMode" to="/trips/new" class="load-trip-btn">添加行程</RouterLink>
        <button v-else type="button" class="load-trip-btn" @click="loadDemoTrip">
          载入模拟行程
        </button>
      </div>
    </div>

    <p v-if="loading" class="state-tip">加载中…</p>
    <div v-else-if="loadError" class="state-error" role="alert">
      <p>问题加载失败：{{ loadError }}</p>
      <button type="button" class="load-trip-btn" @click="loadDiscover">重新加载</button>
    </div>
    <p v-else-if="displayList.length === 0" class="state-tip">
      <template v-if="mode === 'trip'">当前行程没有匹配到问题。</template>
      <template v-else>暂时没有问题。</template>
    </p>

    <section v-else class="question-list" aria-label="问题列表">
      <QuestionCard
        v-for="item in displayList"
        :key="item.question.id"
        :item="item"
        :current-user-id="currentUserId"
        :claimable="mode === 'trip'"
        @claim="handleClaim"
      />
    </section>
  </main>
</template>

<style scoped>
.discover-page.page-content {
  padding: 16px 0 0;
}

.question-list {
  margin-top: 16px;
}

.trip-prompt {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  margin: 16px 18px;
  padding: 14px;
  border: 1px solid #DEEBFF;
  border-radius: 12px;
  background: var(--color-surface-soft);
  color: var(--color-text);
  font-size: 13px;
  line-height: 1.7;
}

.trip-prompt :deep(.van-icon) {
  flex-shrink: 0;
  margin-top: 2px;
  font-size: 22px;
  color: var(--color-primary);
}

.trip-prompt-text {
  display: grid;
  gap: 10px;
}

.trip-prompt-text p {
  margin: 0;
}

.load-trip-btn {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  padding: 8px 14px;
  border: none;
  border-radius: 8px;
  background: var(--color-primary);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.load-trip-btn:hover {
  filter: brightness(0.95);
}

.state-tip {
  margin: 24px 18px;
  font-size: 14px;
  color: var(--color-muted);
  text-align: center;
}

.state-error {
  display: grid;
  justify-items: center;
  gap: 12px;
  margin: 24px 18px;
  color: #b42318;
  font-size: 14px;
  text-align: center;
}
</style>
