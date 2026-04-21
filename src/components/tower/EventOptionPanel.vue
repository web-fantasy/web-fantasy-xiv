<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useTowerStore } from '@/stores/tower'
import { evaluateRequirement } from '@/tower/events/event-evaluator'
import type { EventDef, EventOptionDef } from '@/tower/types'

interface Props {
  event: EventDef
}

const props = defineProps<Props>()

const emit = defineEmits<{
  resolved: [optionId: string]
}>()

const tower = useTowerStore()

const panelRef = ref<HTMLElement | null>(null)

const ctx = computed(() => ({
  determination: tower.run?.determination ?? 0,
  crystals: tower.run?.crystals ?? 0,
}))

function isAvailable(opt: EventOptionDef): boolean {
  return evaluateRequirement(opt.requires, ctx.value)
}

function onSelect(opt: EventOptionDef) {
  if (!isAvailable(opt)) return
  for (const out of opt.outcomes) {
    tower.applyEventOutcome(out)
  }
  emit('resolved', opt.id)
}

onMounted(async () => {
  await nextTick()
  const firstEnabled = panelRef.value?.querySelector<HTMLButtonElement>('button:not([disabled])')
  firstEnabled?.focus()
})
</script>

<template lang="pug">
.event-modal(@click.self.stop)
  .panel(ref="panelRef" role="dialog" aria-modal="true" aria-labelledby="event-panel-title")
    .panel-title#event-panel-title {{ event.title }}
    .panel-desc {{ event.description }}
    ul.panel-options
      li(v-for="opt in event.options" :key="opt.id")
        button.btn.option(
          type="button"
          :disabled="!isAvailable(opt)"
          :aria-disabled="!isAvailable(opt)"
          @click="onSelect(opt)"
        )
          span.option-label {{ opt.label }}
          span.option-hint(v-if="!isAvailable(opt)") 条件不满足
</template>

<style lang="scss" scoped>
.event-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 160;
}

.panel {
  min-width: 340px;
  max-width: 480px;
  width: 90%;
  padding: 20px 24px;
  background: rgba(20, 20, 20, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #ddd;
  font-size: 13px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.panel-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #fff;
}

.panel-desc {
  margin-bottom: 20px;
  line-height: 1.5;
  color: #bbb;
}

.panel-options {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.btn {
  padding: 10px 14px;
  font-size: 13px;
  color: #ccc;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.14);
    color: #fff;
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  &.option {
    width: 100%;
    text-align: left;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
}

.option-label {
  font-size: 13px;
}

.option-hint {
  font-size: 11px;
  color: #888;
}
</style>
