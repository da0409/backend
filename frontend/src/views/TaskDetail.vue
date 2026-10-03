<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon, showFailToast } from 'vant'
import ClaimActionBar from '../components/timeline/ClaimActionBar.vue'
import type { Claim, QuestionDetail } from '../services'
import { services } from '../services'
import { useSessionStore } from '../stores/session'

const route = useRoute()
const router = useRouter()
const sessionStore = useSessionStore()

const detail = ref<QuestionDetail | null>(null)
const loading = ref(true)
const referenceUrl = ref<string>('')

const currentUserId = computed(() => sessionStore.currentUser?.id ?? '')

const statusLabel = computed(() => {
  if (!detail.value) return ''
  switch (detail.value.displayStatus) {
    case 'has_satisfied_answers':
      return '已有满意回答'
    case 'has_answers':
      return '已有回答'
    default:
      return '待回答'
  }
})

onMounted(async () => {
  try {
    if (!sessionStore.currentUser) {
      await sessionStore.loadCurrentUser()
    }
  } catch {
    // 忽略：currentUserId 为空时 ClaimActionBar 会退化为不可领取
  }
  await loadDetail()
})

onUnmounted(() => {
  if (referenceUrl.value) {
    services.asset.revokeObjectUrl(referenceUrl.value)
  }
})

async function loadDetail(): Promise<void> {
  loading.value = true
  try {
    const raw = route.params.id
    const id = Array.isArray(raw) ? raw[0] : raw
    detail.value = await services.question.getById(id, 'oldest')

    if (detail.value?.referenceAsset?.id) {
      referenceUrl.value = await services.asset.getObjectUrl(
        detail.value.referenceAsset.id,
      )
    }
  } catch (e) {
    showFailToast(e instanceof Error ? e.message : '加载任务失败')
  } finally {
    loading.value = false
  }
}

function goBack(): void {
  router.back()
}

function handleClaimed(_claim: Claim): void {
  loadDetail()
}

function handleCancelled(): void {
  loadDetail()
}

function handleContinue(): void {
  if (!detail.value) return
  router.push(`/questions/${detail.value.question.id}/answer`)
}
</script>

<template>
  <div class="detail-container">
    <div class="header">
      <button type="button" class="back-btn" @click="goBack">
        ⬅ 返回
      </button>
      <h2>任务详情</h2>
    </div>

    <p v-if="loading" class="state-tip">加载中…</p>
    <p v-else-if="!detail" class="state-tip">任务不存在或已被删除</p>

    <div v-else class="task-card">
      <div class="task-header">
        <h3>{{ detail.question.location.poiName }}</h3>
        <span class="status-tag">{{ statusLabel }}</span>
      </div>
      <p class="address">
        <Icon name="location-o" aria-hidden="true" />
        {{ detail.question.location.cityName }} · {{ detail.question.location.poiName }}
      </p>

      <div class="question-box">
        <h4>过去的问题：</h4>
        <p>{{ detail.question.description }}</p>
        <p v-if="detail.question.shootingGuide" class="shooting-guide">
          拍摄建议：{{ detail.question.shootingGuide }}
        </p>
      </div>

      <div class="window-info">
        <Icon name="calendar-o" aria-hidden="true" />
        期望回答时间：{{ detail.question.answerWindow.startDate }} 至
        {{ detail.question.answerWindow.endDate }}
      </div>

      <div v-if="referenceUrl" class="history-image">
        <img :src="referenceUrl" alt="参照照片" />
      </div>

      <div v-if="detail.answers.length > 0" class="answers-section">
        <h4>现场回信（{{ detail.answers.length }}）</h4>
        <div
          v-for="ans in detail.answers"
          :key="ans.id"
          class="answer-item"
        >
          <p class="answer-author">
            {{ ans.author.nickname }}
            <span v-if="ans.isSimulated" class="sim-tag">比赛模拟</span>
          </p>
          <p class="answer-text">{{ ans.text }}</p>
        </div>
      </div>

      <ClaimActionBar
        :detail="detail"
        :current-user-id="currentUserId"
        @claimed="handleClaimed"
        @cancelled="handleCancelled"
        @continue="handleContinue"
      />
    </div>
  </div>
</template>

<style scoped>
.detail-container {
  min-height: 100vh;
  background: var(--color-background);
  padding: 20px;
  font-family: inherit;
  max-width: 600px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.back-btn {
  border: none;
  background: none;
  color: var(--color-muted);
  font-size: 14px;
  cursor: pointer;
  padding: 6px;
}

.back-btn:hover {
  color: var(--color-primary);
}

.task-card {
  border: 1px dashed var(--color-border);
  background: var(--color-surface);
  padding: 16px;
  border-radius: var(--radius-md);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px dashed var(--color-border);
  padding-bottom: 10px;
  margin-bottom: 15px;
}

.task-header h3 {
  margin: 0;
  color: var(--color-text);
  font-size: 18px;
}

.status-tag {
  padding: 2px 8px;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  border-radius: 4px;
  font-size: 12px;
}

.address {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-primary);
  font-size: 14px;
  margin-bottom: 15px;
}

.address :deep(.van-icon) {
  font-size: 16px;
}

.question-box {
  background: var(--color-surface-soft);
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.question-box h4 {
  margin: 0 0 8px 0;
  color: var(--color-text);
  font-size: 14px;
}

.question-box p {
  margin: 0;
  color: var(--color-muted);
  font-size: 15px;
  line-height: 1.6;
}

.shooting-guide {
  margin-top: 8px !important;
  font-size: 13px !important;
  color: var(--color-muted) !important;
}

.window-info {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-muted);
  margin-bottom: 16px;
}

.history-image {
  margin-bottom: 20px;
  text-align: center;
}

.history-image img {
  max-width: 100%;
  border-radius: 8px;
  border: 4px solid var(--color-surface);
  box-shadow: var(--shadow-soft);
}

.answers-section {
  border-top: 1px dashed var(--color-border);
  padding-top: 16px;
  margin-bottom: 20px;
}

.answers-section h4 {
  margin: 0 0 12px 0;
  color: var(--color-text);
  font-size: 14px;
}

.answer-item {
  background: var(--color-surface-soft);
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 10px;
}

.answer-author {
  margin: 0 0 6px 0;
  font-size: 13px;
  color: var(--color-secondary);
}

.sim-tag {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 6px;
  border: 1px solid #B89B6B;
  color: #B89B6B;
  border-radius: 4px;
  font-size: 11px;
}

.answer-text {
  margin: 0;
  font-size: 14px;
  color: var(--color-text);
  line-height: 1.6;
}

.state-tip {
  text-align: center;
  color: var(--color-muted);
  padding: 40px 20px;
}
</style>