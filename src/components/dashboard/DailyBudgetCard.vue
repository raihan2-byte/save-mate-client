<template>
  <div>
    <!-- Loading skeleton -->
    <div v-if="loading" class="rounded-3xl p-6 mb-6 bg-white/5 animate-pulse h-40" />

    <!-- Budget hero card -->
    <div v-else
      class="relative overflow-hidden rounded-3xl p-6 mb-6 transition-all duration-500"
      :class="isNegative ? 'bg-red-gradient border border-red-500/40' : 'bg-emerald-gradient border border-emerald-500/30'">
      <!-- Glow -->
      <div class="pointer-events-none absolute -top-10 -right-10 w-48 h-48 blur-3xl rounded-full transition-colors duration-500"
        :class="isNegative ? 'bg-red-500/20' : 'bg-emerald-400/20'" />
      <div class="pointer-events-none absolute -bottom-10 -left-10 w-48 h-48 blur-3xl rounded-full transition-colors duration-500"
        :class="isNegative ? 'bg-rose-400/10' : 'bg-cyan-400/10'" />

      <div class="relative z-10">
        <div class="flex items-center justify-between mb-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-widest transition-colors duration-500"
              :class="isNegative ? 'text-red-300' : 'text-emerald-300'">
              {{ isNegative ? 'Over Budget Hari Ini' : 'Sisa Budget Hari Ini' }}
            </p>
            <p class="text-3xl font-black text-white mt-1 break-words">
              {{ formatCurrencyShort(displayRemaining) }}
            </p>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center text-2xl border border-white/20 flex-shrink-0">
            💰
          </div>
        </div>

        <!-- Progress bar -->
        <div class="bg-white/10 rounded-full h-2 mb-3 overflow-hidden">
          <div class="h-full rounded-full transition-all duration-700"
            :class="barColorClass"
            :style="{ width: Math.min(budgetUsedPercent, 100) + '%' }" />
        </div>

        <div class="text-xs transition-colors duration-500"
          :class="isNegative ? 'text-red-200/70' : 'text-emerald-200/70'">
          <span>Digunakan: {{ formatCurrencyShort(displaySpent) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency, formatCurrencyShort } from '@/utils/formatting'
import { BUDGET_THRESHOLDS } from '@/constants/budgetConfig'
import type { BudgetPlan, BudgetTrackerItem } from '@/types'

const props = defineProps<{
  budget: BudgetPlan | null
  foodTracker: BudgetTrackerItem | undefined
  lifestyleTracker: BudgetTrackerItem | undefined
  loading: boolean
  displayAllocated: number
  displaySpent: number
}>()

const displayRemaining = computed(() => props.displayAllocated - props.displaySpent)

const isNegative = computed(() => displayRemaining.value < 0)

const budgetUsedPercent = computed(() => {
  if (!props.displayAllocated) return 0
  return Math.min((props.displaySpent / props.displayAllocated) * 100, 100)
})

const barColorClass = computed(() => {
  if (isNegative.value) return 'bg-red-400'
  if (budgetUsedPercent.value > BUDGET_THRESHOLDS.critical) return 'bg-red-400'
  if (budgetUsedPercent.value > BUDGET_THRESHOLDS.warning) return 'bg-yellow-400'
  return 'bg-emerald-400'
})
</script>

<style scoped>
.bg-red-gradient {
  background: linear-gradient(135deg, #4c0519 0%, #7f1d1d 50%, #991b1b 100%);
}
.bg-emerald-gradient {
  background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%);
}
</style>
