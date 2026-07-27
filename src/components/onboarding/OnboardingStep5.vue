<template>
  <div key="s5" class="text-center py-10">
    <div class="relative w-24 h-24 mx-auto mb-8">
      <div class="absolute inset-0 rounded-full border-4 border-emerald-500/20" />
      <div class="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin" />
      <div class="absolute inset-0 flex items-center justify-center text-3xl">💡</div>
    </div>
    <h2 class="text-2xl font-black text-white mb-2">{{ calcPhase.title }}</h2>
    <p class="text-slate-400 text-sm mb-8">{{ calcPhase.subtitle }}</p>
    <div class="glass-card p-5 space-y-4 text-left max-w-sm mx-auto">
      <div v-for="(item, i) in calcItems" :key="i"
        class="flex justify-between items-center"
        :class="i < calcRevealCount ? 'opacity-100' : 'opacity-20'"
        style="transition: opacity 0.4s">
        <span class="text-slate-400 text-sm">{{ item.label }}</span>
        <span class="font-black tabular-nums" :class="item.color">
          {{ i < calcRevealCount ? fmtCur(item.value) : '—' }}
        </span>
      </div>
    </div>
    <p v-if="error" class="mt-4 text-red-400 text-sm">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { DEFAULT_MONTH_DAYS } from '@/constants/budgetConfig'
import { useBudgetConfigStore } from '@/stores/budgetConfig'

const props = defineProps<{
  salary: number
  mandatory: number
  savingType: string
  region: string
  loading: boolean
  error?: string
  calcRevealCount: number
  calcPhaseIdx: number
}>()

const calcPhases = [
  { title: 'Menghitung anggaran...', subtitle: 'Memproses gaji dan pengeluaran wajib' },
  { title: 'Mengoptimasi alokasi...', subtitle: 'Menerapkan strategi menabung' },
  { title: 'Menyiapkan rencana...', subtitle: 'Menghitung target harian per kategori' },
  { title: 'Hampir selesai!', subtitle: 'Menyimpan rencana keuanganmu...' },
]

const calcPhase = computed(() => calcPhases[Math.min(props.calcPhaseIdx, calcPhases.length - 1)])

const budgetConfig = useBudgetConfigStore()

const calcItems = computed(() => {
  const strat = budgetConfig.ratioFor(props.savingType)
  const foodPct = budgetConfig.config?.food_pct_of_spending
  if (!strat || foodPct === undefined) return []
  const avail = Math.max(0, props.salary - props.mandatory)
  const flexible = avail * strat.spend
  const savings = avail * strat.save
  return [
    { label: 'Penghasilan bulanan',     value: props.salary,    color: 'text-white' },
    { label: '- Pengeluaran wajib',     value: -props.mandatory, color: 'text-red-400' },
    { label: '= Dana tersedia',         value: avail,           color: 'text-emerald-400' },
    { label: '📕 Target tabungan/bln',  value: Math.round(savings),   color: 'text-red-300' },
    { label: '🟦 Budget fleksibel/bln', value: Math.round(flexible),  color: 'text-cyan-400' },
    { label: '🍜 Budget makan/hari',    value: Math.round(flexible * foodPct / DEFAULT_MONTH_DAYS), color: 'text-white' },
    { label: '🎯 Budget harian total',  value: Math.round(flexible / DEFAULT_MONTH_DAYS), color: 'text-emerald-400' },
  ]
})

function fmtCur(val: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Math.abs(val))
}
</script>
