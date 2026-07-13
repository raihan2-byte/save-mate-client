<template>
  <div v-if="loading" class="mb-6 rounded-3xl bg-white/5 animate-pulse h-28" />

  <!-- Tomorrow = payday banner -->
  <div v-else-if="tomorrowIsNewCycle" class="mb-6 rounded-3xl border border-emerald-500/25 overflow-hidden"
    style="background: linear-gradient(135deg, #052e16 0%, #064e3b 100%)">
    <div class="px-5 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-xl">🎉</div>
        <div>
          <p class="font-black text-white text-sm">Besok Gajian!</p>
          <p class="text-emerald-300/70 text-xs mt-0.5">Siklus baru dimulai besok</p>
        </div>
      </div>
      <span class="text-[10px] text-white/40">{{ tomorrowLabel }}</span>
    </div>
    <div class="px-5 pb-4 space-y-3">
      <div v-if="nextCycleDailyBudget" class="bg-black/20 border border-emerald-400/15 rounded-2xl px-4 py-3">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-emerald-200/60 text-[10px] uppercase tracking-wider mb-0.5">Estimasi Budget/Hari Besok</p>
            <p class="font-black text-white text-xl">{{ formatCurrencyShort(nextCycleDailyBudget) }}</p>
          </div>
          <span class="text-[10px] text-emerald-300/50 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">Siklus baru</span>
        </div>
        <template v-if="tomorrowSummary?.totalCut && tomorrowSummary.totalCut < 0">
          <div class="h-px bg-white/8 my-2.5" />
          <div class="flex items-center justify-between">
            <p class="text-red-300/70 text-xs">✂️ Dipotong over budget hari ini</p>
            <p class="text-red-400 font-bold text-xs">-{{ formatCurrencyShort(Math.abs(tomorrowSummary.totalCut)) }}</p>
          </div>
          <div class="flex items-center justify-between mt-1">
            <p class="text-white/50 text-xs">Efektif besok</p>
            <p class="text-white font-bold text-sm">{{ formatCurrencyShort(nextCycleDailyBudget + tomorrowSummary.totalCut) }}</p>
          </div>
        </template>
      </div>
      <div class="rounded-2xl border border-emerald-400/10 bg-black/10 px-4 py-2.5">
        <p class="text-emerald-300/60 text-[11px]">Kalau hari ini over budget, potongannya tetap terbawa ke hari pertama siklus baru.</p>
      </div>
    </div>
  </div>

  <!-- Tomorrow budget preview -->
  <div v-else-if="tomorrowSummary?.hasData" class="mb-6 rounded-3xl border overflow-hidden"
    :class="tomorrowBorderClass">

    <!-- Header -->
    <div class="px-5 pt-5 pb-4 flex items-center justify-between"
      :style="tomorrowHeaderStyle">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          :class="tomorrowIconBg">
          {{ tomorrowIconEmoji }}
        </div>
        <div>
          <p class="font-black text-white text-sm">Budget Besok</p>
          <p class="text-xs mt-0.5" :class="tomorrowSubtitleClass">
            {{ tomorrowSubtitle }}
          </p>
        </div>
      </div>
      <span class="text-[10px] text-white/40">{{ tomorrowLabel }}</span>
    </div>

    <!-- Body: no adjustment -->
    <div v-if="!tomorrowSummary.hasAdjustment" class="bg-slate-900 px-5 py-4">
      <div class="flex items-center justify-between bg-white/5 rounded-2xl p-4">
        <p class="text-slate-400 text-sm">Budget harian besok</p>
        <p class="font-black text-white text-base">{{ formatCurrencyShort(tomorrowSummary.totalAllocated) }}</p>
      </div>
    </div>

    <!-- Body: with carryover -->
    <div v-else class="bg-slate-900 px-5 py-4">
      <div class="flex items-center gap-3 mb-4">
        <div class="flex-1 text-center bg-white/5 rounded-2xl p-3">
          <p class="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Budget Normal</p>
          <p class="text-white font-bold text-base">{{ formatCurrencyShort(tomorrowSummary.totalAllocated) }}</p>
        </div>
        <div class="flex flex-col items-center gap-0.5">
          <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs"
            :class="tomorrowSummary.totalCut < 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'">
            {{ tomorrowSummary.totalCut < 0 ? '▼' : '▲' }}
          </div>
          <p class="text-[10px] font-bold" :class="tomorrowSummary.totalCut < 0 ? 'text-red-400' : 'text-emerald-400'">
            {{ formatCurrencyShort(Math.abs(tomorrowSummary.totalCut)) }}
          </p>
        </div>
        <div class="flex-1 text-center rounded-2xl p-3"
          :class="tomorrowSummary.totalCut < 0 ? 'bg-red-500/10' : 'bg-emerald-500/10'">
          <p class="text-[10px] uppercase tracking-wider mb-1"
            :class="tomorrowSummary.totalCut < 0 ? 'text-red-400/70' : 'text-emerald-400/70'">Budget Besok</p>
          <p class="font-black text-base"
            :class="tomorrowSummary.totalEffective < 0 ? 'text-red-400' : tomorrowSummary.totalCut < 0 ? 'text-orange-300' : 'text-emerald-300'">
            {{ formatCurrencyShort(tomorrowSummary.totalEffective) }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 mb-3">
        <div class="h-px flex-1 bg-white/8" />
        <p class="text-[10px] text-slate-600 uppercase tracking-wider">Rincian</p>
        <div class="h-px flex-1 bg-white/8" />
      </div>

      <!-- Makanan row -->
      <div class="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/3 mb-2">
        <div class="flex items-center gap-2.5">
          <span class="text-base">🍜</span>
          <div>
            <p class="text-white text-xs font-semibold">Budget Makanan</p>
            <p class="text-[10px]" :class="tomorrowSummary.foodCarryover < 0 ? 'text-orange-400' : 'text-emerald-400'">
              {{ tomorrowSummary.foodCarryover < 0
                ? `Dipotong ${formatCurrencyShort(Math.abs(tomorrowSummary.foodCarryover))}`
                : 'Terlindungi ✓' }}
            </p>
          </div>
        </div>
        <div class="text-right">
          <p class="font-black text-sm" :class="tomorrowSummary.foodCarryover < 0 ? 'text-orange-300' : 'text-white'">
            {{ formatCurrencyShort(tomorrowSummary.foodEffective) }}
          </p>
          <p class="text-slate-600 text-[10px]">dari {{ formatCurrencyShort(tomorrowSummary.foodAllocated) }}</p>
        </div>
      </div>

      <!-- Lainnya row -->
      <div class="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/3">
        <div class="flex items-center gap-2.5">
          <span class="text-base">📦</span>
          <div>
            <p class="text-white text-xs font-semibold">Lainnya</p>
            <p class="text-[10px]"
              :class="tomorrowSummary.othersCarryover < 0 ? 'text-red-400' : tomorrowSummary.othersCarryover > 0 ? 'text-emerald-400' : 'text-slate-500'">
              {{ tomorrowSummary.othersCarryover < 0
                ? `Dipotong ${formatCurrencyShort(Math.abs(tomorrowSummary.othersCarryover))}`
                : tomorrowSummary.othersCarryover > 0
                  ? `+${formatCurrencyShort(tomorrowSummary.othersCarryover)} bonus`
                  : 'Normal' }}
            </p>
          </div>
        </div>
        <div class="text-right">
          <p class="font-black text-sm"
            :class="tomorrowSummary.othersEffective < tomorrowSummary.othersAllocated ? 'text-orange-300' : 'text-white'">
            {{ formatCurrencyShort(tomorrowSummary.othersEffective) }}
          </p>
          <p class="text-slate-600 text-[10px]">dari {{ formatCurrencyShort(tomorrowSummary.othersAllocated) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency, formatCurrencyShort } from '@/utils/formatting'

interface TomorrowSummary {
  foodAllocated: number
  foodCarryover: number
  foodEffective: number
  othersAllocated: number
  othersCarryover: number
  othersEffective: number
  totalAllocated: number
  totalCut: number
  totalEffective: number
  hasAdjustment: boolean
  hasData: boolean
}

const props = defineProps<{
  tomorrowSummary: TomorrowSummary | null
  nextCycleDailyBudget: number | null
  tomorrowIsNewCycle: boolean
  tomorrowLabel: string
  loading: boolean
}>()

const tomorrowBorderClass = computed(() => {
  if (!props.tomorrowSummary?.hasAdjustment) return 'border-white/8'
  return props.tomorrowSummary.totalCut < 0 ? 'border-red-500/20' : 'border-emerald-500/20'
})

const tomorrowHeaderStyle = computed(() => {
  if (!props.tomorrowSummary?.hasAdjustment) return 'background: linear-gradient(135deg, #0f172a, #1e293b)'
  return props.tomorrowSummary.totalCut < 0
    ? 'background: linear-gradient(135deg, #2d0a0a, #3b0f0f)'
    : 'background: linear-gradient(135deg, #052e16, #064e3b)'
})

const tomorrowIconBg = computed(() => {
  if (!props.tomorrowSummary?.hasAdjustment) return 'bg-white/10'
  return props.tomorrowSummary.totalCut < 0 ? 'bg-red-500/20' : 'bg-emerald-500/20'
})

const tomorrowIconEmoji = computed(() => {
  if (!props.tomorrowSummary?.hasAdjustment) return '📅'
  return props.tomorrowSummary.totalCut < 0 ? '✂️' : '🎁'
})

const tomorrowSubtitleClass = computed(() => {
  if (!props.tomorrowSummary?.hasAdjustment) return 'text-slate-400'
  return props.tomorrowSummary.totalCut < 0 ? 'text-red-300' : 'text-emerald-300'
})

const tomorrowSubtitle = computed(() => {
  if (!props.tomorrowSummary?.hasAdjustment) return 'Budget normal, tidak ada perubahan'
  return props.tomorrowSummary.totalCut < 0 ? 'Ada potongan dari hari ini' : 'Ada bonus dari hari ini'
})
</script>
