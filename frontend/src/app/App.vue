<script setup lang="ts">
import AuthGate from '../components/common/AuthGate.vue'
import AppShell from './AppShell.vue'
</script>

<template>
  <AuthGate><AppShell>
    <RouterView />
  </AppShell></AuthGate>
</template>
