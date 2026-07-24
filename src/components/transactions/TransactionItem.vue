<template>
  <div class="flex items-center gap-2 p-3 rounded-xl hover:bg-white/5 transition-colors group/item">
    <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 bg-red-500/10">
      {{ categoryEmoji(transaction.category) }}
    </div>
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-1.5">
        <p class="font-medium text-white text-sm">{{ truncateDesc(transaction.description) }}</p>
        <!-- Info icon: only when description is truncated -->
        <div v-if="isTruncated" class="relative flex-shrink-0">
          <button
            type="button"
            @click.stop="showFull = !showFull"
            class="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px] font-bold leading-none hover:bg-amber-500/30 transition-colors"
            aria-label="Lihat deskripsi lengkap"
          >!</button>

          <!-- Click-outside backdrop -->
          <div v-if="showFull" class="fixed inset-0 z-40" @click.stop="showFull = false" />

          <!-- Popover -->
          <div v-if="showFull"
            class="absolute z-50 left-0 top-6 min-w-[10rem] max-w-[16rem] rounded-xl border border-white/10 bg-slate-800 shadow-xl px-3 py-2">
            <p class="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Deskripsi</p>
            <p class="text-white text-xs break-words">{{ transaction.description }}</p>
          </div>
        </div>
      </div>
      <p class="text-xs text-slate-500">{{ categoryLabel(transaction.category) }}</p>
    </div>
    <div class="flex flex-col items-end gap-1 flex-shrink-0">
      <span class="font-bold text-sm tabular-nums text-red-400">-{{ formatCurrencyShort(transaction.amount) }}</span>
      <div v-if="hasDeficit" class="relative">
        <button type="button" @click.stop="showDeficit = !showDeficit"
          class="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors"
          :class="deficitBadgeClass">
          <span>{{ deficitIcon }}</span>
          <span class="hidden sm:inline">{{ deficitLabel }}</span>
        </button>

        <!-- Mobile-only: tap icon to reveal full label -->
        <div v-if="showDeficit" class="fixed inset-0 z-40 sm:hidden" @click.stop="showDeficit = false" />
        <div v-if="showDeficit"
          class="absolute z-50 right-0 top-6 whitespace-nowrap rounded-lg border border-white/10 bg-slate-800 shadow-xl px-2.5 py-1.5 sm:hidden">
          <p class="text-white text-[11px] font-medium">{{ deficitIcon }} {{ deficitLabel }}</p>
        </div>
      </div>
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
import { ref, computed } from 'vue'
import { CATEGORIES } from '@/constants/categories'
import { formatCurrencyShort } from '@/utils/formatting'
import type { Transaction } from '@/types'

const props = defineProps<{
  transaction: Transaction
}>()

const emit = defineEmits<{
  edit: [transaction: Transaction]
  delete: [transaction: Transaction]
}>()

const DESC_LIMIT = 8
const showFull = ref(false)
const showDeficit = ref(false)

const isTruncated = computed(() => (props.transaction.description?.length ?? 0) > DESC_LIMIT)

const hasDeficit = computed(() =>
  !!props.transaction.deficit_choice && props.transaction.deficit_choice !== 'normal'
)
const isSavingsCut = computed(() => props.transaction.deficit_choice === 'savings')
const deficitIcon = computed(() => (isSavingsCut.value ? '✂️' : '⏭️'))
const deficitLabel = computed(() => (isSavingsCut.value ? 'Potong tabungan' : 'Potong budget besok'))
const deficitBadgeClass = computed(() =>
  isSavingsCut.value ? 'bg-violet-500/15 text-violet-300' : 'bg-amber-500/15 text-amber-300'
)

function categoryEmoji(cat: string) { return CATEGORIES[cat]?.emoji ?? '💸' }
function categoryLabel(cat: string) { return CATEGORIES[cat]?.label ?? cat }
function truncateDesc(s: string) { return s ? (s.length > DESC_LIMIT ? s.slice(0, DESC_LIMIT) + '...' : s) : '—' }
</script>
