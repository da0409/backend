<template>
  <div class="home-container">
    <h1>📍 地点时间胶囊</h1>
    <p>让未来的旅行者，回答你过去的问题。</p>
    <el-button type="primary" @click="goToCreate">创建一个胶囊</el-button>
    <el-button>去探索附近的任务</el-button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToCreate = () => {
  router.push('/create')
}
</script>

<style scoped>
.home-container {
  padding: 50px;
  text-align: center;
}
</style>