<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useQuestionDraftStore } from '../../stores/questionDraft'
import ImageUploader from './ImageUploader.vue'
import LocationPicker from './LocationPicker.vue'
import TimeWindowPicker from './TimeWindowPicker.vue'

const emit = defineEmits<{ saving: [value: boolean] }>()
const store = useQuestionDraftStore()
const { draft, errors } = storeToRefs(store)

function updateTitle(event: Event): void {
  draft.value.title = (event.target as HTMLInputElement).value
  store.clearError('title')
}
function updateDescription(event: Event): void {
  draft.value.description = (event.target as HTMLTextAreaElement).value
  store.clearError('description')
}
function updateGuide(event: Event): void {
  draft.value.shootingGuide = (event.target as HTMLTextAreaElement).value
  store.clearError('shootingGuide')
}
</script>

<template>
  <div class="question-form">
    <div class="field">
      <label for="question-title">问题标题 <span aria-hidden="true">*</span></label>
      <input id="question-title" :value="draft.title" :aria-invalid="Boolean(errors.title)" placeholder="用一句话说出你想知道的后来" @input="updateTitle" />
      <p v-if="errors.title" class="field-error" role="alert">{{ errors.title }}</p>
    </div>
    <div class="field">
      <label for="question-description">详细问题 <span aria-hidden="true">*</span></label>
      <textarea id="question-description" :value="draft.description" :aria-invalid="Boolean(errors.description)" rows="5" placeholder="讲讲这张照片和你想请未来旅行者确认的事" @input="updateDescription" />
      <p v-if="errors.description" class="field-error" role="alert">{{ errors.description }}</p>
    </div>
    <div class="field">
      <p class="field-label">参照照片 <span aria-hidden="true">*</span></p>
      <ImageUploader :asset-id="draft.referenceAssetId" :locked="Boolean(draft.demoScenarioId)" :error="errors.referenceAssetId" @change="draft.referenceAssetId = $event; store.clearError('referenceAssetId')" @error="errors.referenceAssetId = $event" @saving="emit('saving', $event)" />
    </div>
    <div class="field">
      <LocationPicker :model-value="draft.location" :locked="Boolean(draft.demoScenarioId)" :errors="errors" @update:model-value="draft.location = $event; store.clearError('location.cityCode'); store.clearError('location.poiId'); store.clearError('location')" />
    </div>
    <div class="field">
      <TimeWindowPicker :model-value="draft.answerWindow" :errors="errors" @update:model-value="draft.answerWindow = $event; store.clearError('answerWindow'); store.clearError('answerWindow.startDate'); store.clearError('answerWindow.endDate')" />
    </div>
    <div class="field">
      <label for="shooting-guide">拍摄建议 <small>选填</small></label>
      <p v-if="errors.shootingGuide" class="field-error" role="alert">{{ errors.shootingGuide }}</p>
      <textarea id="shooting-guide" :aria-invalid="Boolean(errors.shootingGuide)" :value="draft.shootingGuide" rows="3" placeholder="例如：从树的南侧拍摄" @input="updateGuide" />
    </div>
  </div>
</template>

<style scoped>
.question-form { display: grid; gap: 22px; }
.field { display: grid; gap: 8px; min-width: 0; }
label, .field-label { margin: 0; font-size: 14px; font-weight: 650; }
label span, .field-label span { color: #c24136; }
small { margin-left: 5px; font-size: 12px; font-weight: 400; color: var(--color-muted); }
input, textarea { display: block; width: 100%; min-width: 0; padding: 11px 13px; border: 1px solid var(--color-border); border-radius: 10px; background: white; color: var(--color-text); }
input { min-height: 48px; }
textarea { resize: vertical; line-height: 1.6; }
input:focus, textarea:focus { border-color: var(--color-primary); outline: 2px solid #bfdbfe; }
.field-error { margin: 0; color: #c24136; font-size: 13px; }
</style>
