<script setup lang="ts">
import type { DateWindow } from '../../services/contracts'

const props = defineProps<{ modelValue: DateWindow; errors?: Record<string, string> }>()
const emit = defineEmits<{ 'update:modelValue': [value: DateWindow] }>()

function update(field: keyof DateWindow, event: Event): void {
  emit('update:modelValue', { ...props.modelValue, [field]: (event.target as HTMLInputElement).value })
}
</script>

<template>
  <div class="date-fields">
    <label for="window-start">回答开始日期 <span aria-hidden="true">*</span></label>
    <input id="window-start" type="date" :value="modelValue.startDate" :aria-invalid="Boolean(errors?.['answerWindow.startDate'] || errors?.answerWindow)" @input="update('startDate', $event)" />
    <p v-if="errors?.['answerWindow.startDate'] || errors?.answerWindow" class="field-error" role="alert">{{ errors['answerWindow.startDate'] || errors.answerWindow }}</p>
    <label for="window-end">回答结束日期 <span aria-hidden="true">*</span></label>
    <input id="window-end" type="date" :value="modelValue.endDate" :aria-invalid="Boolean(errors?.['answerWindow.endDate'] || errors?.answerWindow)" @input="update('endDate', $event)" />
    <p v-if="errors?.['answerWindow.endDate']" class="field-error" role="alert">{{ errors['answerWindow.endDate'] }}</p>
  </div>
</template>

<style scoped>
.date-fields { display: grid; gap: 8px; }
.date-fields label:not(:first-child) { margin-top: 10px; }
label { font-weight: 650; font-size: 14px; }
label span { color: #c24136; }
input { width: 100%; min-width: 0; min-height: 48px; padding: 10px 13px; border: 1px solid var(--color-border); border-radius: 10px; background: white; color: var(--color-text); }
.field-error { color: #c24136; font-size: 13px; margin: 0; }
</style>
