<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { Button, showFailToast, showSuccessToast } from 'vant'
import type { CreateAnswerInput, Question } from '../../services'
import { services, isApiError } from '../../services'

const props = defineProps<{
  question: Question
  submitting?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', input: CreateAnswerInput): void
}>()

const answerText = ref('')
const previewUrl = ref<string>('')
const savedAssetId = ref<string>('')
const onSiteDeclaration = ref(false)
const uploading = ref(false)
let disposed = false

const presetText = props.question.demoScenarioId
  ? '我今天路过看到了。参照照片里的样子还在，只是有一点变化。'
  : ''

function applyPreset(): void {
  answerText.value = presetText
}

onUnmounted(() => {
  disposed = true
  if (previewUrl.value) {
    services.asset.revokeObjectUrl(previewUrl.value)
    previewUrl.value = ''
  }
})

function triggerFileInput(): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/jpeg,image/jpg,image/png,image/webp'
  input.onchange = () => {
    const file = input.files?.[0]
    if (file) handleFile(file)
  }
  input.click()
}

/**
 * 上传/替换照片：
 * 1. 不提前释放旧预览，避免失败时旧照片丢失
 * 2. 上传期间禁用提交按钮
 * 3. 上传成功后才更新 savedAssetId 和 previewUrl
 * 4. 上传成功后才释放旧 objectUrl
 * 5. 失败时保留旧照片和旧 assetId
 */
async function handleFile(file: File): Promise<void> {
  if (disposed) return
  uploading.value = true

  const oldPreviewUrl = previewUrl.value
  const oldAssetId = savedAssetId.value

  try {
    // 1. 先把图片存进 IndexedDB，拿到新 assetId
    const asset = await services.asset.saveImage(file)
    if (disposed) return

    // 2. 用 Asset API 生成新的 objectUrl
    const newUrl = await services.asset.getObjectUrl(asset.id)
    if (disposed) {
      services.asset.revokeObjectUrl(newUrl)
      return
    }

    // 3. 到这里，新照片完全就绪，才更新状态
    savedAssetId.value = asset.id
    previewUrl.value = newUrl

    // 4. 释放旧的 objectUrl（如果和新 URL 不同）
    if (oldPreviewUrl && oldPreviewUrl !== newUrl) {
      services.asset.revokeObjectUrl(oldPreviewUrl)
    }

    showSuccessToast('照片已准备好')
  } catch (e) {
    if (disposed) return
    // 失败：保留旧 previewUrl 和旧 savedAssetId
    savedAssetId.value = oldAssetId
    previewUrl.value = oldPreviewUrl

    showFailToast(isApiError(e) ? e.message : e instanceof Error ? e.message : '照片处理失败')
  } finally {
    if (!disposed) uploading.value = false
  }
}

function handleSubmit(): void {
  if (uploading.value) {
    showFailToast('照片正在处理中，请稍候')
    return
  }
  if (!savedAssetId.value) {
    showFailToast('请上传一张现场照片')
    return
  }
  if (!answerText.value.trim()) {
    showFailToast('请写下你的回答')
    return
  }
  if (!onSiteDeclaration.value) {
    showFailToast('请勾选现场拍摄声明')
    return
  }

  emit('submit', {
    photoAssetId: savedAssetId.value,
    text: answerText.value.trim(),
    onSiteDeclaration: true,
  })
}
</script>

<template>
  <div class="answer-composer">
    <!-- 预制回答快捷入口 -->
    <div v-if="presetText" class="preset-banner">
      <p>这是预制故事，可以先使用演示文案再修改。</p>
      <button type="button" class="preset-btn" @click="applyPreset">
        填入演示回答
      </button>
    </div>

    <!-- 照片上传 -->
    <div class="field">
      <label class="field-label">📸 带回现场影像 <span aria-hidden="true">*</span></label>
      <button
        type="button"
        class="upload-btn"
        :disabled="uploading || submitting"
        @click="triggerFileInput"
      >
        <img v-if="previewUrl" :src="previewUrl" class="preview" alt="现场照片" />
        <div v-else class="upload-placeholder">
          <span class="plus">+</span>
          <span>{{ uploading ? '处理中…' : '点击上传现场照片' }}</span>
        </div>
      </button>
      <p v-if="uploading" class="upload-hint">照片处理中，请稍候…</p>
    </div>

    <!-- 文字回答 -->
    <div class="field">
      <label class="field-label">✍️ 你的回答 <span aria-hidden="true">*</span></label>
      <textarea
        v-model="answerText"
        class="custom-textarea"
        rows="4"
        placeholder="例如：冰淇淋店还在！而且多了一个新口味…"
      />
    </div>

    <!-- 现场声明 -->
    <label class="declaration-row">
      <input v-model="onSiteDeclaration" type="checkbox" />
      <span>我声明这张照片是我在现场拍摄的</span>
    </label>
    <p class="declaration-tip">
      平台不验证真实性，这条声明只由旅行者本人承诺。
    </p>

    <Button
      type="primary"
      size="large"
      block
      :disabled="uploading || submitting"
      @click="handleSubmit"
    >
      <template v-if="submitting">寄出中…</template>
      <template v-else-if="uploading">照片处理中…</template>
      <template v-else>📮 寄出这封回信</template>
    </Button>
  </div>
</template>

<style scoped>
.answer-composer {
  display: grid;
  gap: 24px;
}

.preset-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #DEEBFF;
  border-radius: 10px;
  background: var(--color-surface-soft);
  font-size: 13px;
  color: var(--color-text);
}

.preset-banner p {
  margin: 0;
}

.preset-btn {
  flex-shrink: 0;
  padding: 6px 12px;
  border: none;
  border-radius: 8px;
  background: var(--color-primary);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.preset-btn:hover {
  filter: brightness(0.95);
}

.field {
  display: grid;
  gap: 8px;
}

.field-label {
  font-size: 14px;
  font-weight: 650;
  color: var(--color-text);
}

.field-label span {
  color: #c24136;
}

.upload-btn {
  width: 200px;
  height: 200px;
  border: 2px dashed var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  overflow: hidden;
  transition: border-color 0.2s ease;
}

.upload-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
}

.upload-btn:disabled {
  cursor: wait;
  opacity: 0.7;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--color-muted);
  font-size: 14px;
}

.plus {
  font-size: 44px;
  font-weight: 200;
  line-height: 1;
  margin-bottom: 8px;
  color: var(--color-border);
}

.preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-hint {
  margin: 0;
  font-size: 12px;
  color: var(--color-primary);
}

.custom-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  color: var(--color-text);
  background: var(--color-surface);
  resize: vertical;
  box-sizing: border-box;
  line-height: 1.7;
}

.custom-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  outline: 2px solid #bfdbfe;
}

.declaration-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--color-text);
  cursor: pointer;
}

.declaration-row input {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
}

.declaration-tip {
  margin: -16px 0 0;
  font-size: 12px;
  color: var(--color-muted);
  padding-left: 28px;
}
</style>
