<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { EventBus } from '@/core/event-bus'

const props = defineProps<{ bus: EventBus }>()
const active = ref(false)

function onDied() {
  active.value = true
}
function onEnded() {
  active.value = false
}

onMounted(() => {
  props.bus.on('player:died', onDied)
  props.bus.on('combat:ended', onEnded)
})
onUnmounted(() => {
  props.bus.off('player:died', onDied)
  props.bus.off('combat:ended', onEnded)
})
</script>

<template lang="pug">
Transition(name="vignette")
  .death-vignette(v-if="active")
</template>

<style lang="scss" scoped>
.death-vignette {
  position: fixed;
  inset: 0;
  pointer-events: none;
  box-shadow: inset 0 0 80px rgba(255, 0, 0, 0.45);
  animation: death-pulse 1.2s ease-in-out infinite alternate;
  z-index: 500;
}

@keyframes death-pulse {
  from {
    box-shadow: inset 0 0 60px rgba(255, 0, 0, 0.3);
  }
  to {
    box-shadow: inset 0 0 120px rgba(255, 0, 0, 0.6);
  }
}

.vignette-enter-active,
.vignette-leave-active {
  transition: opacity 200ms ease;
}

.vignette-enter-from,
.vignette-leave-to {
  opacity: 0;
}
</style>
