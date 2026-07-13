<template>
  <div key="s2">
    <div class="glass-card p-5 mb-4">
      <div v-if="items.length === 0" class="text-center py-6 text-slate-500 text-sm">
        Belum ada pengeluaran wajib. Tap tombol di bawah untuk tambah.
      </div>
      <div v-else class="space-y-2 mb-4">
        <div v-for="(item, idx) in items" :key="idx"
          class="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
          <span class="text-xl flex-shrink-0">{{ catMeta[item.category]?.icon ?? '📦' }}</span>
          <div class="flex-1 min-w-0">
            <p class="text-white text-sm font-medium truncate">{{ item.description }}</p>
            <p class="text-slate-500 text-xs">{{ catMeta[item.category]?.label }}</p>
          </div>
          <span class="text-emerald-400 font-bold text-sm tabular-nums flex-shrink-0">{{ fmtCur(item.amount) }}</span>
          <button @click="removeItem(idx)" class="text-slate-600 hover:text-red-400 transition-colors ml-1">✕</button>
        </div>
      </div>
      <div class="flex justify-between items-center px-1 py-2 border-t border-white/10 mt-2">
        <span class="text-slate-400 text-sm">Total Wajib</span>
        <span class="font-black" :class="availableNegative ? 'text-red-400' : 'text-white'">{{ fmtCur(totalMandatory) }}</span>
      </div>
      <div class="flex justify-between items-center px-1 pb-1">
        <span class="text-slate-500 text-xs">Sisa untuk dikelola</span>
        <span class="font-bold text-sm" :class="availableNegative ? 'text-red-400' : 'text-emerald-400'">{{ fmtCur(available) }}</span>
      </div>
      <div v-if="availableNegative" class="mt-3 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
        <span class="text-base flex-shrink-0">🚫</span>
        <p class="text-red-300 text-xs">Pengeluaran wajib melebihi gaji. Hapus atau kurangi beberapa item.</p>
      </div>
    </div>

    <div class="glass-card p-5 mb-4">
      <p class="text-white font-semibold text-sm mb-3">＋ Tambah Pengeluaran Wajib</p>
      <div class="space-y-3">
        <div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
          <button v-for="cat in MANDATORY_CATEGORIES" :key="cat.value" type="button"
            @click="addForm.category = cat.value"
            class="flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-xs transition-all"
            :class="addForm.category === cat.value
              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
              : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'">
            <span class="text-base">{{ cat.icon }}</span>
            {{ cat.label }}
          </button>
        </div>
        <div class="relative">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">Rp</span>
          <input :value="addAmountDisplay" type="text" inputmode="numeric"
            class="input-dark pl-10" placeholder="0" @input="syncAmount" />
        </div>
        <input v-model="addForm.description" type="text" class="input-dark"
          placeholder="Kost, ojek bulanan, WiFi, dll." maxlength="100" />
        <p v-if="addAmountValue > 0 && (totalMandatory + addAmountValue) >= salary" class="text-red-400 text-xs">
          ⚠️ Akan melebihi gaji (sisa: {{ fmtCur(salary - totalMandatory) }})
        </p>
        <AppButton
          variant="outline"
          size="md"
          class="w-full !rounded-xl !bg-emerald-500/20 !border-emerald-500/30 !text-emerald-300 hover:!bg-emerald-500/30"
          :disabled="!addFormValid || (totalMandatory + addAmountValue) >= salary"
          @click="pushMandatory">
          Tambah
        </AppButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import { MANDATORY_CATEGORIES } from '@/constants/categories'

export interface MandatoryItem { category: string; amount: number; description: string }

const props = defineProps<{
  items: MandatoryItem[]
  salary: number
}>()

const emit = defineEmits<{
  'update:items': [value: MandatoryItem[]]
}>()

const catMeta: Record<string, { icon: string; label: string }> = Object.fromEntries(
  MANDATORY_CATEGORIES.map(c => [c.value, { icon: c.icon, label: c.label }])
)

const addForm = ref({ category: '', description: '' })
const addAmountDisplay = ref('')
const addAmountValue = ref(0)

function syncAmount(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(/\D/g, '')
  const numeric = raw ? parseInt(raw, 10) : 0
  addAmountValue.value = numeric
  addAmountDisplay.value = numeric ? numeric.toLocaleString('id-ID') : ''
}

const addFormValid = computed(() =>
  addForm.value.category && addAmountValue.value > 0 && addForm.value.description.trim().length >= 3
)

const totalMandatory = computed(() => props.items.reduce((s, i) => s + i.amount, 0))
const available = computed(() => props.salary - totalMandatory.value)
const availableNegative = computed(() => available.value < 0)

function removeItem(idx: number) {
  const updated = [...props.items]
  updated.splice(idx, 1)
  emit('update:items', updated)
}

function pushMandatory() {
  if (!addFormValid.value) return
  if ((totalMandatory.value + addAmountValue.value) >= props.salary) return
  emit('update:items', [
    ...props.items,
    {
      category: addForm.value.category,
      amount: addAmountValue.value,
      description: addForm.value.description.trim(),
    },
  ])
  addForm.value = { category: '', description: '' }
  addAmountDisplay.value = ''
  addAmountValue.value = 0
}

function fmtCur(val: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Math.abs(val))
}
</script>
