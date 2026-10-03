<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Button, Icon, showConfirmDialog, showFailToast, showSuccessToast } from 'vant'
import type { Answer, Claim, Question, QuestionSummary, Trip } from '../services'
import { services, isRestMode, isApiError } from '../services'
import { useActiveTripStore } from '../stores/activeTrip'
import { useSessionStore } from '../stores/session'

const router = useRouter()
const sessionStore = useSessionStore()
const activeTripStore = useActiveTripStore()

type TabKey = 'questions' | 'trips' | 'claims' | 'answers'
const activeTab = ref<TabKey>('questions')

const myQuestions = ref<QuestionSummary[]>([])
const myTrips = ref<Trip[]>([])
const myClaims = ref<Claim[]>([])
const myAnswers = ref<Answer[]>([])

/** 为「已领取」tab 缓存问题信息，key 是 questionId */
const claimQuestions = ref<Record<string, Question>>({})

const loading = ref(true)
const loadError = ref('')
const resetting = ref(false)

const tabs = [
  { key: 'questions' as const, label: '我的问题', count: () => myQuestions.value.length },
  { key: 'trips' as const, label: '我的行程', count: () => myTrips.value.length },
  { key: 'claims' as const, label: '已领取', count: () => myClaims.value.length },
  { key: 'answers' as const, label: '已完成', count: () => myAnswers.value.length },
]

async function loadContent(): Promise<boolean> {
  loading.value = true
  loadError.value = ''
  try {
    if (!sessionStore.currentUser) {
      await sessionStore.loadCurrentUser()
      if (sessionStore.error) throw new Error(sessionStore.error)
    }
    await Promise.all([
      loadQuestions(),
      loadTrips(),
      loadClaims(),
      loadAnswers(),
      activeTripStore.loadActiveTrip(),
    ])
    return true
  } catch (e) {
    loadError.value = isApiError(e) ? e.message : e instanceof Error ? e.message : '加载我的内容失败，请重试'
    return false
  } finally {
    loading.value = false
  }
}

onMounted(loadContent)

async function loadQuestions(): Promise<void> {
  myQuestions.value = await services.question.listMine()
}

async function loadTrips(): Promise<void> {
  myTrips.value = await services.trip.listMine()
}

async function loadClaims(): Promise<void> {
  const all = await services.claim.listMine()
  const active = all.filter((c) => c.status === 'active')
  myClaims.value = active

  // 为每个 questionId 加载问题信息（通过 Question 服务，不解析 ID）
  const uniqueIds = Array.from(new Set(active.map((c) => c.questionId)))
  const next: Record<string, Question> = {}
  await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        const detail = await services.question.getById(id)
        next[id] = detail.question
      } catch {
        // 单个失败不影响整体
      }
    }),
  )
  claimQuestions.value = next
}

async function loadAnswers(): Promise<void> {
  myAnswers.value = await services.answer.listMine()
}

function claimTitle(questionId: string): string {
  return claimQuestions.value[questionId]?.title ?? '（无法加载问题标题）'
}

function claimLocation(questionId: string): string {
  const q = claimQuestions.value[questionId]
  if (!q) return ''
  return `${q.location.cityName} · ${q.location.poiName}`
}

function goToQuestion(id: string): void {
  router.push(`/questions/${id}`)
}

function goToAnswer(questionId: string): void {
  router.push(`/questions/${questionId}/answer`)
}

function goToTrip(): void {
  router.push('/trips')
}

