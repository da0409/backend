<template>
  <div class="explore-container">
    <h2>🧭 发现旅行任务</h2>
    <p class="subtitle">载入你的行程，看看目的地有没有过去的疑问等待解答。</p>

    <!-- 我的行程卡片 -->
    <div class="trip-card">
      <h3>我的行程</h3>
      <p v-if="activeTrip" class="active-trip">
        当前行程：{{ activeTrip.destination.cityName }} ·
        {{ activeTrip.arrivalDate }} 至 {{ activeTrip.departureDate }}
        <span v-if="activeTrip.source === 'demo'" class="demo-tag">比赛模拟行程</span>
      </p>
      <p v-else class="no-trip">还没有行程，先载入模拟行程或添加一条。</p>
      <div class="trip-actions">
        <van-button type="primary" size="small" @click="loadAndMatch">
          载入模拟行程并匹配
        </van-button>
        <van-button size="small" @click="openAddTripDialog">
          添加手动行程
        </van-button>
      </div>
    </div>

    <!-- 匹配到的任务列表 -->
    <div class="matched-list">
      <h3>顺路任务（<span class="highlight">{{ matchedQuestions.length }}</span>）</h3>
      <p v-if="matchedQuestions.length === 0" class="empty-tip">
        暂无匹配任务，请先载入行程。
      </p>

      <div
        v-for="item in matchedQuestions"
        :key="item.question.id"
        class="question-item"
      >
        <div class="item-header">
          <h4>
            {{ item.question.location.poiName }}
            <span class="city-tag">{{ item.question.location.cityName }}</span>
          </h4>
        </div>
        <p class="question-text">{{ item.question.description }}</p>
        <div class="item-footer">
          <van-button
            v-if="item.question.authorId !== currentUserId"
            type="success"
            size="small"
            @click="handleClaim(item.question.id)"
          >
            领取任务
          </van-button>
          <div v-else class="own-tip">这是你自己发布的问题，不能领取</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast, showFailToast, showToast } from 'vant'
import { services } from '../services'
import type { Trip, QuestionSummary } from '../services'
import { useActiveTripStore } from '../stores/activeTrip'

const router = useRouter()
const activeTripStore = useActiveTripStore()

const activeTrip = ref<Trip | null>(null)
const matchedQuestions = ref<QuestionSummary[]>([])
const currentUserId = ref<string>('')

onMounted(async () => {
  try {
    const me = await services.session.getCurrentUser()
    currentUserId.value = me.id
  } catch {
    // 忽略：遇到渲染问题时 canClaim 会自然退化
  }

  // 恢复上次选中的行程
  await activeTripStore.loadActiveTrip()
  activeTrip.value = activeTripStore.activeTrip
  if (activeTrip.value) {
    await loadMatchesForActiveTrip()
  }
})

async function loadMatchesForActiveTrip(): Promise<void> {
  if (!activeTrip.value) return
  matchedQuestions.value = await services.match.listForTrip(activeTrip.value.id)
}

async function loadAndMatch(): Promise<void> {
  try {
    // 1. 确保 demo 行程已导入
    const trip = await services.trip.importDemoTrip('sc_xuyuan')
    await services.trip.setActive(trip.id)
    activeTrip.value = trip
    await activeTripStore.loadActiveTrip()

    showSuccessToast(`已载入行程：${trip.destination.cityName}`)

    // 2. 匹配
    matchedQuestions.value = await services.match.listForTrip(trip.id)

    if (matchedQuestions.value.length === 0) {
      showToast(`${trip.destination.cityName} 暂时没有需要解答的胶囊`)
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : '载入行程失败'
    showFailToast(msg)
  }
}

async function handleClaim(questionId: string): Promise<void> {
  try {
    const claim = await services.claim.create(questionId)
    showSuccessToast('领取成功')
    router.push(`/questions/${claim.questionId}/answer`)
  } catch (e) {
    const msg = e instanceof Error ? e.message : '领取失败'
    showFailToast(msg)
  }
}

function openAddTripDialog(): void {
  showToast('添加行程功能开发中')
}
</script>

<style scoped>
.explore-container {
  min-height: 100vh;
  background-color: #FDFBF7;
  padding: 20px;
  font-family: 'Noto Serif SC', 'PingFang SC', serif;
  max-width: 900px;
  margin: 0 auto;
}

.subtitle {
  color: #8C7A6B;
  margin-bottom: 20px;
  font-size: 14px;
}

.trip-card {
  margin-bottom: 24px;
  padding: 16px;
  border: 1px dashed #D1C4B5;
  background: #fff;
  border-radius: 8px;
}

.trip-card h3 {
  margin: 0 0 8px 0;
  color: #4A3C31;
  font-size: 16px;
}

.active-trip {
  color: #4A3C31;
  font-size: 13px;
  margin: 0 0 12px 0;
}

.no-trip {
  color: #999;
  font-size: 13px;
  margin: 0 0 12px 0;
}

.demo-tag {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 6px;
  border: 1px solid #C85A5A;
  color: #C85A5A;
  border-radius: 4px;
  font-size: 11px;
}

.trip-actions {
  display: flex;
  gap: 10px;
}

.matched-list {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  border: 1px dashed #D1C4B5;
}

.matched-list h3 {
  margin: 0 0 12px 0;
  color: #4A3C31;
  font-size: 16px;
}

.highlight {
  color: #C85A5A;
  font-weight: bold;
}

.question-item {
  padding: 12px;
  border-bottom: 1px dashed #eee;
  margin-bottom: 8px;
  transition: all 0.3s ease;
  border-radius: 6px;
}

.question-item:last-child {
  border-bottom: none;
}

.question-item:hover {
  background-color: #FDFBF7;
  box-shadow: 0 2px 10px rgba(139, 115, 85, 0.08);
  transform: translateX(4px);
}

.item-header h4 {
  margin: 0 0 6px 0;
  color: #4A3C31;
  font-size: 15px;
}

.city-tag {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 6px;
  background: #F0F5F2;
  color: #5C7C6E;
  border-radius: 4px;
  font-size: 11px;
}

.question-text {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.own-tip {
  color: #8C7A6B;
  font-size: 12px;
  padding: 6px 0;
  font-style: italic;
}

.empty-tip {
  color: #aaa;
  text-align: center;
  padding: 20px;
  font-size: 13px;
}
</style>