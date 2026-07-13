<template>
  <div class="glass-card p-5 rounded-2xl">
    <div v-if="title" class="flex items-center gap-2 mb-4">
      <span v-if="icon" class="text-base">{{ icon }}</span>
      <span class="text-white/60 text-sm uppercase tracking-wider font-semibold">{{ title }}</span>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  icon?: string
}>()
</script>
