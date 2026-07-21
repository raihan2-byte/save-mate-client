<template>
  <ModalWrapper :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <div class="flex items-center gap-3 mb-5">
      <div class="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-xl">🌙</div>
      <div>
        <p class="font-black text-white">Sudahi Hari Ini</p>
        <p class="text-slate-400 text-xs mt-0.5">{{ yesterdayLabel }}</p>
      </div>
    </div>

    <!-- Total remaining -->
    <div class="rounded-2xl border border-white/10 bg-white/3 p-4 mb-5 text-center">
      <p class="text-slate-400 text-xs mb-1">Sisa budget hari ini</p>
      <p class="text-2xl font-black text-emerald-400">+{{ formatCurrency(total) }}</p>
    </div>

    <!-- Choice buttons -->
    <div class="grid grid-cols-2 gap-3 mb-5">
      <button
        @click="emit('update:choice', 'carryover')"
        class="py-4 rounded-2xl border text-sm font-semibold transition-all flex flex-col items-center gap-1"
        :class="choice === 'carryover'
          ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300'
          : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'"
      >
        <span class="text-xl">📈</span>
        Budget besok
      </button>
      <button
        @click="emit('update:choice', 'save')"
        class="py-4 rounded-2xl border text-sm font-semibold transition-all flex flex-col items-center gap-1"
        :class="choice === 'save'
          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
          : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'"
      >
        <span class="text-xl">🏦</span>
        Tabungin
      </button>
    </div>

    <div v-if="error" class="text-red-400 text-xs text-center mb-3">{{ error }}</div>

    <AppButton
      variant="primary"
      size="lg"
      class="w-full"
      :loading="loading"
      :disabled="!choice"
      @click="emit('confirm')"
    >
      ✓ Konfirmasi
    </AppButton>
  </ModalWrapper>
</template>

<script setup lang="ts">
import ModalWrapper from '@/components/ui/ModalWrapper.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { formatCurrency } from '@/utils/formatting'

defineProps<{
  modelValue: boolean
  total: number
  choice: string
  loading: boolean
  error: string
  yesterdayLabel: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:choice': [value: string]
  'confirm': []
}>()
</script>
