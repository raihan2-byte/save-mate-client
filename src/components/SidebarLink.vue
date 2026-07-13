<template>
  <RouterLink
    :to="to"
    class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium"
    :class="isActive
      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'"
  >
    <span class="text-base">{{ icon }}</span>
    <span>{{ label }}</span>
    <span v-if="isActive" class="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const props = defineProps<{ to: string; icon: string; label: string }>()
const route = useRoute()
const isActive = computed(() => route.path === props.to)
</script>
