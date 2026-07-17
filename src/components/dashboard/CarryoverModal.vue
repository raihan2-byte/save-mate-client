<template>
  <ModalWrapper :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <div class="flex items-center gap-3 mb-5">
      <div class="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-xl">💸</div>
      <div>
        <p class="font-black text-white">Sisa Budget Kemarin</p>
        <p class="text-slate-400 text-xs mt-0.5">{{ yesterdayLabel }} — pilih apa yang mau dilakukan</p>
      </div>
    </div>

    <div class="space-y-3 mb-5">
      <div v-for="item in carryoverItems" :key="item.category"
        class="rounded-2xl border border-white/10 bg-white/3 p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="text-lg">{{ catIcons[item.category] ?? '📦' }}</span>
            <span class="font-semibold text-white capitalize text-sm">{{ catLabels[item.category] ?? item.category }}</span>
          </div>
          <span class="font-black text-emerald-400">+{{ formatCurrencyShort(item.remaining) }}</span>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <button v-for="opt in carryoverOptions" :key="opt.action"
            @click="emit('setChoice', item.category, opt.action)"
            class="py-2 px-1 rounded-xl border text-[11px] font-semibold text-center transition-all"
            :class="item.choice === opt.action
              ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
              : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'">
            {{ opt.icon }}<br>{{ opt.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Info note -->
    <div class="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-3 mb-4">
      <p class="text-emerald-400 text-[11px] font-bold mb-1">💡 Tau nggak?</p>
      <p class="text-slate-400 text-[11px] leading-relaxed">
        <span class="text-white font-medium">Budget besok</span> = budget harianmu besok jadi lebih banyak.
        <span class="text-white font-medium">Tabungin</span> = budget besok tetap sama, tapi sisa hari ini langsung masuk tabunganmu dan terakumulasi setiap bulan.
        Kalau lewat jam 6 pagi dan belum dipilih, otomatis <span class="text-emerald-300 font-medium">masuk tabungan</span>.
      </p>
    </div>

    <AppButton
      variant="primary"
      size="lg"
      class="w-full"
      :loading="loading"
      :disabled="!allChoicesMade"
      @click="emit('confirm')"
    >
      ✓ Konfirmasi Pilihan
    </AppButton>
  </ModalWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ModalWrapper from '@/components/ui/ModalWrapper.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { formatCurrency } from '@/utils/formatting'
import { CATEGORIES } from '@/constants/categories'

interface CarryoverItem {
  category: string
  remaining: number
  choice: string
}

const props = defineProps<{
  modelValue: boolean
  carryoverItems: CarryoverItem[]
  loading: boolean
  yesterdayLabel: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': []
  'setChoice': [category: string, action: string]
}>()

const catIcons: Record<string, string> = Object.fromEntries(Object.entries(CATEGORIES).map(([k, v]) => [k, v.icon]))
const catLabels: Record<string, string> = Object.fromEntries(Object.entries(CATEGORIES).map(([k, v]) => [k, v.label]))

const carryoverOptions = [
  { action: 'carryover', icon: '📈', label: 'Budget besok' },
  { action: 'save',      icon: '🏦', label: 'Tabungin' },
]

const allChoicesMade = computed(() => props.carryoverItems.every(i => i.choice !== ''))
</script>
