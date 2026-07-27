<template>
  <div key="s4">
    <div class="text-center mb-6">
      <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-3xl mx-auto mb-4">🎯</div>
      <p class="text-violet-400 text-xs font-semibold uppercase tracking-widest mb-1">Strategi Menabung</p>
      <h1 class="text-2xl font-black text-white">Pilih Strategi Utama</h1>
      <p class="text-slate-400 text-sm mt-1">Untuk bulan-bulan ke depan setelah gajian</p>
    </div>

    <div class="space-y-3 mb-5">
      <button v-for="opt in strategies" :key="opt.type" type="button"
        @click="emit('update:savingType', opt.type)"
        class="w-full text-left rounded-2xl border p-4 transition-all"
        :class="savingType === opt.type
          ? 'border-emerald-500 bg-emerald-500/10'
          : 'border-white/10 bg-white/5 hover:border-white/20'">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-2xl">{{ opt.icon }}</span>
            <div>
              <p class="font-black text-white text-sm">{{ opt.label }}</p>
              <p class="text-slate-500 text-xs">{{ opt.desc }}</p>
            </div>
          </div>
          <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
            :class="savingType === opt.type ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'">
            <div v-if="savingType === opt.type" class="w-2 h-2 rounded-full bg-white" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2 mt-1">
          <div class="bg-white/5 rounded-xl p-2 text-center">
            <p class="text-xs text-slate-500 mb-0.5">Tabungan</p>
            <p class="font-black text-emerald-400 text-sm">{{ Math.round(opt.savePct * 100) }}%</p>
          </div>
          <div class="bg-white/5 rounded-xl p-2 text-center">
            <p class="text-xs text-slate-500 mb-0.5">Pengeluaran</p>
            <p class="font-black text-cyan-400 text-sm">{{ Math.round(opt.spendPct * 100) }}%</p>
          </div>
        </div>

        <!-- Rincian budget untuk strategi terpilih -->
        <div v-if="savingType === opt.type && detailFor(opt)" class="mt-3 pt-3 border-t border-white/10 space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-400">🏦 Tabungan</span>
            <span class="text-xs font-bold text-emerald-400">{{ fmtCur(detailFor(opt)!.savings) }}<span class="text-slate-500 font-normal">/bln</span></span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-400">🍜 Makanan</span>
            <span class="text-xs font-semibold text-white">{{ fmtCur(detailFor(opt)!.food) }}<span class="text-slate-500 font-normal">/bln</span></span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-400">🛍️ Gaya Hidup</span>
            <span class="text-xs font-semibold text-white">{{ fmtCur(detailFor(opt)!.lifestyle) }}<span class="text-slate-500 font-normal">/bln</span></span>
          </div>
          <div class="flex items-center justify-between pt-1.5 border-t border-white/5">
            <span class="text-xs text-slate-400">📅 Budget/hari</span>
            <span class="text-xs font-bold text-cyan-400">{{ fmtCur(detailFor(opt)!.daily) }}</span>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DEFAULT_MONTH_DAYS } from '@/constants/budgetConfig'
import { useBudgetConfigStore } from '@/stores/budgetConfig'
import { formatCurrency } from '@/utils/formatting'

const props = defineProps<{
  savingType: string
  available: number
}>()

const emit = defineEmits<{
  'update:savingType': [value: string]
}>()

const fmtCur = formatCurrency

interface StrategyOption {
  type: string
  icon: string
  label: string
  desc: string
  savePct: number
  spendPct: number
}

const budgetConfig = useBudgetConfigStore()

function detailFor(opt: StrategyOption) {
  const avail = Math.max(0, props.available)
  const foodPct = budgetConfig.config?.food_pct_of_spending
  if (avail <= 0 || foodPct === undefined) return null
  const savings = avail * opt.savePct
  const spending = avail * opt.spendPct
  return {
    savings,
    food: spending * foodPct,
    lifestyle: spending * (1 - foodPct),
    daily: spending / DEFAULT_MONTH_DAYS,
  }
}

const STRATEGY_LABELS = [
  { type: 'frugal',         icon: '🧊', label: 'Frugal',      desc: 'Hemat ketat — prioritas tabungan maksimal' },
  { type: 'recommendation', icon: '✅', label: 'Rekomendasi', desc: 'Seimbang — enjoy hidup & tetap nabung' },
  { type: 'normal',         icon: '😊', label: 'Normal',      desc: 'Fleksibel — santai, belanja lebih bebas' },
]

// Empty until the server's ruleset arrives, so no strategy is ever shown with a
// percentage the backend would not actually apply.
const strategies = computed<StrategyOption[]>(() =>
  STRATEGY_LABELS.flatMap(s => {
    const ratio = budgetConfig.ratioFor(s.type)
    return ratio ? [{ ...s, savePct: ratio.save, spendPct: ratio.spend }] : []
  })
)
</script>
