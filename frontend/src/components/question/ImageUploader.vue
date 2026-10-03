<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { services, isApiError } from '../../services'

const props = defineProps<{ assetId: string; locked?: boolean; error?: string }>()
const emit = defineEmits<{ change: [assetId: string]; error: [message: string]; saving: [value: boolean] }>()
const imageUrl = ref('')
const saving = ref(false)
let requestVersion = 0

watch(() => props.assetId, async (assetId) => {
  const version = ++requestVersion
  const previous = imageUrl.value
  imageUrl.value = ''
  if (previous) services.asset.revokeObjectUrl(previous)
  if (!assetId) return
  try {
    const url = await services.asset.getObjectUrl(assetId)
    if (version !== requestVersion) {
      services.asset.revokeObjectUrl(url)
      return
    }
    imageUrl.value = url
  } catch (error) {
    if (version === requestVersion) emit('error', isApiError(error) ? error.message : '图片读取失败，请重新选择')
  }
}, { immediate: true })

onBeforeUnmount(() => {
  requestVersion++
  if (imageUrl.value) services.asset.revokeObjectUrl(imageUrl.value)
})

async function selectImage(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  saving.value = true
  emit('saving', true)
  try {
    const asset = await services.asset.saveImage(file)
    emit('change', asset.id)
  } catch (error) {
    emit('error', isApiError(error) ? error.message : '图片保存失败，请重试')
  } finally {
    saving.value = false
    emit('saving', false)
  }
}
</script>

<template>
  <div class="image-uploader">
    <img v-if="imageUrl" :src="imageUrl" alt="参照照片预览" class="photo" />
    <div v-else class="empty-photo">{{ saving ? '正在保存图片…' : '选择一张参照照片' }}</div>
    <p v-if="locked" class="hint">预制故事的参照照片已锁定 · 演示素材</p>
    <label v-else class="image-button">
      {{ assetId ? '更换照片' : '选择照片' }}
      <input type="file" accept="image/jpeg,image/png,image/webp" :disabled="saving" @change="selectImage" />
    </label>
    <p v-if="error" class="field-error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.photo, .empty-photo { display: block; width: 100%; aspect-ratio: 4 / 3; max-height: 360px; object-fit: cover; border-radius: 12px; background: var(--color-surface-soft); }
.empty-photo { display: grid; place-items: center; color: var(--color-muted); border: 1px dashed #bed3f5; }
.image-button { position: relative; display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 0 18px; margin-top: 12px; border: 1px solid var(--color-primary); border-radius: 10px; color: var(--color-primary); font-weight: 600; cursor: pointer; }
.image-button input { position: absolute; inset: 0; width: 100%; opacity: 0; cursor: pointer; }
.image-button:focus-within { outline: 2px solid var(--color-primary); outline-offset: 3px; }
.hint { color: var(--color-muted); font-size: 13px; margin: 9px 0 0; }
.field-error { color: #c24136; font-size: 13px; margin: 7px 0 0; }
</style>
