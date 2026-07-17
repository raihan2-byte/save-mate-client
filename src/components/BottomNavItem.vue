<template>
  <RouterLink
    :to="to"
    class="flex-1 flex flex-col items-center py-2 gap-0.5 text-[9px] font-medium transition-colors"
    :class="isActive ? 'text-emerald-400' : 'text-slate-500'"
  >
    <span class="text-xl leading-none">{{ icon }}</span>
    <span>{{ label }}</span>
    <span v-if="isActive" class="w-1 h-1 rounded-full bg-emerald-400 mt-0.5" />
  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const props = defineProps<{ to: string; icon: string; label: string }>()
const route = useRoute()
const isActive = computed(() => route.path === props.to)
</script>
