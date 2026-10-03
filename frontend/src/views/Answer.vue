<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showFailToast, showSuccessToast, showToast } from 'vant'
import AnswerComposer from '../components/timeline/AnswerComposer.vue'
import type { Claim, CreateAnswerInput, Question } from '../services'
import { isApiError, services, isRestMode } from '../services'

const route = useRoute()
const router = useRouter()

const question = ref<Question | null>(null)
const claim = ref<Claim | null>(null)
const longitude = ref<string | number>('')
const latitude = ref<string | number>('')
const checkingIn = ref(false)
const checkedIn = ref(false)
const checkinError = ref('')
async function checkin() {
  if (!claim.value || checkingIn.value) return
  checkinError.value = ''; checkedIn.value = false
  if (!String(longitude.value).trim() || !String(latitude.value).trim() || !Number.isFinite(Number(longitude.value)) || !Number.isFinite(Number(latitude.value))) {
    checkinError.value = '请填写有效的当前位置经纬度'; return
  }
  checkingIn.value = true
  try {
    await services.claim.checkin!(claim.value.id, { longitude: Number(longitude.value), latitude: Number(latitude.value) })
    checkedIn.value = true
  } catch (e) { checkinError.value = isApiError(e) ? e.message : '签到失败' }
  finally { checkingIn.value = false }
}
const loading = ref(true)
const loadError = ref('')

/**
 * 提交锁：
 * - 一旦开始提交就置为 true
 * - 提交成功后**不重置**，直到页面卸载（防止 1.2 秒延迟期间的重复点击）
 * - 提交失败才重置，让用户可以修正后重试
 */
const submitting = ref(false)
const succeeded = ref(false)

onMounted(loadQuestionAndClaim)

async function loadQuestionAndClaim(): Promise<void> {
  loading.value = true
  loadError.value = ''
  try {
    const raw = route.params.id
    const id = Array.isArray(raw) ? raw[0] : raw

    const detail = await services.question.getById(id)
    const mine = await services.claim.listMine()
    const active = mine.find(
      (c) => c.questionId === id && c.status === 'active',
    )

    if (!active) {
      showToast('请先在任务详情页领取这个问题')
      await router.replace(`/questions/${id}`)
      return
    }
    question.value = detail.question
    claim.value = active
  } catch (e) {
    loadError.value = isApiError(e) ? e.message : e instanceof Error ? e.message : '任务加载失败，请重试'
  } finally {
    loading.value = false
  }
}

function goBack(): void {
  router.back()
}

async function handleSubmit(input: CreateAnswerInput): Promise<void> {
  if (!claim.value) {
    showFailToast('没有有效的领取记录')
    return
  }
  // 已经成功过，或正在提交，直接忽略
  if (submitting.value || succeeded.value) return

  if (isRestMode && !checkedIn.value) { showFailToast('请先完成签到'); return }
  submitting.value = true
  try {
    await services.answer.create(claim.value.id, input)
    succeeded.value = true
    showSuccessToast('回信已寄出！')
    await router.replace(`/questions/${question.value?.id ?? ''}`)
    // 注意：不重置 submitting / succeeded
  } catch (e) {
    showFailToast(isApiError(e) ? e.message : e instanceof Error ? e.message : '提交失败')
    // 失败时解锁，允许用户修正后重试
    submitting.value = false
  }
}
</script>

<template>
  <div class="answer-container">
    <div class="header">
      <button type="button" class="back-btn" @click="goBack">
        ⬅ 返回
      </button>
      <h2>写一封远方回信</h2>
    </div>

    <p v-if="loading" class="state-tip">加载中…</p>
    <div v-else-if="!question" class="state-tip" role="alert">
      <p>{{ loadError || '正在返回问题详情…' }}</p>
      <div v-if="loadError" class="state-actions">
        <button type="button" @click="loadQuestionAndClaim">重新加载</button>
        <RouterLink to="/discover">返回发现</RouterLink>
      </div>
    </div>

    <div v-else class="answer-card">
      <div class="origin-question">
        <h4>你正在回答：</h4>
        <p>{{ question.description }}</p>
      </div>

      <section v-if="isRestMode" class="checkin-panel">
        <h3>现场签到</h3>
        <p>当前为手动坐标联调：填写当前位置的 WGS84 坐标，后端校验距地点不超过 300 米且处于回答日期内。此校验不证明真实到场。</p>
        <label>当前位置经度<input v-model="longitude" type="number" min="-180" max="180" step="any" @input="checkedIn = false" /></label>
        <label>当前位置纬度<input v-model="latitude" type="number" min="-90" max="90" step="any" @input="checkedIn = false" /></label>
        <button type="button" :disabled="checkingIn || submitting" @click="checkin">{{ checkingIn ? '正在签到…' : '确认签到' }}</button>
        <p v-if="checkedIn" role="status">签到成功，请在 30 分钟内提交；超时可重新签到。</p>
        <p v-if="checkinError" role="alert">{{ checkinError }}</p>
      </section>
      <AnswerComposer
        :question="question"
        :submitting="submitting"
        @submit="handleSubmit"
      />
    </div>
  </div>
</template>

<style scoped>
.checkin-panel { display: grid; gap: 12px; margin-bottom: 24px; }
.checkin-panel label { display: grid; gap: 6px; }
.checkin-panel input, .checkin-panel button { min-height: 44px; padding: 8px; }
.checkin-panel p { font-size: 13px; line-height: 1.6; }
.checkin-panel [role=alert] { color: #b91c1c; }
.answer-container {
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

.answer-card {
  border: 1px dashed var(--color-border);
  background: var(--color-surface);
  padding: 20px;
  border-radius: var(--radius-md);
}

.origin-question {
  background: var(--color-surface-soft);
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 24px;
  border-left: 4px solid var(--color-primary);
}

.origin-question h4 {
  margin: 0 0 8px 0;
  color: var(--color-text);
  font-size: 14px;
}

.origin-question p {
  margin: 0;
  color: var(--color-muted);
  font-size: 14px;
  line-height: 1.6;
}

.state-tip {
  text-align: center;
  color: var(--color-muted);
  padding: 40px 20px;
}

.state-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
}

.state-actions button,
.state-actions a {
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-primary);
  cursor: pointer;
}
</style>
