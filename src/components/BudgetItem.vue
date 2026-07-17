<template>
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-2">
      <div class="w-2 h-2 rounded-full" :class="`bg-${color}-500`" />
      <span class="text-sm text-gray-700">{{ label }}</span>
    </div>
    <span class="font-semibold text-sm text-gray-900">{{ formatCurrencyShort(amount) }}</span>
  </div>
</template>

<script setup lang="ts">
import { formatCurrencyShort } from '@/utils/formatting'

defineProps<{ label: string; amount: number; color: string }>()
</script>
