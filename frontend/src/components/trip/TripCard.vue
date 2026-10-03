<script setup lang="ts">
import { Icon } from 'vant'
import type { Trip } from '../../services'

const props = defineProps<{
  trip: Trip
  /** 当前是否被选中为 active trip */
  active?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', tripId: string): void
}>()


const sourceLabel = () => (props.trip.source === 'demo' ? '比赛模拟行程' : '手动行程')
</script>

<template>
  <article
    class="trip-card"
    :class="{ 'is-active': active }"
    role="button"
    tabindex="0"
    @click="emit('select', trip.id)"
    @keydown.enter.prevent="emit('select', trip.id)"
    @keydown.space.prevent="emit('select', trip.id)"
  >
    <div class="trip-header">
      <p class="destination">
        <Icon name="location-o" aria-hidden="true" />
        {{ trip.destination.cityName }} · {{ trip.destination.poiName }}
      </p>
      <span class="source-tag" :class="trip.source">{{ sourceLabel() }}</span>
    </div>

    <p class="dates">
      <Icon name="calendar-o" aria-hidden="true" />
      <time :datetime="trip.arrivalDate">{{ trip.arrivalDate }}</time>
      –
      <time :datetime="trip.departureDate">{{ trip.departureDate }}</time>
    </p>

    <p v-if="active" class="active-badge">当前行程</p>
  </article>
</template>

<style scoped>
.trip-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  padding: 16px 18px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.trip-card:hover,
.trip-card:focus-visible {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-soft);
}

.trip-card.is-active {
  border-color: var(--color-primary);
  background: var(--color-surface-soft);
}

.trip-header {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.destination {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 15px;
  font-weight: 650;
  color: var(--color-text);
}

.destination :deep(.van-icon) {
  color: var(--color-primary);
  font-size: 18px;
}

.source-tag {
  padding: 2px 8px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.source-tag.manual {
  background: var(--color-surface-soft);
  color: var(--color-secondary);
}

.source-tag.demo {
  background: #E3EEFF;
  color: var(--color-primary);
}

.dates {
  grid-column: 1;
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-width: 0;
  margin: 0;
  font-size: 13px;
  color: var(--color-muted);
  font-family: ui-monospace, 'SFMono-Regular', Consolas, monospace;
}

.dates :deep(.van-icon) {
  font-size: 16px;
}

.active-badge {
  grid-column: 2;
  grid-row: 2;
  align-self: end;
  justify-self: end;
  margin: 0;
  font-size: 11px;
  color: var(--color-primary);
  font-weight: 650;
  white-space: nowrap;
}
</style>
