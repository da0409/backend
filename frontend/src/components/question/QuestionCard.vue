<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Button, Icon } from 'vant'
import type { QuestionSummary } from '../../services'
import { services } from '../../services'

const props = defineProps<{
  item: QuestionSummary
  /** 当前用户 ID，用于判断是否为本人发布 */
  currentUserId: string
  /** 是否显示“领取任务”按钮（匹配流里显示，发现流不显示） */
  claimable?: boolean
}>()

const emit = defineEmits<{
  (e: 'claim', questionId: string): void
}>()

const referenceUrl = ref<string>('')

onMounted(async () => {
  if (props.item.referenceAsset?.id) {
    try {
      referenceUrl.value = await services.asset.getObjectUrl(
        props.item.referenceAsset.id,
      )
    } catch {
      referenceUrl.value = ''
    }
  }
})

onUnmounted(() => {
  if (referenceUrl.value) {
    services.asset.revokeObjectUrl(referenceUrl.value)
  }
})

function formatDateRange(start: string, end: string): string {
  const s = start.replaceAll('-', '.')
  const e = end.replaceAll('-', '.')
  return `${s} – ${e}`
}

const isOwn = () => props.item.question.authorId === props.currentUserId
</script>

<template>
  <article class="question-card" :aria-labelledby="`q-${item.question.id}`">
    <RouterLink :to="`/questions/${item.question.id}`" :aria-label="`查看问题：${item.question.title}`" class="photo-link">
      <figure class="reference-figure">
        <img
          v-if="referenceUrl"
          :src="referenceUrl"
          :alt="`${item.question.location.poiName} 的参照照片`"
        />
        <div v-else class="reference-placeholder" aria-hidden="true" />
      </figure>
    </RouterLink>

    <div class="card-body">
      <p class="location">
        <Icon name="location-o" aria-hidden="true" />
        {{ item.question.location.poiName }}
        <span class="city-tag">{{ item.question.location.cityName }}</span>
      </p>

      <h2 :id="`q-${item.question.id}`" class="title">
        <RouterLink :to="`/questions/${item.question.id}`">{{ item.question.title }}</RouterLink>
      </h2>

      <p class="description">{{ item.question.description }}</p>

      <div class="window">
        <span class="window-label">
          <Icon name="calendar-o" aria-hidden="true" />期待回信
        </span>
        <span class="window-dates">
          <time :datetime="item.question.answerWindow.startDate">
            {{ formatDateRange(item.question.answerWindow.startDate, item.question.answerWindow.endDate) }}
          </time>
        </span>
      </div>

      <div class="card-footer">
        <p v-if="item.answerCount > 0" class="answer-count">
          已有 {{ item.answerCount }} 条回信
        </p>
        <p v-else class="answer-count muted">还没有人回答</p>

        <Button
          v-if="claimable"
          v-show="!isOwn()"
          size="small"
          type="primary"
          @click="emit('claim', item.question.id)"
        >
          领取任务
        </Button>
        <p v-if="claimable && isOwn()" class="own-hint">
          这是你自己发布的问题，不能领取
        </p>
      </div>
    </div>
  </article>
</template>

<style scoped>
.question-card {
  background: var(--color-surface);
  margin-bottom: 24px;
}

.photo-link { display: block; }
.title a:hover { color: var(--color-primary); }

.reference-figure {
  margin: 0 3px;
}

.reference-figure img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 4 / 3;
  max-height: 420px;
  object-fit: cover;
  border-radius: 14px;
}

.reference-placeholder {
  width: 100%;
  aspect-ratio: 4 / 3;
  max-height: 420px;
  border-radius: 14px;
  background: var(--color-surface-soft);
}

.card-body {
  padding: 18px 20px 4px;
}

.location {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  color: var(--color-primary);
  margin: 0 0 18px;
}

.location :deep(.van-icon) {
  font-size: 19px;
}

.city-tag {
  padding: 1px 8px;
  border-radius: 5px;
  background: var(--color-surface-soft);
  color: var(--color-secondary);
  font-size: 12px;
  font-weight: 500;
}

.title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: -0.02em;
  color: var(--color-text);
}

.description {
  color: var(--color-muted);
  font-size: 15px;
  margin: 14px 0 20px;
  line-height: 1.8;
}

.window {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #DEEBFF;
  border-radius: 12px;
  background: var(--color-surface-soft);
  box-shadow: var(--shadow-soft);
  font-size: 14px;
}

.window-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  color: var(--color-text);
}

.window-label :deep(.van-icon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: #E3EEFF;
  font-size: 21px;
  color: var(--color-primary);
}

.window-dates {
  border-left: 1px solid #BED3F5;
  padding-left: 12px;
  font-family: ui-monospace, 'SFMono-Regular', Consolas, monospace;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--color-text);
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 0;
}

.answer-count {
  margin: 0;
  font-size: 13px;
  color: var(--color-text);
}

.answer-count.muted {
  color: var(--color-muted);
}

.own-hint {
  margin: 0;
  color: var(--color-muted);
  font-size: 13px;
  font-style: italic;
}

@media (max-width: 359px) {
  .window-dates {
    flex-basis: 100%;
    border-left: 0;
    border-top: 1px solid #BED3F5;
    padding: 10px 0 0;
  }
}
</style>
