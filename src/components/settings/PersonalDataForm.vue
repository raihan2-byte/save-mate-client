<template>
  <div class="space-y-4">
    <!-- View mode -->
    <div v-if="!editing" class="space-y-3">
      <div class="flex justify-between items-center py-2 border-b border-white/5">
        <span class="text-slate-400 text-sm">Penghasilan Bulanan</span>
        <span class="font-bold text-emerald-400">{{ fmtCur(modelValue.salary) }}</span>
      </div>
      <div class="flex justify-between items-center py-2 border-b border-white/5">
        <span class="text-slate-400 text-sm">Gaya Menabung</span>
        <span class="font-semibold text-white">{{ savingLabel }}</span>
      </div>
      <div class="flex justify-between items-center py-2">
        <span class="text-slate-400 text-sm">Tujuan</span>
        <span class="font-medium text-white text-sm text-right max-w-[60%]">{{ modelValue.purpose }}</span>
      </div>
    </div>

    <!-- Edit mode -->
    <div v-else class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-1.5">Penghasilan Bulanan (Rp)</label>
        <div class="relative">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">Rp</span>
          <input
            :value="salaryDisplay"
            @input="onSalaryInput"
            type="text"
            inputmode="numeric"
            class="input-dark pl-10"
            placeholder="5.000.000"
          />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-300 mb-2">Gaya Menabung</label>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            v-for="opt in SAVING_OPTIONS"
            :key="opt.value"
            type="button"
            @click="emit('update:modelValue', { ...modelValue, savingType: opt.value })"
            class="py-2 px-2 rounded-xl border text-xs font-semibold transition-all"
            :class="modelValue.savingType === opt.value
              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
              : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'"
          >
            {{ opt.icon }} {{ opt.label }}
          </button>
        </div>
        <p v-if="savePctLabel" class="text-slate-500 text-xs mt-1.5">{{ savePctLabel }}</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-300 mb-1.5">Tujuan</label>
        <input
          :value="modelValue.purpose"
          @input="emit('update:modelValue', { ...modelValue, purpose: ($event.target as HTMLInputElement).value })"
          type="text"
          maxlength="50"
          class="input-dark"
        />
      </div>

      <p v-if="validationError" class="text-red-400 text-xs">{{ validationError }}</p>

      <AppButton
        variant="primary"
        size="lg"
        class="w-full"
        :loading="saving"
        @click="emit('save')"
      >
        {{ saving ? 'Menyimpan & menghitung ulang...' : '💾 Simpan & Hitung Ulang Budget' }}
      </AppButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useBudgetConfigStore } from '@/stores/budgetConfig'

export interface PersonalDataFormData {
  salary: number
  savingType: string
  purpose: string
}

const props = defineProps<{
  modelValue: PersonalDataFormData
  editing: boolean
  saving: boolean
  salaryDisplay: string
  validationError?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: PersonalDataFormData]
  'save': []
  'update:salaryDisplay': [value: string]
}>()

const SAVING_OPTIONS = [
  { value: 'frugal',         icon: '🧊', label: 'Frugal' },
  { value: 'recommendation', icon: '✅', label: 'Rekomendasi' },
  { value: 'normal',         icon: '😊', label: 'Normal' },
]

const SAVING_LABELS: Record<string, string> = {
  frugal: '🧊 Frugal',
  recommendation: '✅ Rekomendasi',
  normal: '😊 Normal',
}

const savingLabel = computed(() => SAVING_LABELS[props.modelValue.savingType] ?? props.modelValue.savingType)

const budgetConfig = useBudgetConfigStore()
const savePctLabel = computed(() => {
  const ratio = budgetConfig.ratioFor(props.modelValue.savingType)
  if (!props.modelValue.savingType || !ratio) return ''
  return `Menabung ${Math.round(ratio.save * 100)}% gaji bersih`
})

function onSalaryInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(/\./g, '').replace(/[^\d]/g, '')
  const numeric = Number(raw)
  const formatted = raw ? String(numeric).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''
  emit('update:salaryDisplay', formatted)
  emit('update:modelValue', { ...props.modelValue, salary: numeric })
}

function fmtCur(val: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}
</script>
