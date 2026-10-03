<script setup lang="ts">
import { isRestMode } from '../../services'
import RestLocationPicker from './RestLocationPicker.vue'
import type { LocationRef } from '../../services/contracts'

const props = defineProps<{ modelValue: LocationRef; locked?: boolean; errors?: Record<string, string> }>()
const emit = defineEmits<{ 'update:modelValue': [value: LocationRef] }>()

function updateCity(event: Event): void {
  const cityName = (event.target as HTMLInputElement).value
  // 当前契约没有地点查询。手填地点用确定性文本键，等待后续统一地点来源。
  emit('update:modelValue', { cityCode: cityName.trim().normalize('NFKC'), cityName, poiId: '', poiName: '' })
}

function updatePoi(event: Event): void {
  const poiName = (event.target as HTMLInputElement).value
  emit('update:modelValue', { ...props.modelValue, poiId: poiName.trim().normalize('NFKC'), poiName })
}
</script>

<template>
  <RestLocationPicker v-if="isRestMode" :model-value="modelValue" :errors="errors" @update:model-value="emit('update:modelValue', $event)" />
  <div v-else class="location-fields">
    <label for="question-city">城市 <span aria-hidden="true">*</span></label>
    <input id="question-city" :value="modelValue.cityName" :readonly="locked" :aria-invalid="Boolean(errors?.['location.cityCode'])" placeholder="例如：上海" @input="updateCity" />
    <p v-if="errors?.['location.cityCode']" class="field-error" role="alert">{{ errors['location.cityCode'] }}</p>
    <label for="question-poi">具体地点 / POI <span aria-hidden="true">*</span></label>
    <input id="question-poi" :value="modelValue.poiName" :readonly="locked" :aria-invalid="Boolean(errors?.['location.poiId'] || errors?.location)" placeholder="例如：静安公园许愿树" @input="updatePoi" />
    <p v-if="errors?.['location.poiId'] || errors?.location" class="field-error" role="alert">{{ errors['location.poiId'] || errors.location }}</p>
    <p v-if="locked" class="hint">预制故事的地点已锁定</p>
    <p v-else class="hint">填写具体地点；当前版本暂不提供地图搜索。</p>
  </div>
</template>

<style scoped>
.location-fields { display: grid; gap: 8px; }
.location-fields label:not(:first-child) { margin-top: 10px; }
label { font-weight: 650; font-size: 14px; }
label span { color: #c24136; }
input { width: 100%; min-width: 0; min-height: 48px; padding: 10px 13px; border: 1px solid var(--color-border); border-radius: 10px; background: white; color: var(--color-text); }
input[readonly] { background: var(--color-surface-soft); color: var(--color-secondary); }
.hint { margin: 0; color: var(--color-muted); font-size: 12px; }
.field-error { color: #c24136; font-size: 13px; margin: 0; }
</style>
