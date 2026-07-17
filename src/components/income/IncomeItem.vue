<template>
  <div class="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group/item">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-lg">💰</div>
      <div>
        <p class="font-medium text-white text-sm">{{ income.description }}</p>
        <p class="text-xs text-slate-500">{{ formatDate(income.transaction_date) }}</p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <span class="font-bold text-emerald-400 text-sm tabular-nums">+{{ formatCurrencyShort(income.amount) }}</span>
      <div class="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
        <button
          @click="emit('delete')"
          class="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors text-xs"
        >🗑️</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Income } from '@/types/index'
import { formatCurrencyShort } from '@/utils/formatting'

defineProps<{ income: Income }>()
const emit = defineEmits<{ delete: [] }>()

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>