async function handleReset(): Promise<void> {
  if (resetting.value) return
  try {
    await showConfirmDialog({
      title: '重置演示数据',
      message:
        '这会清除当前浏览器里所有本地数据（问题、行程、领取、回答），并恢复到初始演示状态。确定继续吗？',
      confirmButtonText: '确定重置',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }

  resetting.value = true
  try {
    await services.demo.reset()
    if (await loadContent()) showSuccessToast('已重置到初始演示状态')
  } catch (e) {
    showFailToast(isApiError(e) ? e.message : e instanceof Error ? e.message : '重置失败')
  } finally {
    resetting.value = false
  }
}

function formatDateRange(start: string, end: string): string {
  return `${start.replaceAll('-', '.')} – ${end.replaceAll('-', '.')}`
}

function tripSourceLabel(t: Trip): string {
  return t.source === 'demo' ? '比赛模拟行程' : '手动行程'
}
</script>

<template>
  <main class="me-page page-content">
    <header class="page-header">
      <p class="eyebrow">我的</p>
      <h1>{{ sessionStore.currentUser?.nickname ?? '演示用户' }}</h1>
      <p class="page-description">
        在这里查看你发布的问题、保存的行程、已领取的任务和已完成的回信。
      </p>
    </header>

    <nav class="tabs" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        role="tab"
        class="tab"
        :class="{ active: activeTab === tab.key }"
        :aria-selected="activeTab === tab.key"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span class="tab-count">{{ tab.count() }}</span>
      </button>
    </nav>

    <p v-if="loading" class="state-tip">加载中…</p>

    <div v-else-if="loadError" class="state-error" role="alert">
      <p>我的内容加载失败：{{ loadError }}</p>
      <button type="button" class="reload-button" @click="loadContent">重新加载</button>
    </div>

    <template v-else>
      <!-- 我的问题 -->
      <section v-show="activeTab === 'questions'" class="panel">
        <p v-if="myQuestions.length === 0" class="state-tip">
          你还没有发布过问题。
        </p>
        <ul v-else class="item-list">
          <li v-for="q in myQuestions" :key="q.question.id">
            <button type="button" class="item-card" @click="goToQuestion(q.question.id)">
              <span class="item-title">{{ q.question.title }}</span>
              <span class="item-meta">
                <Icon name="location-o" aria-hidden="true" />
                {{ q.question.location.cityName }} · {{ q.question.location.poiName }}
              </span>
              <span class="item-meta">
                <Icon name="calendar-o" aria-hidden="true" />
                {{ formatDateRange(q.question.answerWindow.startDate, q.question.answerWindow.endDate) }}
              </span>
              <span class="item-status">
                {{ q.answerCount }} 条回信 · {{ q.activeClaimCount }} 人准备前往
              </span>
            </button>
          </li>
        </ul>
      </section>

      <!-- 我的行程 -->
      <section v-show="activeTab === 'trips'" class="panel">
        <p v-if="myTrips.length === 0" class="state-tip">
          还没有行程。
        </p>
        <ul v-else class="item-list">
          <li v-for="t in myTrips" :key="t.id">
            <button type="button" class="item-card" @click="goToTrip">
              <span class="item-title">
                {{ t.destination.cityName }} · {{ t.destination.poiName }}
              </span>
              <span class="item-meta">
                <Icon name="calendar-o" aria-hidden="true" />
                {{ t.arrivalDate }} – {{ t.departureDate }}
              </span>
              <span
                class="item-tag"
                :class="t.source"
              >{{ tripSourceLabel(t) }}</span>
            </button>
          </li>
        </ul>
      </section>

      <!-- 已领取 -->
      <section v-show="activeTab === 'claims'" class="panel">
        <p v-if="myClaims.length === 0" class="state-tip">
          还没有正在进行的领取。
        </p>
        <ul v-else class="item-list">
          <li v-for="c in myClaims" :key="c.id">
            <button type="button" class="item-card" @click="goToAnswer(c.questionId)">
              <span class="item-title">{{ claimTitle(c.questionId) }}</span>
              <span v-if="claimLocation(c.questionId)" class="item-meta">
                <Icon name="location-o" aria-hidden="true" />
                {{ claimLocation(c.questionId) }}
              </span>
              <span class="item-meta">
                <Icon name="clock-o" aria-hidden="true" />
                领取时间：{{ c.claimedAt.slice(0, 10) }}
              </span>
              <span class="item-status">点击继续写回信</span>
            </button>
          </li>
        </ul>
      </section>

      <!-- 已完成 -->
      <section v-show="activeTab === 'answers'" class="panel">
        <p v-if="myAnswers.length === 0" class="state-tip">
          还没有提交过回信。
        </p>
        <ul v-else class="item-list">
          <li v-for="a in myAnswers" :key="a.id">
            <button type="button" class="item-card" @click="goToQuestion(a.questionId)">
              <span class="item-title">{{ a.text }}</span>
              <span class="item-meta">
                <Icon name="clock-o" aria-hidden="true" />
                {{ a.submittedAt.slice(0, 10) }}
              </span>
              <span v-if="a.isSimulated" class="item-tag demo">比赛模拟</span>
            </button>
          </li>
        </ul>
      </section>
    </template>

    <!-- 重置演示数据 -->
    <section v-if="!isRestMode" class="reset-section">
      <Button
        type="default"
        size="small"
        :loading="resetting"
        :disabled="loading"
        @click="handleReset"
      >
        重置演示数据
      </Button>
      <p class="reset-tip">
        会清除当前浏览器里的所有本地数据，并恢复到初始演示状态。
      </p>
    </section>
  </main>
</template>

<style scoped>
.me-page.page-content {
  padding: 24px 18px 0;
}

.tabs {
  display: flex;
  gap: 4px;
  margin: 24px 0 16px;
  border-bottom: 1px solid var(--color-border);
  overflow-x: auto;
}

.tab {
  position: relative;
  padding: 10px 12px;
  border: none;
  background: transparent;
  color: var(--color-muted);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.tab.active {
  color: var(--color-text);
  font-weight: 700;
}

.tab.active::after {
  content: '';
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: -1px;
  height: 3px;
  border-radius: 2px;
  background: var(--color-primary);
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: var(--color-surface-soft);
  color: var(--color-secondary);
  font-size: 11px;
  font-weight: 600;
}

.item-list {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.item-card {
  display: grid;
  gap: 6px;
  width: 100%;
  padding: 14px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.item-card:hover,
.item-card:focus-visible {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-soft);
}

.item-title {
  font-size: 15px;
  font-weight: 650;
  color: var(--color-text);
  line-height: 1.5;
}

.item-meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-muted);
}

.item-meta :deep(.van-icon) {
  font-size: 14px;
  color: var(--color-primary);
}

.item-status {
  font-size: 12px;
  color: var(--color-secondary);
}

.item-tag {
  justify-self: flex-start;
  padding: 2px 8px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 600;
}

.item-tag.manual {
  background: var(--color-surface-soft);
  color: var(--color-secondary);
}

.item-tag.demo {
  background: #E3EEFF;
  color: var(--color-primary);
}

.reset-section {
  margin-top: 40px;
  padding: 20px 0;
  border-top: 1px dashed var(--color-border);
  text-align: center;
}

.reset-tip {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--color-muted);
  line-height: 1.6;
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

.reload-button {
  min-height: 44px;
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
}
</style>
