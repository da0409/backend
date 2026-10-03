<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button, showConfirmDialog, showFailToast, showSuccessToast } from 'vant'
import type { Claim, QuestionDetail } from '../../services'
import { services, isRestMode, isApiError } from '../../services'

const props = defineProps<{
  detail: QuestionDetail
  currentUserId: string
}>()

const emit = defineEmits<{
  (e: 'claimed', claim: Claim): void
  (e: 'cancelled'): void
  (e: 'continue'): void
}>()

const acting = ref(false)

const isOwn = computed(
  () => props.detail.question.authorId === props.currentUserId,
)

const activeClaim = computed(() => props.detail.currentUserClaim ?? null)

async function handleClaim(): Promise<void> {
  if (acting.value) return
  acting.value = true
  try {
    const claim = await services.claim.create(props.detail.question.id)
    showSuccessToast('领取成功')
    emit('claimed', claim)
  } catch (e) {
    showFailToast(isApiError(e) ? e.message : e instanceof Error ? e.message : '领取失败')
  } finally {
    acting.value = false
  }
}

async function handleCancel(): Promise<void> {
  if (acting.value || !activeClaim.value) return
  try {
    await showConfirmDialog({
      title: '取消领取',
      message: '取消后，你将不再能提交这条问题的回答。确定取消吗？',
      confirmButtonText: '确定取消',
      cancelButtonText: '再想想',
    })
  } catch {
    return
  }

  acting.value = true
  try {
    await services.claim.cancel(activeClaim.value.id)
    showSuccessToast('已取消领取')
    emit('cancelled')
  } catch (e) {
    showFailToast(isApiError(e) ? e.message : e instanceof Error ? e.message : '取消失败')
  } finally {
    acting.value = false
  }
}

function handleContinue(): void {
  emit('continue')
}
</script>

<template>
  <div class="claim-action-bar">
    <p v-if="isOwn" class="disabled-hint">
      这是你自己发布的问题，不能领取。
    </p>

    <template v-else-if="activeClaim?.status === 'active'">
      <p class="claim-status">你已领取这条问题。</p>
      <div class="actions">
        <Button
          type="primary"
          size="large"
          block
          :disabled="acting"
          @click="handleContinue"
        >
          ✍️ 继续写回信
        </Button>
        <button
          v-if="!isRestMode"
          type="button"
          class="link-btn"
          :disabled="acting"
          @click="handleCancel"
        >
          取消领取
        </button>
      </div>
    </template>

    <p v-else-if="!detail.canClaim" class="disabled-hint">该问题已完成领取或已过期，暂不能再次领取。</p>
    <template v-else>
      <Button
        type="primary"
        size="large"
        block
        :disabled="acting"
        @click="handleClaim"
      >
        ✍️ 我去看看，写回信
      </Button>
    </template>
  </div>
</template>

<style scoped>
.claim-action-bar {
  margin-top: 20px;
}

.actions {
  display: grid;
  gap: 12px;
}

.disabled-hint {
  margin: 0;
  padding: 12px 16px;
  border-radius: 10px;
  background: var(--color-surface-soft);
  color: var(--color-muted);
  font-size: 13px;
  text-align: center;
}

.claim-status {
  margin: 0 0 12px;
  padding: 10px 14px;
  border-radius: 10px;
  background: #E3EEFF;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
  text-align: center;
}

.link-btn {
  border: none;
  background: transparent;
  color: var(--color-muted);
  font-size: 13px;
  cursor: pointer;
  padding: 6px;
  text-align: center;
}

.link-btn:hover:not(:disabled) {
  color: #c24136;
  text-decoration: underline;
}

.link-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>