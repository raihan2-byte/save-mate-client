<template>
  <div class="flex items-center gap-2 p-3 rounded-xl hover:bg-white/5 transition-colors group/item">
    <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 bg-red-500/10">
      {{ categoryEmoji(transaction.category) }}
    </div>
    <div class="flex-1 min-w-0">
      <p class="font-medium text-white text-sm truncate">{{ transaction.description || '—' }}</p>
      <p class="text-xs text-slate-500">{{ categoryLabel(transaction.category) }}</p>
    </div>
    <span class="font-bold text-sm tabular-nums text-red-400 flex-shrink-0">-{{ formatCurrencyShort(transaction.amount) }}</span>
    <div class="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0">
      <button @click="emit('edit', transaction)"
        class="w-7 h-7 rounded-lg bg-white/5 hover:bg-blue-500/20 flex items-center justify-center text-slate-400 hover:text-blue-400 transition-colors text-xs">✏️</button>
      <button @click="emit('delete', transaction)"
        class="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors text-xs">🗑️</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CATEGORIES } from '@/constants/categories'
import { formatCurrencyShort } from '@/utils/formatting'
import type { Transaction } from '@/types'

defineProps<{
  transaction: Transaction
}>()

const emit = defineEmits<{
  edit: [transaction: Transaction]
  delete: [transaction: Transaction]
}>()

function categoryEmoji(cat: string) { return CATEGORIES[cat]?.emoji ?? '💸' }
function categoryLabel(cat: string) { return CATEGORIES[cat]?.label ?? cat }
</script>
