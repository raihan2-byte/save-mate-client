<template>
  <div class="glass-card p-4 mb-4">
    <!-- Mode chips -->
    <div class="flex gap-2 mb-4">
      <button
        v-for="m in modes"
        :key="m.value"
        @click="emit('update:modelValue', m.value)"
        class="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
        :class="modelValue === m.value
          ? 'bg-emerald-500 text-white'
          : 'bg-white/5 text-slate-400 hover:bg-white/10'"
      >
        {{ m.label }}
      </button>
    </div>

    <!-- Single day -->
    <template v-if="modelValue === 'single'">
      <div class="flex items-center gap-3 mb-3">
        <button
          @click="emit('prev-day')"
          class="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 transition-colors flex-shrink-0"
        >‹</button>
        <div class="flex-1 text-center">
          <p class="font-bold text-white text-sm">{{ selectedLabel }}</p>
        </div>
        <button
          @click="emit('next-day')"
          :disabled="isToday"
          class="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 transition-colors flex-shrink-0 disabled:opacity-30 disabled:pointer-events-none"
        >›</button>
      </div>
      <input
        type="date"
        :value="selectedDate"
        @input="emit('update:selected-date', ($event.target as HTMLInputElement).value)"
        :max="todayStr"
        class="w-full rounded-xl border border-white/10 bg-white/5 text-slate-300 text-sm px-4 py-2.5 focus:outline-none focus:border-emerald-500/50"
      />
    </template>

    <!-- Range -->
    <template v-else-if="modelValue === 'range'">
      <div class="flex items-center gap-3 mb-3">
        <button
          @click="emit('shift-range', -1)"
          class="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 transition-colors flex-shrink-0"
        >‹</button>
        <div class="flex-1 text-center">
          <p class="font-bold text-white text-sm">{{ rangeLabel }}</p>
        </div>
        <button
          @click="emit('shift-range', 1)"
          :disabled="rangeToDate >= todayStr"
          class="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 transition-colors flex-shrink-0 disabled:opacity-30 disabled:pointer-events-none"
        >›</button>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <p class="text-slate-500 text-[10px] uppercase tracking-widest mb-1 ml-1">Dari</p>
          <input
            type="date"
            :value="rangeFromDate"
            @input="emit('update:range-from-date', ($event.target as HTMLInputElement).value)"
            :max="rangeToDate"
            class="w-full rounded-xl border border-white/10 bg-white/5 text-slate-300 text-sm px-3 py-2 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <div>
          <p class="text-slate-500 text-[10px] uppercase tracking-widest mb-1 ml-1">Sampai</p>
          <input
            type="date"
            :value="rangeToDate"
            @input="emit('update:range-to-date', ($event.target as HTMLInputElement).value)"
            :min="rangeFromDate"
            :max="todayStr"
            class="w-full rounded-xl border border-white/10 bg-white/5 text-slate-300 text-sm px-3 py-2 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>
    </template>

    <!-- All -->
    <template v-else>
      <div class="py-2 text-center">
        <p class="font-bold text-white text-sm">Semua Transaksi</p>
        <p class="text-slate-500 text-[11px] mt-0.5">Seluruh riwayat pengeluaran</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { FilterMode } from '@/composables/useListFilter'

const props = defineProps<{
  modelValue: FilterMode
  modes: { value: FilterMode; label: string }[]
  todayStr: string
  selectedDate: string
  selectedLabel: string
  isToday: boolean
  rangeFromDate: string
  rangeToDate: string
  rangeLabel: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: FilterMode]
  'update:selected-date': [value: string]
  'update:range-from-date': [value: string]
  'update:range-to-date': [value: string]
  'prev-day': []
  'next-day': []
  'shift-range': [dir: 1 | -1]
}>()
</script>
