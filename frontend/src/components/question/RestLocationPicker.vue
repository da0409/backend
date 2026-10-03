<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { services, isApiError, type LocationRef } from '../../services'
const props = defineProps<{ modelValue: LocationRef; existingOnly?: boolean; errors?: Record<string, string> }>()
const emit = defineEmits<{ 'update:modelValue': [value: LocationRef] }>()
const choices = ref<LocationRef[]>([])
const error = ref('')
const chosen = ref('')
onMounted(async () => {
  try {
    choices.value = await services.location!.list()
    if (choices.value.some(p => p.poiId === props.modelValue.poiId)) chosen.value = props.modelValue.poiId
  } catch (e) { error.value = isApiError(e) ? e.message : '地点列表读取失败' }
})
function select() {
  const location = choices.value.find(p => p.poiId === chosen.value)
  emit('update:modelValue', location ? { ...location } : { cityCode: '', cityName: '', poiName: '', poiId: '' })
}
function text(key: 'cityName' | 'poiName', event: Event) {
  const value = (event.target as HTMLInputElement).value
  emit('update:modelValue', { ...props.modelValue, [key]: value, ...(key === 'cityName' ? { cityCode: value.slice(0, 16) } : { poiId: value }) })
}
function coordinate(key: 'longitude' | 'latitude', event: Event) {
  const value = (event.target as HTMLInputElement).value
  emit('update:modelValue', { ...props.modelValue, [key]: value === '' ? undefined : Number(value) })
}
</script>
<template>
  <div class="rest-location">
    <label>地点
      <select v-model="chosen" @change="select">
        <option value="">{{ existingOnly ? '请选择已有目的地' : '填写新地点' }}</option>
        <option v-for="p in choices" :key="p.poiId" :value="p.poiId">{{ p.cityName }} · {{ p.poiName }}（{{ p.longitude }}, {{ p.latitude }}）</option>
      </select>
    </label>
    <p v-if="errors?.['location.cityCode']" role="alert">{{ errors['location.cityCode'] }}</p>
    <p v-if="errors?.['location.poiId']" role="alert">{{ errors['location.poiId'] }}</p>
    <p v-if="errors?.location" role="alert">{{ errors.location }}</p>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-if="existingOnly && !choices.length">暂无可选地点，请先发布带地点的问题。</p>
    <template v-if="!chosen && !existingOnly">
      <label>城市<input :value="modelValue.cityName" maxlength="64" required @input="text('cityName', $event)" /></label>
      <label>具体地点<input :value="modelValue.poiName" maxlength="128" required @input="text('poiName', $event)" /></label>
      <label>经度<input :value="modelValue.longitude" type="number" min="-180" max="180" step="any" required @input="coordinate('longitude', $event)" /></label>
      <label>纬度<input :value="modelValue.latitude" type="number" min="-90" max="90" step="any" required @input="coordinate('latitude', $event)" /></label>
      <p>请填写地点的 WGS84 经纬度。当前不提供地图搜索；不会根据名称猜测坐标。</p>
    </template>
  </div>
</template>
<style scoped>
.rest-location, label { display: grid; gap: 8px; } .rest-location { gap: 14px; }
input, select { width: 100%; min-height: 44px; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; }
p { margin: 0; font-size: 13px; color: #64748b; } [role=alert] { color: #b91c1c; }
</style>
