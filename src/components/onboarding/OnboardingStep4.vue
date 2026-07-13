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
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SAVING_TYPES } from '@/constants/budgetConfig'

defineProps<{
  savingType: string
}>()

const emit = defineEmits<{
  'update:savingType': [value: string]
}>()

const strategies = [
  {
    type: 'frugal',
    icon: '🧊',
    label: 'Frugal',
    desc: 'Hemat ketat — prioritas tabungan maksimal',
    savePct: SAVING_TYPES.frugal.save,
    spendPct: SAVING_TYPES.frugal.spend,
  },
  {
    type: 'recommendation',
    icon: '✅',
    label: 'Rekomendasi',
    desc: 'Seimbang — enjoy hidup & tetap nabung',
    savePct: SAVING_TYPES.recommendation.save,
    spendPct: SAVING_TYPES.recommendation.spend,
  },
  {
    type: 'normal',
    icon: '😊',
    label: 'Normal',
    desc: 'Fleksibel — santai, belanja lebih bebas',
    savePct: SAVING_TYPES.normal.save,
    spendPct: SAVING_TYPES.normal.spend,
  },
]
</script>
