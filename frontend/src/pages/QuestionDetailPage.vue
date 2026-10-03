<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isApiError, services, type AnswerSort, type QuestionDetail } from '../services'
import AnswerTimeline from '../components/timeline/AnswerTimeline.vue'
import ClaimActionBar from '../components/timeline/ClaimActionBar.vue'
import { useSessionStore } from '../stores/session'

const route = useRoute()
const router = useRouter()
const sessionStore = useSessionStore()
const detail = ref<QuestionDetail | null>(null)
const loading = ref(true)
const loadError = ref('')
const actionError = ref('')
const actionPending = ref(false)
const imageUrls = ref<Record<string, string>>({})
const imageErrors = ref<Record<string, boolean>>({})
let requestVersion = 0
let activeImageIds = new Set<string>()
const imageRequests = new Map<string, Promise<string>>()

const questionId = computed(() => String(route.params.id ?? ''))
const sort = computed<AnswerSort>(() => route.query.sort === 'newest' ? 'newest' : 'oldest')
const futureLabel = computed(() => {
  if (!detail.value) return ''
  const { startDate, endDate } = detail.value.question.answerWindow
  return `预览 ${startDate} 至 ${endDate} 的未来回信`
})

function errorMessage(error: unknown, fallback: string): string {
  return isApiError(error) ? error.message : fallback
}

function releaseImages(): void {
  activeImageIds = new Set()
  for (const url of Object.values(imageUrls.value)) services.asset.revokeObjectUrl(url)
  imageUrls.value = {}
  imageErrors.value = {}
}

function loadImages(next: QuestionDetail): void {
  const needed = new Set([next.referenceAsset.id, ...next.answers.map(answer => answer.photoAsset.id)])
  activeImageIds = needed
  for (const [id, url] of Object.entries(imageUrls.value)) {
    if (!needed.has(id)) {
      services.asset.revokeObjectUrl(url)
      const urls = { ...imageUrls.value }
      delete urls[id]
      imageUrls.value = urls
    }
  }
  for (const id of needed) {
    if (imageUrls.value[id] || imageRequests.has(id)) continue
    const request = services.asset.getObjectUrl(id)
    imageRequests.set(id, request)
    void request.then(url => {
      if (activeImageIds.has(id)) {
        imageUrls.value = { ...imageUrls.value, [id]: url }
        const errors = { ...imageErrors.value }
        delete errors[id]
        imageErrors.value = errors
      } else {
        services.asset.revokeObjectUrl(url)
      }
    }).catch(() => {
      if (activeImageIds.has(id)) imageErrors.value = { ...imageErrors.value, [id]: true }
    }).finally(() => { imageRequests.delete(id) })
  }
}

async function loadDetail(): Promise<void> {
  const version = ++requestVersion
  const id = questionId.value
  if (detail.value?.question.id !== id) {
    detail.value = null
    releaseImages()
  }
  loading.value = true
  loadError.value = ''
  try {
    const next = await services.question.getById(id, sort.value)
    if (version !== requestVersion) return
    detail.value = next
    loading.value = false
    loadImages(next)
  } catch (error) {
    if (version !== requestVersion) return
    loadError.value = errorMessage(error, '问题加载失败，请重试')
    loading.value = false
  }
}

watch([questionId, sort], () => { void loadDetail() }, { immediate: true })
onMounted(async () => {
  if (sessionStore.currentUser) return
  await sessionStore.loadCurrentUser()
  if (!sessionStore.currentUser) {
    actionError.value = sessionStore.error || '无法确认当前用户，暂时不能领取问题'
  }
})
onBeforeUnmount(() => {
  requestVersion++
  releaseImages()
})

async function changeSort(value: AnswerSort): Promise<void> {
  if (value === sort.value) return
  await router.replace({ query: { ...route.query, sort: value === 'newest' ? 'newest' : undefined } })
}

async function revealReplies(): Promise<void> {
  if (!detail.value?.question.demoScenarioId || actionPending.value) return
  actionPending.value = true
  actionError.value = ''
  try {
    await services.demo.revealFutureReplies(detail.value.question.id)
  } catch (error) {
    actionError.value = errorMessage(error, '预览回信失败，请重试')
    actionPending.value = false
    return
  }
  try {
    await loadDetail()
  } finally {
    actionPending.value = false
  }
}

async function setSatisfied(answerId: string, satisfied: boolean): Promise<void> {
  if (!detail.value?.canManageSatisfaction || actionPending.value) return
  actionPending.value = true
  actionError.value = ''
  try {
    await services.answer.setSatisfied(answerId, satisfied)
  } catch (error) {
    actionError.value = errorMessage(error, '更新满意状态失败，请重试')
    actionPending.value = false
    return
  }
  try {
    await loadDetail()
  } finally {
    actionPending.value = false
  }
}

function continueAnswer(): void {
  if (detail.value) void router.push(`/questions/${detail.value.question.id}/answer`)
}
</script>

