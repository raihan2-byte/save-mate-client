<template>
  <div class="py-12 text-center flex flex-col items-center">
    <div class="text-4xl mb-3">{{ icon }}</div>
    <p class="text-white/60 font-medium">{{ title }}</p>
    <p v-if="subtitle" class="text-white/40 text-sm mt-1">{{ subtitle }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  icon?: string
  title: string
  subtitle?: string
}>(), {
  icon: '📭',
})
</script>
