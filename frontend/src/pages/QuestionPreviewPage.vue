<script setup lang="ts">
import { onBeforeMount, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { services, isApiError, type Question } from '../services'
import { useQuestionDraftStore } from '../stores/questionDraft'

const router = useRouter()
const store = useQuestionDraftStore()
const { draft } = storeToRefs(store)
const photoUrl = ref('')
const publishing = ref(false)
const publishError = ref('')
const published = ref<Question | null>(null)
let photoVersion = 0

onBeforeMount(() => {
  if (!store.previewReady) void router.replace('/questions/new')
})

watch(() => draft.value.referenceAssetId, async (assetId) => {
  const version = ++photoVersion
  const previous = photoUrl.value
  photoUrl.value = ''
  if (previous) services.asset.revokeObjectUrl(previous)
  if (!assetId || !store.previewReady) return
  try {
    const url = await services.asset.getObjectUrl(assetId)
    if (version !== photoVersion) {
      services.asset.revokeObjectUrl(url)
      return
    }
    photoUrl.value = url
  } catch (error) {
    publishError.value = isApiError(error) ? error.message : '参照照片无法读取，请返回重新选择'
  }
}, { immediate: true })

onBeforeUnmount(() => {
  photoVersion++
  if (photoUrl.value) services.asset.revokeObjectUrl(photoUrl.value)
})

async function publish(): Promise<void> {
  if (publishing.value || published.value) return
  publishing.value = true
  publishError.value = ''
  try {
    published.value = await services.question.create({
      ...draft.value,
      location: { ...draft.value.location },
      answerWindow: { ...draft.value.answerWindow },
    })
    store.reset()
  } catch (error) {
    if (isApiError(error) && error.field) {
      store.errors[error.field] = error.message
      void router.push('/questions/new')
    } else {
      publishError.value = isApiError(error) ? error.message : '发布失败，请稍后重试'
    }
  } finally {
    publishing.value = false
  }
}
</script>

<template>
  <main v-if="store.previewReady || published" class="preview-page page-content">
    <template v-if="published">
      <p class="eyebrow">发布完成</p>
      <h1>问题已发布</h1>
      <p class="intro">你留下的问题已经保存。</p>
      <h2>{{ published.title }}</h2>
      <p class="published-id">问题编号：{{ published.id }}</p>
      <button class="primary-action" type="button" @click="router.replace('/me')">返回</button>
    </template>
    <template v-else>
      <p class="eyebrow">发布前再看一遍</p>
      <h1>发布预览</h1>
      <p class="intro">确认照片、地点和时间都准确后再发布。</p>
      <article class="preview-card">
        <img v-if="photoUrl" :src="photoUrl" alt="参照照片" class="photo" />
        <div v-else class="photo-loading">正在读取参照照片…</div>
        <div class="preview-copy">
          <p v-if="draft.demoScenarioId" class="demo-label">预制故事 · 演示素材</p>
          <p class="location">{{ draft.location.cityName }} · {{ draft.location.poiName }}</p>
          <h2>{{ draft.title }}</h2>
          <p class="description">{{ draft.description }}</p>
          <div class="window"><span>期待回信</span><strong>{{ draft.answerWindow.startDate }} — {{ draft.answerWindow.endDate }}</strong></div>
          <div v-if="draft.shootingGuide?.trim()" class="guide"><strong>拍摄建议</strong><p>{{ draft.shootingGuide }}</p></div>
        </div>
      </article>
      <p v-if="publishError" class="field-error" role="alert">{{ publishError }}</p>
      <div class="actions">
        <button type="button" class="secondary-action" @click="router.push('/questions/new')">返回修改</button>
        <button type="button" class="primary-action" :disabled="publishing || !photoUrl" @click="publish">{{ publishing ? '正在发布…' : '确认发布' }}</button>
      </div>
    </template>
  </main>
</template>

<style scoped>
h1 { margin: 0; font-size: 30px; line-height: 1.3; }
.intro { margin: 10px 0 26px; color: var(--color-muted); font-size: 14px; }
.preview-card { overflow: hidden; border: 1px solid var(--color-border); border-radius: 14px; background: white; }
.photo, .photo-loading { display: block; width: 100%; aspect-ratio: 4 / 3; max-height: 400px; object-fit: cover; background: var(--color-surface-soft); }
.photo-loading { display: grid; place-items: center; color: var(--color-muted); }
.preview-copy { padding: 21px; }
.demo-label { margin: 0 0 10px; color: var(--color-primary); font-size: 12px; }
.location { margin: 0 0 12px; color: var(--color-primary); font-size: 14px; font-weight: 650; }
h2 { margin: 0; font-size: 25px; line-height: 1.4; overflow-wrap: anywhere; }
.description, .guide p { white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.8; }
.description { margin: 14px 0 20px; color: var(--color-secondary); font-size: 15px; }
.window { display: flex; flex-wrap: wrap; gap: 8px 12px; padding: 13px; border: 1px solid #dbeafe; border-radius: 11px; background: var(--color-surface-soft); font-size: 14px; }
.window strong { min-width: 0; overflow-wrap: anywhere; }
.guide { margin-top: 20px; font-size: 14px; }
.guide p { margin: 5px 0 0; }
.actions { display: flex; gap: 10px; margin-top: 20px; }
.actions button, .primary-action { flex: 1; min-height: 52px; padding: 8px 12px; border-radius: 11px; font-weight: 700; cursor: pointer; }
.primary-action { border: 1px solid var(--color-primary); background: var(--color-primary); color: white; }
.primary-action:disabled { opacity: .55; cursor: wait; }
.secondary-action { border: 1px solid var(--color-border); background: white; color: var(--color-text); }
.field-error { margin: 14px 0 0; color: #c24136; font-size: 13px; }
.published-id { color: var(--color-muted); font-size: 12px; overflow-wrap: anywhere; }
@media (max-width: 350px) { .actions { flex-direction: column; } }
</style>
