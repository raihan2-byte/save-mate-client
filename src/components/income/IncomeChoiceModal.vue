<template>
  <ModalWrapper :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <div class="mb-5">
      <h2 class="font-black text-white text-lg">Mau diapain uangnya?</h2>
      <p class="text-slate-500 text-sm mt-1">
        Pilih apa yang mau kamu lakukan dengan
        <span class="text-emerald-400 font-semibold">{{ formatCurrency(income?.amount ?? 0) }}</span>
      </p>
    </div>

    <div class="space-y-3">
      <!-- Option 1: Save -->
      <button
        @click="emit('confirm', 'save')"
        :disabled="submitting"
        class="w-full text-left p-4 rounded-2xl border transition-all hover:scale-[1.01] disabled:opacity-50"
        :class="selectedChoice === 'save' ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 bg-white/5 hover:border-emerald-500/50'"
      >
        <div class="flex items-center gap-3">
          <span class="text-2xl">🏦</span>
          <div>
            <p class="font-bold text-white text-sm">Tabungin</p>
            <p class="text-emerald-400 text-xs mt-0.5">Tabunganmu bertambah {{ formatCurrency(income?.amount ?? 0) }}</p>
          </div>
        </div>
      </button>

      <!-- Option 2: Tomorrow budget -->
      <div
        class="w-full text-left p-4 rounded-2xl border"
        :class="tomorrowIsPayday ? 'border-white/5 bg-white/2 opacity-50 cursor-not-allowed' : 'border-white/10 bg-white/5'"
      >
        <div
          class="flex items-center gap-3"
          :class="tomorrowIsPayday ? '' : 'cursor-pointer hover:opacity-90'"
          @click="!tomorrowIsPayday && emit('confirm', 'tomorrow')"
        >
          <span class="text-2xl">📈</span>
          <div class="flex-1">
            <p class="font-bold text-sm" :class="tomorrowIsPayday ? 'text-slate-500' : 'text-white'">Budget besok</p>
            <p class="text-xs mt-0.5" :class="tomorrowIsPayday ? 'text-slate-600' : 'text-emerald-400'">
              {{ tomorrowIsPayday
                ? 'Tidak tersedia — besok mulai siklus baru'
                : 'Besok dapat tambahan ' + formatCurrency(income?.amount ?? 0) }}
            </p>
          </div>
          <span v-if="tomorrowIsPayday" class="text-[10px] text-slate-600 bg-white/5 px-2 py-1 rounded-full border border-white/[0.08]">Nonaktif</span>
        </div>
      </div>

      <!-- Option 3: Spread -->
      <div
        class="w-full p-4 rounded-2xl border"
        :class="tomorrowIsPayday ? 'border-white/5 bg-white/2 opacity-50' : 'border-white/10 bg-white/5'"
      >
        <div class="flex items-center gap-3 mb-3">
          <span class="text-2xl">📅</span>
          <div>
            <p class="font-bold text-sm" :class="tomorrowIsPayday ? 'text-slate-500' : 'text-white'">Bagi rata</p>
            <p class="text-xs mt-0.5" :class="tomorrowIsPayday ? 'text-slate-600' : 'text-slate-400'">
              {{ tomorrowIsPayday ? 'Tidak tersedia — besok mulai siklus baru' : 'Pilih durasi penyebaran' }}
            </p>
          </div>
        </div>
        <div class="flex flex-wrap justify-center gap-2">
          <button
            v-for="opt in spreadOptions"
            :key="opt.days"
            @click="!tomorrowIsPayday && emit('confirm', 'spread', opt.days)"
            :disabled="submitting || tomorrowIsPayday"
            :style="spreadOptions.length === 1 ? 'width:100%' : spreadOptions.length === 2 ? 'width:calc(50% - 4px)' : 'width:calc(33.33% - 6px)'"
            class="flex flex-col items-center py-3 px-2 rounded-xl border transition-all disabled:opacity-50"
            :class="selectedSpreadDays === opt.days ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 bg-white/5 hover:border-emerald-500/40'"
          >
            <span class="text-white font-semibold text-xs leading-tight">{{ opt.title }}</span>
            <span class="text-slate-400 text-[10px] mt-0.5">{{ opt.sub }}</span>
            <span class="text-emerald-400 text-xs font-bold mt-1">+{{ formatCurrency((income?.amount ?? 0) / opt.days) }}/hari</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="error" class="mt-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">{{ error }}</div>

    <AppButton variant="outline" class="w-full mt-4" @click="emit('update:modelValue', false)">
      Batal
    </AppButton>
  </ModalWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ModalWrapper from '@/components/ui/ModalWrapper.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { SPREAD_DURATIONS } from '@/constants/budgetConfig'
import type { Income } from '@/types/index'

const props = defineProps<{
  modelValue: boolean
  income: Income | null
  cycleInfo: { daysLeft: number; nextPayday: string }
  submitting?: boolean
  selectedChoice?: string
  selectedSpreadDays?: number
  error?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [choice: string, spreadDays?: number]
}>()

const tomorrowIsPayday = computed(() => props.cycleInfo.daysLeft <= 1)

const spreadOptions = computed(() => {
  const max = props.cycleInfo.daysLeft
  const labelMap: Record<number, { title: string; sub: string }> = {
    7:  { title: '1 Minggu', sub: '(7 hari)' },
    14: { title: '2 Minggu', sub: '(14 hari)' },
    30: { title: '1 Bulan', sub: '(30 hari)' },
  }
  const candidates: { days: number; title: string; sub: string }[] = [
    { days: max, title: 'Sisa siklus', sub: `(${max} hari)` },
    ...SPREAD_DURATIONS.map(d => ({ days: d, ...(labelMap[d] ?? { title: `${d} hari`, sub: `(${d} hari)` }) })),
  ]
  const seen = new Set<number>()
  return candidates.filter(o => {
    if (o.days < 1 || o.days > max || seen.has(o.days)) return false
    seen.add(o.days)
    return true
  }).sort((a, b) => b.days - a.days)
})

function formatCurrency(val: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}
</script>
