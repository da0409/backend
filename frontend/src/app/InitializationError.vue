<script setup lang="ts">
defineProps<{ message: string }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <main class="initialization-error" role="alert">
    <p class="eyebrow">演示数据暂不可用</p>
    <h1>无法载入时间胶囊</h1>
    <p class="error-message">{{ message }}</p>
    <p class="error-help">重试不会清空当前浏览器保存的演示内容。</p>
    <button type="button" @click="$emit('retry')">重新尝试</button>
  </main>
</template>

<style scoped>
.initialization-error {
  min-height: 100vh;
  min-height: 100dvh;
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: calc(48px + env(safe-area-inset-top, 0px)) 24px calc(48px + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.eyebrow {
  margin: 0 0 12px;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
}

h1 {
  margin: 0;
  font-size: 28px;
  line-height: 1.35;
}

.error-message,
.error-help {
  margin: 16px 0 0;
  color: var(--color-secondary);
}

.error-help {
  font-size: 13px;
}

button {
  align-self: flex-start;
  min-height: 44px;
  margin-top: 28px;
  padding: 0 24px;
  border: 0;
  border-radius: 10px;
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
  font-weight: 600;
}
</style>
