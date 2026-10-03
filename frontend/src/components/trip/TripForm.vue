<script setup lang="ts">
import { reactive, ref } from 'vue'
import { isRestMode } from '../../services'
import RestLocationPicker from '../question/RestLocationPicker.vue'
import type { CreateTripInput } from '../../services'

defineProps<{ saving: boolean; serverError: string }>()

const emit = defineEmits<{
  (e: 'submit', input: CreateTripInput): void
}>()

const form = reactive<CreateTripInput>({
  destination: {
    cityCode: '',
    cityName: '',
    poiId: '',
    poiName: '',
  },
  arrivalDate: '',
  departureDate: '',
  participatesInMatching: true,
})

const error = ref<string>('')

function updateCity(event: Event): void {
  const value = (event.target as HTMLInputElement).value
  form.destination.cityName = value
  form.destination.cityCode = value.trim().normalize('NFKC')
}

function updatePoi(event: Event): void {
  const value = (event.target as HTMLInputElement).value
  form.destination.poiName = value
  form.destination.poiId = value.trim().normalize('NFKC')
}

function handleSubmit(): void {
  error.value = ''
  try {
    // 客户端基础校验，避免无效请求
    if (!form.destination.cityName.trim()) {
      throw new Error('请填写城市')
    }
    if (!form.destination.poiName.trim()) {
      throw new Error('请填写主要地点')
    }
    if (!form.arrivalDate) {
      throw new Error('请选择到达日期')
    }
    if (!form.departureDate) {
      throw new Error('请选择离开日期')
    }
    if (form.arrivalDate > form.departureDate) {
      throw new Error('离开日期不能早于到达日期')
    }
    emit('submit', {
      destination: { ...form.destination },
      arrivalDate: form.arrivalDate,
      departureDate: form.departureDate,
      participatesInMatching: form.participatesInMatching,
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : '提交失败'
  }
}
</script>

<template>
  <form class="trip-form" @submit.prevent="handleSubmit">
    <RestLocationPicker v-if="isRestMode" v-model="form.destination" existing-only />
    <template v-if="!isRestMode"><div class="field">
      <label for="trip-city">目的地城市 <span aria-hidden="true">*</span></label>
      <input
        id="trip-city"
        :value="form.destination.cityName"
        placeholder="例如：上海"
        @input="updateCity"
      />
    </div>

    <div class="field">
      <label for="trip-poi">主要地点 <span aria-hidden="true">*</span></label>
      <input
        id="trip-poi"
        :value="form.destination.poiName"
        placeholder="例如：人民广场"
        @input="updatePoi"
      />
    </div>

    </template>
    <div class="field-row">
      <div class="field">
        <label for="trip-arrival">到达日期 <span aria-hidden="true">*</span></label>
        <input
          id="trip-arrival"
          v-model="form.arrivalDate"
          type="date"
          required
        />
      </div>
      <div class="field">
        <label for="trip-departure">离开日期 <span aria-hidden="true">*</span></label>
        <input
          id="trip-departure"
          v-model="form.departureDate"
          type="date"
          required
        />
      </div>
    </div>

    <label class="checkbox-row">
      <input v-model="form.participatesInMatching" type="checkbox" />
      <span>允许用于行程匹配（推荐开启）</span>
    </label>

    <p v-if="error" class="field-error" role="alert">{{ error }}</p>
    <p v-if="serverError" class="field-error" role="alert">{{ serverError }}</p>

    <button type="submit" class="submit-btn" :disabled="saving">
      {{ saving ? '保存中…' : '保存行程' }}
    </button>
  </form>
</template>

<style scoped>
.trip-form {
  display: grid;
  gap: 22px;
}

.field {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

label {
  margin: 0;
  font-size: 14px;
  font-weight: 650;
}

label span {
  color: #c24136;
}

input {
  display: block;
  width: 100%;
  min-width: 0;
  min-height: 48px;
  padding: 11px 13px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: white;
  color: var(--color-text);
}

input:focus {
  border-color: var(--color-primary);
  outline: 2px solid #bfdbfe;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
}

.checkbox-row input {
  width: 18px;
  height: 18px;
  min-height: 0;
  accent-color: var(--color-primary);
}

.field-error {
  margin: 0;
  color: #c24136;
  font-size: 13px;
}

.submit-btn {
  width: 100%;
  min-height: 50px;
  border: none;
  border-radius: 10px;
  background: var(--color-primary);
  color: #fff;
  font-size: 15px;
  font-weight: 650;
  cursor: pointer;
}

.submit-btn:hover:not(:disabled) {
  filter: brightness(0.95);
}

.submit-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

@media (max-width: 359px) {
  .field-row {
    grid-template-columns: 1fr;
  }
}
</style>
