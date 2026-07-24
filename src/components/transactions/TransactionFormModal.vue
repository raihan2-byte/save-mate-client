<template>
  <ModalWrapper :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <div class="flex items-center justify-between mb-6">
      <h2 class="font-black text-white text-lg">
        {{ editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi' }}
      </h2>
      <button
        @click="emit('update:modelValue', false)"
        class="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors"
      >✕</button>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Amount -->
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-1.5">Jumlah (Rp)</label>
        <div class="relative">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">Rp</span>
          <input
            v-model="amountDisplay"
            type="text"
            inputmode="numeric"
            class="input-dark pl-10"
            placeholder="0"
            required
          />
        </div>
      </div>

      <!-- Category -->
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-1.5">Kategori</label>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="cat in CATEGORY_LIST"
            :key="cat.value"
            type="button"
            @click="form.category = cat.value"
            class="py-2 rounded-xl border text-sm font-medium transition-all"
            :class="form.category === cat.value
              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
              : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'"
          >
            {{ cat.emoji }} {{ cat.label }}
          </button>
        </div>
      </div>

      <!-- Description -->
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-1.5">
          Keterangan <span class="text-slate-500 font-normal">(opsional)</span>
        </label>
        <input
          v-model="form.description"
          type="text"
          class="input-dark"
          placeholder="Makan siang, bensin, dll."
        />
        <!-- Quick-fill suggestions for the selected category -->
        <div v-if="descriptionPresets.length" class="flex flex-wrap gap-1.5 mt-2">
          <button
            v-for="preset in descriptionPresets"
            :key="preset"
            type="button"
            @click="form.description = preset"
            class="text-xs px-2.5 py-1 rounded-full border transition-colors"
            :class="form.description === preset
              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
              : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'"
          >
            {{ preset }}
          </button>
        </div>
      </div>

      <!-- Error -->
      <div
        v-if="formError"
        class="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3"
      >{{ formError }}</div>

      <div class="flex gap-3 pt-1">
        <AppButton variant="outline" class="flex-1" @click="emit('update:modelValue', false)">Batal</AppButton>
        <AppButton type="submit" variant="primary" class="flex-1" :loading="submitting">
          {{ submitting ? 'Menyimpan...' : 'Simpan' }}
        </AppButton>
      </div>
    </form>
  </ModalWrapper>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import ModalWrapper from '@/components/ui/ModalWrapper.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useCurrencyInput } from '@/composables/useCurrencyInput'
import { CATEGORY_LIST, CATEGORIES, DESCRIPTION_PRESETS } from '@/constants/categories'
import api from '@/api'
import type { Transaction } from '@/types'

const props = defineProps<{
  modelValue: boolean
  editingTransaction: Transaction | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: [requiresClarification?: { message: string; options: { yesterday_date: string; today_date: string }; originalPayload?: Record<string, unknown> }]
}>()

const submitting = ref(false)
const formError = ref('')
const form = ref({ description: '', category: '' })

const descriptionPresets = computed(() => DESCRIPTION_PRESETS[form.value.category] ?? [])

// Fall back to the category label when the user leaves description empty.
function resolvedDescription() {
  const desc = form.value.description.trim()
  if (desc) return desc
  return CATEGORIES[form.value.category]?.label ?? 'Pengeluaran'
}

const {
  displayValue: amountDisplay,
  numericValue: amountValue,
  reset: resetAmount,
  setValue: setAmount,
} = useCurrencyInput()

// Populate form when modal opens or editingTransaction changes
watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    formError.value = ''
    if (props.editingTransaction) {
      form.value = {
        description: props.editingTransaction.description || '',
        category: props.editingTransaction.category,
      }
      setAmount(props.editingTransaction.amount)
    } else {
      form.value = { description: '', category: '' }
      resetAmount()
    }
  }
)

async function handleSubmit() {
  submitting.value = true
  formError.value = ''
  try {
    if (props.editingTransaction) {
      await api.put(`/transactions/${props.editingTransaction.transaction_id}`, {
        amount: amountValue.value,
        description: resolvedDescription(),
        category: form.value.category,
      })
      emit('update:modelValue', false)
      emit('saved')
    } else {
      const payload = {
        amount: amountValue.value,
        category: form.value.category,
        description: resolvedDescription(),
        input_timestamp: new Date().toISOString(),
      }
      const res = await api.post('/transactions/add', payload)
      if (res.data?.data?.requires_clarification) {
        emit('update:modelValue', false)
        emit('saved', { ...res.data.data, originalPayload: payload })
        return
      }
      emit('update:modelValue', false)
      emit('saved')
    }
  } catch (e: any) {
    formError.value = e.response?.data?.errors ?? e.response?.data?.message ?? 'Gagal menyimpan transaksi'
  } finally {
    submitting.value = false
  }
}
</script>
