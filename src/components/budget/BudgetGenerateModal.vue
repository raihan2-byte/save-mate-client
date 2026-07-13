<template>
  <ModalWrapper :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <div class="flex items-center justify-between mb-6">
      <h2 class="font-black text-white text-lg">{{ currentPlan ? 'Hitung Ulang Budget' : 'Buat Budget' }}</h2>
      <button @click="emit('update:modelValue', false)" class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400">✕</button>
    </div>
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-1.5">Gaya Menabung</label>
        <select v-model="form.saving_type" class="input-dark" required>
          <option value="" disabled>Pilih gaya</option>
          <option value="frugal">🧊 Frugal — Hemat ketat</option>
          <option value="recommendation">✅ Rekomendasi — Seimbang</option>
          <option value="normal">😊 Normal — Santai</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-1.5">Wilayah / Kota</label>
        <input v-model="form.region" type="text" class="input-dark" placeholder="Jakarta, Bandung, dll." required />
      </div>
      <div v-if="error" class="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">{{ error }}</div>
      <div class="flex gap-3 pt-1">
        <AppButton variant="outline" class="flex-1" @click="emit('update:modelValue', false)">Batal</AppButton>
        <AppButton type="submit" variant="primary" class="flex-1" :loading="generating">
          {{ generating ? 'Membuat...' : '✨ Buat' }}
        </AppButton>
      </div>
    </form>
  </ModalWrapper>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ModalWrapper from '@/components/ui/ModalWrapper.vue'
import AppButton from '@/components/ui/AppButton.vue'
import api from '@/api'
import type { BudgetPlan } from '@/types/index'

const props = defineProps<{
  modelValue: boolean
  currentPlan: BudgetPlan | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  generated: []
}>()

const form = ref({ saving_type: '', region: '' })
const generating = ref(false)
const error = ref('')

async function handleSubmit() {
  generating.value = true
  error.value = ''
  const month = props.currentPlan?.for_month ?? (new Date().getMonth() + 1)
  const year = props.currentPlan?.for_year ?? new Date().getFullYear()
  try {
    await api.post('/budget-plan/', {
      for_month: month,
      for_year: year,
      saving_type: form.value.saving_type,
      region: form.value.region,
    })
    emit('update:modelValue', false)
    emit('generated')
  } catch (e: any) {
    error.value = e.response?.data?.errors ?? e.response?.data?.message ?? 'Gagal membuat budget'
  } finally {
    generating.value = false
  }
}
</script>
