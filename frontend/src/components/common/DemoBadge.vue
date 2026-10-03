<script setup lang="ts">
withDefaults(defineProps<{ label?: string }>(), { label: '演示预览' })
</script>

<template>
  <span class="demo-badge">{{ label }}</span>
</template>
