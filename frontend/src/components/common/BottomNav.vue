<script setup lang="ts">
import { Tabbar, TabbarItem } from 'vant'
import { useRouter } from 'vue-router'

const router = useRouter()
const items = [
  { to: '/discover', icon: 'search', label: '发现' },
  { to: '/trips', icon: 'guide-o', label: '行程' },
  { to: '/questions/new', icon: 'add-o', label: '发布' },
  { to: '/me', icon: 'user-o', label: '我的' },
]
</script>

<template>
  <nav aria-label="主导航">
    <Tabbar class="bottom-nav" route safe-area-inset-bottom :border="false">
      <TabbarItem
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        :icon="item.icon"
        @keydown.enter="router.push(item.to)"
        @keydown.space.prevent="router.push(item.to)"
      >{{ item.label }}</TabbarItem>
    </Tabbar>
  </nav>
</template>
