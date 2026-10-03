<script setup lang="ts">

defineProps<{
  /** 当前模式 */
  mode: 'nationwide' | 'trip'
  /** 是否允许切到行程匹配 */
  canMatch: boolean
  disabledHint: string
}>()

const emit = defineEmits<{
  (e: 'update:mode', mode: 'nationwide' | 'trip'): void
}>()
</script>

<template>
  <div class="match-mode-bar">
    <div class="modes" role="tablist">
      <button
        type="button"
        role="tab"
        class="mode-tab"
        :class="{ active: mode === 'nationwide' }"
        :aria-selected="mode === 'nationwide'"
        @click="emit('update:mode', 'nationwide')"
      >
        全国发现
      </button>
      <button
        type="button"
        role="tab"
        class="mode-tab"
        :class="{ active: mode === 'trip', disabled: !canMatch }"
        :aria-selected="mode === 'trip'"
        :disabled="!canMatch"
        :aria-describedby="canMatch ? undefined : 'match-hint'"
        @click="canMatch && emit('update:mode', 'trip')"
      >
        匹配我的行程
      </button>
    </div>
  </div>

  <p v-if="!canMatch" id="match-hint" class="match-hint">
    {{ disabledHint }}
  </p>
</template>

<style scoped>
.match-mode-bar {
  margin: 0 18px;
  border-bottom: 1px solid var(--color-border);
}

.modes {
  display: flex;
  align-items: center;
  gap: 24px;
}

.mode-tab {
  position: relative;
  padding: 10px 0;
  border: none;
  background: transparent;
  color: var(--color-muted);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s ease;
}

.mode-tab:hover:not(.disabled) {
  color: var(--color-primary);
}

.mode-tab.active {
  color: var(--color-text);
  font-weight: 700;
}

.mode-tab.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 3px;
  background: var(--color-primary);
  border-radius: 2px;
}

.mode-tab.disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.match-hint {
  font-size: 13px;
  color: var(--color-muted);
  margin: 12px 18px 16px;
}
</style>
