<template>
  <div class="flex items-center gap-2 p-3 rounded-xl hover:bg-white/5 transition-colors group/item">
    <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 bg-red-500/10">
      {{ categoryEmoji(transaction.category) }}
    </div>
    <div class="flex-1 min-w-0">
      <p class="font-medium text-white text-sm">{{ truncateDesc(transaction.description) }}</p>
      <p class="text-xs text-slate-500">{{ categoryLabel(transaction.category) }}</p>
    </div>
    <div class="flex flex-col items-end gap-1 flex-shrink-0">
      <span class="font-bold text-sm tabular-nums text-red-400">-{{ formatCurrencyShort(transaction.amount) }}</span>
      <span v-if="transaction.deficit_choice && transaction.deficit_choice !== 'normal'"
        class="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
        :class="transaction.deficit_choice === 'savings'
          ? 'bg-violet-500/15 text-violet-300'
          : 'bg-amber-500/15 text-amber-300'">
        {{ transaction.deficit_choice === 'savings' ? '✂️ Potong tabungan' : '📅 Potong budget besok' }}
      </span>
    </div>
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
function truncateDesc(s: string) { return s ? (s.length > 8 ? s.slice(0, 8) + '...' : s) : '—' }
</script>
