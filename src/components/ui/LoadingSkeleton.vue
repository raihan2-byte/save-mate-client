<template>
  <div class="space-y-3">
    <div
      v-for="i in rows"
      :key="i"
      :class="['rounded-xl bg-white/5 animate-pulse', height]"
    />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  rows?: number
  height?: string
}>(), {
  rows: 3,
  height: 'h-16',
})
</script>