<template>
  <main class="detail-page page-content">
    <button class="back-link" type="button" @click="router.back()">← 返回</button>
    <p v-if="loading && !detail" class="page-state" role="status">正在加载问题…</p>
    <div v-else-if="!detail" class="page-state">
      <h1>无法打开问题</h1>
      <p role="alert">{{ loadError || '问题不存在或已被删除' }}</p>
      <button type="button" class="secondary-action" @click="loadDetail">重新加载</button>
      <router-link to="/discover">返回发现</router-link>
    </div>
    <template v-else>
      <p class="eyebrow">地点时间胶囊</p>
      <div class="heading-row">
        <h1>{{ detail.question.title }}</h1>
        <span class="status-badge">{{ detail.displayStatus === 'has_satisfied_answers' ? '有满意回答' : detail.displayStatus === 'has_answers' ? '有回答' : '无回答' }}</span>
      </div>
      <p class="location">{{ detail.question.location.cityName }} · {{ detail.question.location.poiName }}</p>
      <p class="description">{{ detail.question.description }}</p>
      <div class="window-card">
        <span>期待回信时间</span>
        <strong>{{ detail.question.answerWindow.startDate }} 至 {{ detail.question.answerWindow.endDate }}</strong>
      </div>
      <p v-if="detail.question.shootingGuide" class="guide"><strong>拍摄建议</strong><br>{{ detail.question.shootingGuide }}</p>
      <p class="counts">{{ detail.answerCount }} 条回信 · {{ detail.satisfiedAnswerCount }} 条满意回答 · 有 {{ detail.activeClaimCount }} 人准备前往</p>
      <figure class="reference">
        <img v-if="imageUrls[detail.referenceAsset.id] && !imageErrors[detail.referenceAsset.id]" :src="imageUrls[detail.referenceAsset.id]" alt="问题参照照片" @error="imageErrors[detail.referenceAsset.id] = true">
        <div v-else class="image-placeholder" role="status">{{ imageErrors[detail.referenceAsset.id] ? '参照照片读取失败' : '正在读取参照照片…' }}</div>
        <figcaption>问题参照照片 <span v-if="detail.referenceAsset.source === 'preset'">· 演示素材</span></figcaption>
      </figure>
      <section v-if="detail.question.demoScenarioId" class="future-panel">
        <p class="future-note">比赛模拟 · 由你主动预览未来回信</p>
        <button type="button" class="primary-action" :disabled="actionPending" @click="revealReplies">{{ actionPending ? '正在处理…' : futureLabel }}</button>
      </section>
      <p v-if="actionError" class="error-text" role="alert">{{ actionError }}</p>
      <p v-if="loadError" class="error-text" role="alert">{{ loadError }}；已显示上次成功加载的内容。</p>
      <p v-if="loading" class="refresh-state" role="status">正在更新详情…</p>
      <AnswerTimeline
        :answers="detail.answers"
        :image-urls="imageUrls"
        :image-errors="imageErrors"
        :can-manage-satisfaction="detail.canManageSatisfaction"
        :action-pending="actionPending"
        :sort="sort"
        @sort="changeSort"
        @satisfy="setSatisfied"
        @image-error="id => imageErrors[id] = true"
      />
      <p v-if="sessionStore.loading" class="refresh-state" role="status">正在确认当前用户…</p>
      <ClaimActionBar
        v-else-if="sessionStore.currentUser"
        :detail="detail"
        :current-user-id="sessionStore.currentUser.id"
        @claimed="loadDetail"
        @cancelled="loadDetail"
        @continue="continueAnswer"
      />
    </template>
  </main>
</template>

<style scoped>
.detail-page { min-width: 0; }
.back-link { border: 0; background: none; color: var(--color-primary); padding: 4px 0 18px; min-height: 44px; cursor: pointer; }
.heading-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
h1 { margin: 0; font-size: clamp(26px, 6vw, 34px); line-height: 1.35; overflow-wrap: anywhere; }
.status-badge { flex: none; border-radius: 999px; background: var(--color-surface-soft); color: var(--color-primary); padding: 5px 10px; font-size: 12px; font-weight: 650; }
.location { margin: 16px 0; color: var(--color-primary); font-size: 15px; font-weight: 650; }
.description, .guide { white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.8; }
.description { font-size: 16px; }
.window-card { display: flex; flex-wrap: wrap; gap: 6px 14px; padding: 15px; border: 1px solid #dbeafe; border-radius: 12px; background: var(--color-surface-soft); font-size: 14px; }
.window-card strong { overflow-wrap: anywhere; }
.guide { color: var(--color-secondary); font-size: 14px; }
.counts { color: var(--color-muted); font-size: 13px; }
.reference { margin: 24px 0; }
.reference img, .image-placeholder { display: block; width: 100%; aspect-ratio: 4 / 3; max-height: 420px; object-fit: cover; border-radius: 14px; background: var(--color-surface-soft); }
.image-placeholder { display: grid; place-items: center; padding: 16px; color: var(--color-muted); }
figcaption { margin-top: 8px; color: var(--color-secondary); font-size: 12px; }
.future-panel { padding: 16px; border: 1px solid #dbeafe; border-radius: 12px; background: var(--color-surface-soft); }
.future-note { margin: 0 0 12px; font-size: 13px; color: var(--color-secondary); }
.primary-action, .secondary-action { display: inline-flex; align-items: center; justify-content: center; width: 100%; min-height: 48px; padding: 9px 14px; border-radius: 10px; cursor: pointer; text-align: center; font-weight: 650; }
.primary-action { border: 1px solid var(--color-primary); background: var(--color-primary); color: white; }
.secondary-action { border: 1px solid var(--color-border); background: white; }
.primary-action:disabled { opacity: .55; cursor: wait; }
.error-text { color: #b42318; font-size: 14px; }
.refresh-state { color: var(--color-muted); font-size: 13px; }
.page-state { padding: 48px 0; display: grid; gap: 14px; }
.page-state p { margin: 0; }
.page-state a { color: var(--color-primary); text-align: center; }
@media (max-width: 430px) { .heading-row { display: block; } .status-badge { display: inline-block; margin-top: 12px; } }
</style>
