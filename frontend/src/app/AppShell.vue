<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import BottomNav from '../components/common/BottomNav.vue'

const route = useRoute()
watch(() => route.path, () => window.scrollTo({ top: 0 }), { flush: 'post' })
</script>

<template>
  <div class="app-shell">
    <slot />
    <BottomNav />
  </div>
</template>
