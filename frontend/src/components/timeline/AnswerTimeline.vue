<script setup lang="ts">
import type { AnswerSort, QuestionDetail } from '../../services/contracts'

defineProps<{
  answers: QuestionDetail['answers']
  imageUrls: Record<string, string>
  imageErrors: Record<string, boolean>
  canManageSatisfaction: boolean
  actionPending: boolean
  sort: AnswerSort
}>()

defineEmits<{
  sort: [sort: AnswerSort]
  satisfy: [answerId: string, satisfied: boolean]
  imageError: [assetId: string]
}>()

function submittedLabel(instant: string): string {
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(instant))
}
</script>

<template>
  <section class="timeline" aria-labelledby="timeline-title">
    <div class="timeline-heading">
      <h2 id="timeline-title">回答时间线 <span>({{ answers.length }})</span></h2>
      <div class="sort-actions" aria-label="回答排序">
        <button type="button" :aria-pressed="sort === 'oldest'" @click="$emit('sort', 'oldest')">从早到晚</button>
        <button type="button" :aria-pressed="sort === 'newest'" @click="$emit('sort', 'newest')">最新优先</button>
      </div>
    </div>
    <p v-if="!answers.length" class="empty">还没有回信。后来到这里的旅行者可以留下第一条观察。</p>
    <ol v-else class="entries">
      <li v-for="answer in answers" :key="answer.id" class="entry">
        <div class="entry-head">
          <strong>{{ answer.author.nickname }}</strong>
          <span v-if="answer.author.isDemo || answer.isSimulated" class="demo-tag">比赛模拟</span>
          <span v-if="answer.isSatisfiedByAuthor" class="satisfied-tag">满意回答</span>
        </div>
        <time :datetime="answer.submittedAt">{{ submittedLabel(answer.submittedAt) }}</time>
        <figure>
          <img v-if="imageUrls[answer.photoAsset.id] && !imageErrors[answer.photoAsset.id]" :src="imageUrls[answer.photoAsset.id]" :alt="`${answer.author.nickname}的现场照片`" @error="$emit('imageError', answer.photoAsset.id)">
          <div v-else class="image-placeholder" role="status">{{ imageErrors[answer.photoAsset.id] ? '现场照片读取失败' : '正在读取现场照片…' }}</div>
          <figcaption>现场新照片 <span v-if="answer.photoAsset.source === 'preset'">· 演示素材</span></figcaption>
        </figure>
        <p class="answer-text">{{ answer.text }}</p>
        <p class="declaration">{{ answer.onSiteDeclaration ? "旅行者声明现场拍摄" : "未提供现场拍摄声明" }}</p>
        <button v-if="canManageSatisfaction" type="button" class="satisfy-action" :disabled="actionPending" @click="$emit('satisfy', answer.id, !answer.isSatisfiedByAuthor)">
          {{ answer.isSatisfiedByAuthor ? '取消满意' : '标记满意' }}
        </button>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.timeline { margin-top: 32px; border-top: 1px solid var(--color-border); padding-top: 24px; }
.timeline-heading { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
h2 { margin: 0; font-size: 22px; }
h2 span { color: var(--color-muted); font-size: 16px; }
.sort-actions { display: flex; gap: 4px; padding: 3px; border-radius: 10px; background: var(--color-surface-soft); }
.sort-actions button { border: 0; border-radius: 8px; background: transparent; padding: 8px; min-height: 40px; color: var(--color-secondary); cursor: pointer; font-size: 12px; }
.sort-actions button[aria-pressed="true"] { background: white; color: var(--color-primary); font-weight: 700; }
.empty { padding: 28px 0; color: var(--color-muted); font-size: 14px; }
.entries { list-style: none; margin: 22px 0 0; padding: 0 0 0 17px; border-left: 2px solid #dbeafe; }
.entry { position: relative; margin: 0 0 28px; padding: 0 0 26px 17px; border-bottom: 1px solid var(--color-border); min-width: 0; }
.entry::before { content: ''; position: absolute; left: -24px; top: 6px; width: 10px; height: 10px; border-radius: 50%; background: var(--color-primary); border: 3px solid white; box-sizing: content-box; }
.entry-head { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; font-size: 14px; }
.demo-tag, .satisfied-tag { border-radius: 5px; padding: 2px 6px; font-size: 11px; font-weight: 600; }
.demo-tag { background: var(--color-surface-soft); color: var(--color-primary); }
.satisfied-tag { background: #e7f7ee; color: #137547; }
time { display: block; margin: 4px 0 12px; color: var(--color-muted); font-size: 12px; }
figure { margin: 0; }
img, .image-placeholder { display: block; width: 100%; aspect-ratio: 4 / 3; max-height: 420px; object-fit: cover; border-radius: 12px; background: var(--color-surface-soft); }
.image-placeholder { display: grid; place-items: center; padding: 12px; color: var(--color-muted); font-size: 13px; }
figcaption { margin-top: 6px; color: var(--color-secondary); font-size: 12px; }
.answer-text { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 15px; line-height: 1.8; }
.declaration { color: var(--color-muted); font-size: 12px; }
.satisfy-action { min-height: 44px; padding: 7px 14px; border: 1px solid var(--color-primary); border-radius: 9px; background: white; color: var(--color-primary); font-weight: 650; cursor: pointer; }
.satisfy-action:disabled { opacity: .5; cursor: wait; }
</style>
