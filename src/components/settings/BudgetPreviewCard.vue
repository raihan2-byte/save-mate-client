<template>
  <div
    v-if="salary > 0 && savingType && available > 0"
    class="rounded-2xl border p-4 space-y-3"
    :class="dailyBudgetDiff >= 0 ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'"
  >
    <div class="flex items-center gap-2 mb-1">
      <span class="text-sm">🔮</span>
      <p
        class="text-xs font-bold uppercase tracking-widest"
        :class="dailyBudgetDiff >= 0 ? 'text-emerald-400' : 'text-red-400'"
      >
        Preview Budget Baru
      </p>
    </div>
    <div class="grid grid-cols-2 gap-2 text-xs">
      <div class="bg-white/5 rounded-xl p-2.5 text-center">
        <p class="text-slate-400 mb-1">Budget/hari</p>
        <p class="font-black text-white text-base">{{ fmtShort(dailyBudget) }}</p>
        <p class="mt-0.5 font-semibold" :class="dailyBudgetDiff >= 0 ? 'text-emerald-400' : 'text-red-400'">
          {{ dailyBudgetDiff >= 0 ? '▲' : '▼' }} {{ fmtShort(Math.abs(dailyBudgetDiff)) }}
        </p>
      </div>
      <div class="bg-white/5 rounded-xl p-2.5 text-center">
        <p class="text-slate-400 mb-1">Tabungan/bulan</p>
        <p class="font-black text-white text-base">{{ fmtShort(savings) }}</p>
        <p class="mt-0.5 font-semibold" :class="savingsDiff >= 0 ? 'text-emerald-400' : 'text-red-400'">
          {{ savingsDiff >= 0 ? '▲' : '▼' }} {{ fmtShort(Math.abs(savingsDiff)) }}
        </p>
      </div>
    </div>
    <p v-if="dailyBudgetDiff < 0" class="text-xs text-amber-300">
      ⚠️ Budget harian turun karena persentase tabungan lebih tinggi di mode {{ savingLabel }}.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBudgetConfigStore } from '@/stores/budgetConfig'

const props = defineProps<{
  salary: number
  mandatory: number
  savingType: string
  daysInMonth?: number
  originalSalary: number
  originalSavingType: string
}>()

const budgetConfig = useBudgetConfigStore()

const days = computed(() => props.daysInMonth ?? 30)
const available = computed(() => props.salary - props.mandatory)

// 0 until the server's ruleset loads — the card renders zeros briefly rather
// than numbers based on a guessed split.
const spendPct = computed(() => budgetConfig.ratioFor(props.savingType)?.spend ?? 0)
const dailyBudget = computed(() => available.value > 0 ? (available.value * spendPct.value) / days.value : 0)
const savings = computed(() => available.value > 0 ? available.value * (1 - spendPct.value) : 0)

const originalAvailable = computed(() => props.originalSalary - props.mandatory)
const oldSpendPct = computed(() => budgetConfig.ratioFor(props.originalSavingType)?.spend ?? spendPct.value)
const oldDailyBudget = computed(() =>
  originalAvailable.value > 0 ? (originalAvailable.value * oldSpendPct.value) / days.value : 0
)
const oldSavings = computed(() =>
  originalAvailable.value > 0 ? originalAvailable.value * (1 - oldSpendPct.value) : 0
)

const dailyBudgetDiff = computed(() => dailyBudget.value - oldDailyBudget.value)
const savingsDiff = computed(() => savings.value - oldSavings.value)

const SAVING_LABELS: Record<string, string> = {
  frugal: 'Frugal',
  recommendation: 'Rekomendasi',
  normal: 'Normal',
}
const savingLabel = computed(() => SAVING_LABELS[props.savingType] ?? props.savingType)

function fmtShort(val: number) {
  if (val >= 1_000_000) return 'Rp ' + (val / 1_000_000).toFixed(1).replace('.0', '') + 'jt'
  if (val >= 1_000) return 'Rp ' + Math.round(val / 1_000) + 'rb'
  return 'Rp ' + Math.round(val)
}
</script>
