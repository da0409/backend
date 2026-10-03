<script setup lang="ts">
import { onMounted, ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import QuestionForm from '../components/question/QuestionForm.vue'
import { services, isRestMode, isApiError, type DemoScenarioSummary } from '../services'
import { useQuestionDraftStore } from '../stores/questionDraft'

const router = useRouter()
const store = useQuestionDraftStore()
const { draft, errors } = storeToRefs(store)
const scenarios = ref<DemoScenarioSummary[]>([])
const scenarioError = ref('')
const imageSaving = ref(false)
const errorSummary = ref<HTMLElement | null>(null)
async function focusErrors() {
  await nextTick()
  errorSummary.value?.focus({ preventScroll: true })
  errorSummary.value?.scrollIntoView({ block: 'center' })
}

onMounted(async () => {
  if (Object.keys(errors.value).length) void focusErrors()
  try {
    scenarios.value = await services.demo.listScenarios()
  } catch (error) {
    scenarioError.value = isApiError(error) ? error.message : '预制故事暂时无法载入'
  }
})

function validate(): boolean {
  const next: Record<string, string> = {}
  if (!draft.value.title.trim()) next.title = '请填写问题标题'
  if (!draft.value.description.trim()) next.description = '请填写详细问题'
  if (!draft.value.referenceAssetId) next.referenceAssetId = '请选择参照照片'
  if (!draft.value.location.cityName.trim() || !draft.value.location.cityCode.trim()) next['location.cityCode'] = '请填写城市'
  if (!draft.value.location.poiName.trim() || !draft.value.location.poiId.trim()) next['location.poiId'] = '请填写具体地点'
  if (!draft.value.answerWindow.startDate) next['answerWindow.startDate'] = '请选择回答开始日期'
  if (!draft.value.answerWindow.endDate) next['answerWindow.endDate'] = '请选择回答结束日期'
  if (draft.value.answerWindow.startDate && draft.value.answerWindow.endDate && draft.value.answerWindow.startDate > draft.value.answerWindow.endDate) next['answerWindow.endDate'] = '结束日期不能早于开始日期'
  if (isRestMode) {
    const { longitude, latitude } = draft.value.location
    if (longitude == null || latitude == null || !Number.isFinite(longitude) || !Number.isFinite(latitude) || Math.abs(longitude) > 180 || Math.abs(latitude) > 90) next.location = '请填写有效的经纬度（经度 -180 至 180，纬度 -90 至 90）'
    if (draft.value.title.length > 128) next.title = '标题不能超过 128 个字符'
    if (draft.value.description.length > 512) next.description = '详细问题不能超过 512 个字符'
    if ((draft.value.shootingGuide?.length || 0) > 255) next.shootingGuide = '拍摄建议不能超过 255 个字符'
    const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(new Date())
    if (draft.value.answerWindow.endDate && draft.value.answerWindow.endDate < today) next['answerWindow.endDate'] = '回答结束日期不能早于今天'
  }
  errors.value = next
  if (Object.keys(next).length) {
    void focusErrors()
    return false
  }
  return true
}

function preview(): void {
  if (imageSaving.value) return
  if (!validate()) return
  store.previewReady = true
  void router.push('/questions/new/preview')
}
</script>

<template>
  <main class="create-page page-content">
    <p class="eyebrow">留下一个地点的时间问题</p>
    <h1>发布问题</h1>
    <p class="intro">放进一张参照照片，给未来路过这里的人留一个问题。</p>
    <section class="mode-section" aria-label="创建方式">
      <h2>从哪里开始</h2>
      <div class="mode-actions">
        <button type="button" :disabled="imageSaving" :class="{ selected: !draft.demoScenarioId }" @click="store.reset()">自由创建</button>
        <button v-for="scenario in scenarios" :key="scenario.id" type="button" :disabled="imageSaving" :class="{ selected: draft.demoScenarioId === scenario.id }" @click="store.useScenario(scenario)">试用预制故事<span>{{ scenario.title }}</span></button>
      </div>
      <p v-if="scenarioError" class="field-error" role="alert">{{ scenarioError }}</p>
      <p v-if="draft.demoScenarioId" class="mode-note">演示素材已填入。你可以修改文字和时间窗，地点与参照照片保持锁定。</p>
    </section>
    <form novalidate @submit.prevent="preview">
      <div v-if="Object.keys(errors).length" ref="errorSummary" class="error-summary" role="alert" tabindex="-1">
        <strong>暂时无法发布，请检查以下内容：</strong>
        <ul><li v-for="(message, field) in errors" :key="field">{{ message }}</li></ul>
      </div>
      <QuestionForm @saving="imageSaving = $event" />
      <button class="primary-action" type="submit" :disabled="imageSaving">{{ imageSaving ? '正在保存照片…' : '查看发布预览' }}</button>
    </form>
  </main>
</template>

<style scoped>
.error-summary { padding: 16px; margin-bottom: 20px; border: 1px solid #c24136; border-radius: 10px; color: #9f271e; background: #fff7f5; }
.error-summary ul { padding-left: 20px; margin-bottom: 0; }
.create-page { padding-bottom: 30px; }
h1 { margin: 0; font-size: 30px; line-height: 1.3; letter-spacing: -.03em; }
h2 { margin: 0 0 12px; font-size: 17px; }
.intro { margin: 10px 0 28px; color: var(--color-muted); font-size: 14px; }
.mode-section { padding: 18px; margin: 0 0 30px; border: 1px solid #dbeafe; border-radius: 14px; background: var(--color-surface-soft); }
.mode-actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
.mode-actions button { min-height: 62px; padding: 9px 12px; text-align: left; border: 1px solid var(--color-border); border-radius: 10px; background: white; color: var(--color-text); cursor: pointer; }
.mode-actions button.selected { border-color: var(--color-primary); box-shadow: inset 0 0 0 1px var(--color-primary); }
.mode-actions button:disabled, .primary-action:disabled { opacity: .55; cursor: wait; }
.mode-actions span { display: block; font-size: 12px; color: var(--color-muted); }
.mode-note { margin: 12px 0 0; font-size: 13px; color: var(--color-secondary); }
.field-error { color: #c24136; font-size: 13px; }
.primary-action { width: 100%; min-height: 52px; margin-top: 30px; border: 0; border-radius: 11px; background: var(--color-primary); color: white; font-weight: 700; cursor: pointer; }
@media (max-width: 400px) { .mode-actions { grid-template-columns: 1fr; } }
</style>
