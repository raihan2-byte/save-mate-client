<template>
  <div key="s6">
    <div class="text-center mb-6">
      <div class="text-5xl mb-3">🎉</div>
      <h1 class="text-2xl font-black text-white">Rencana Keuanganmu Siap!</h1>
      <p class="text-slate-400 text-sm mt-1">Berdasarkan data yang kamu masukkan</p>
    </div>

    <div class="grid grid-cols-2 gap-3 mb-4">
      <div class="rounded-2xl p-4 border border-red-500/20 bg-red-500/5">
        <p class="text-red-400 text-xs font-semibold mb-1">📕 Tabungan Harian</p>
        <p class="text-2xl font-black text-white">{{ fmtCurShort(plan.dailySavings) }}</p>
        <p class="text-slate-500 text-xs mt-1">{{ fmtCur(plan.savings) }}/bulan</p>
        <p class="text-red-300/60 text-[10px] mt-1">Non-negotiable 🔒</p>
      </div>
      <div class="rounded-2xl p-4 border border-cyan-500/20 bg-cyan-500/5">
        <p class="text-cyan-400 text-xs font-semibold mb-1">🟦 Budget Harian</p>
        <p class="text-2xl font-black text-white">{{ fmtCurShort(plan.dailyFlexible) }}</p>
        <p class="text-slate-500 text-xs mt-1">{{ fmtCur(plan.flexible) }}/bulan</p>
        <p class="text-cyan-300/60 text-[10px] mt-1">Fleksibel 🛒</p>
      </div>
    </div>

    <div class="glass-card p-5 mb-4">
      <p class="text-white font-bold mb-3">Rincian Budget Harian</p>
      <div class="space-y-2">
        <div v-for="cat in plan.breakdown" :key="cat.label"
          class="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
          <div class="flex items-center gap-2">
            <span>{{ cat.icon }}</span>
            <div>
              <p class="text-white text-sm">{{ cat.label }}</p>
              <div class="h-1.5 rounded-full bg-white/10 w-24 mt-1 overflow-hidden">
                <div class="h-full rounded-full transition-all duration-1000" :class="cat.barColor" :style="{ width: cat.pct + '%' }" />
              </div>
            </div>
          </div>
          <span class="font-bold text-sm tabular-nums" :class="cat.color">{{ fmtCurShort(cat.daily) }}</span>
        </div>
      </div>
    </div>

    <div class="glass-card p-4 mb-6 flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-slate-500/20 flex items-center justify-center text-xl flex-shrink-0">⚙️</div>
      <div>
        <p class="text-slate-300 text-sm font-medium">Pengeluaran Wajib (auto-deducted)</p>
        <p class="text-white font-bold">{{ fmtCur(mandatory) }}/bulan</p>
      </div>
    </div>

    <AppButton variant="primary" size="lg" class="w-full" @click="emit('done')">
      🚀 Mulai Tracking Sekarang!
    </AppButton>
  </div>
</template>

<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'

export interface PlanBreakdownItem {
  icon: string
  label: string
  daily: number
  pct: number
  color: string
  barColor: string
}

export interface FinalPlan {
  savings: number
  flexible: number
  dailySavings: number
  dailyFlexible: number
  breakdown: PlanBreakdownItem[]
}

const props = defineProps<{
  plan: FinalPlan
  mandatory: number
}>()

const emit = defineEmits<{
  'done': []
}>()

function fmtCur(val: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Math.abs(val))
}

function fmtCurShort(val: number) {
  if (val >= 1_000_000) return 'Rp ' + (val / 1_000_000).toFixed(1).replace('.0', '') + 'jt'
  if (val >= 1_000) return 'Rp ' + (val / 1_000).toFixed(0) + 'rb'
  return 'Rp ' + val
}
</script>
