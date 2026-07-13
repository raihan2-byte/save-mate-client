<template>
  <div>
    <!-- Add form -->
    <div v-if="showAdd" class="bg-white/3 border border-white/10 rounded-2xl p-4 mb-4 space-y-3">
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        <button
          v-for="cat in MANDATORY_CATEGORIES"
          :key="cat.value"
          type="button"
          @click="addForm.category = cat.value"
          class="py-2 px-1 rounded-xl border text-center text-xs transition-all"
          :class="addForm.category === cat.value
            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
            : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'"
        >
          {{ cat.icon }} {{ cat.label }}
        </button>
      </div>
      <div class="relative">
        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">Rp</span>
        <input
          :value="addAmountDisplay"
          @input="onAmountInput"
          type="text"
          inputmode="numeric"
          class="input-dark pl-10"
          placeholder="0"
        />
      </div>
      <input
        v-model="addForm.description"
        type="text"
        class="input-dark"
        placeholder="Kost, ojek, WiFi..."
        maxlength="100"
      />
      <p v-if="addWouldExceed" class="text-red-400 text-xs">
        🚫 Akan melebihi gaji. Sisa yang bisa dialokasikan: {{ fmtCur(salaryRemaining) }}
      </p>

      <!-- Step 2: pilih cycle -->
      <div v-if="showCycleChoice" class="rounded-xl border border-white/15 bg-white/5 p-3 space-y-2">
        <p class="text-slate-300 text-xs font-semibold">Pengeluaran ini berlaku mulai kapan?</p>
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            @click="confirmAdd('current')"
            :disabled="adding"
            class="py-3 px-3 rounded-xl border border-emerald-500/50 bg-emerald-500/10 text-left hover:bg-emerald-500/20 transition-colors"
          >
            <span class="block text-emerald-300 font-bold text-sm">📅 Cycle Ini</span>
            <span class="block text-emerald-400/70 text-[11px] mt-0.5">Potong tabungan sekarang</span>
          </button>
          <button
            type="button"
            @click="confirmAdd('next')"
            :disabled="adding"
            class="py-3 px-3 rounded-xl border border-violet-500/50 bg-violet-500/10 text-left hover:bg-violet-500/20 transition-colors"
          >
            <span class="block text-violet-300 font-bold text-sm">🗓️ Cycle Depan</span>
            <span class="block text-violet-400/70 text-[11px] mt-0.5">Dicatat, berlaku gajian depan</span>
          </button>
        </div>
        <button
          type="button"
          class="text-slate-500 text-xs hover:text-slate-300 transition-colors"
          @click="showCycleChoice = false"
        >← Kembali edit</button>
      </div>

      <div v-if="!showCycleChoice" class="flex gap-2">
        <AppButton variant="outline" size="sm" class="flex-1" @click="cancelAdd">Batal</AppButton>
        <AppButton
          variant="primary"
          size="sm"
          class="flex-1"
          :disabled="!addFormValid"
          :loading="adding"
          @click="submitAdd"
        >
          Tambah
        </AppButton>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 3" :key="i" class="h-12 rounded-xl bg-white/5 animate-pulse" />
    </div>

    <!-- Empty -->
    <div v-else-if="items.length === 0 && !showAdd" class="text-center py-6 text-slate-500 text-sm">
      Belum ada pengeluaran wajib
    </div>

    <!-- List -->
    <div v-else class="space-y-2">
      <div
        v-for="item in items"
        :key="item.mandatory_expenditure_id"
        class="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
      >
        <span class="text-xl flex-shrink-0">{{ catIcon(item.category) }}</span>
        <div class="flex-1 min-w-0">
          <p class="text-white text-sm font-medium truncate">{{ item.description }}</p>
          <div class="flex items-center gap-1.5">
            <p class="text-slate-500 text-xs">{{ catLabel(item.category) }}</p>
            <span
              v-if="item.for_month === nextMonth && item.for_year === nextYear"
              class="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-medium"
            >Cycle depan</span>
          </div>
        </div>
        <span class="font-bold text-sm tabular-nums text-red-400 flex-shrink-0">{{ fmtCur(item.amount) }}</span>
        <AppButton
          variant="danger"
          size="sm"
          class="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
          @click="emit('delete', item.mandatory_expenditure_id)"
        >
          🗑️
        </AppButton>
      </div>

      <div v-if="items.length > 0" class="flex justify-between items-center pt-3 mt-2 border-t border-white/10">
        <span class="text-slate-400 text-sm font-medium">Total Wajib</span>
        <span class="font-black text-white">{{ fmtCur(totalMandatory) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import { MANDATORY_CATEGORIES } from '@/constants/categories'

export interface MandatoryExpenditure {
  mandatory_expenditure_id: string
  category: string
  description: string
  amount: number
  for_month?: number
  for_year?: number
}

const props = defineProps<{
  items: MandatoryExpenditure[]
  loading: boolean
  adding?: boolean
  salary: number
  showAdd: boolean
  nextMonth: number
  nextYear: number
}>()

const emit = defineEmits<{
  'add': [item: { category: string; description: string; amount: number; forMonth: number; forYear: number }]
  'delete': [id: string]
  'update:showAdd': [val: boolean]
}>()

const addForm = ref({ category: '', description: '' })
const addAmountDisplay = ref('')
const addAmountValue = ref(0)
const showCycleChoice = ref(false)

const totalMandatory = computed(() => props.items.reduce((s, e) => s + (e.amount ?? 0), 0))
const salaryRemaining = computed(() => props.salary - totalMandatory.value)
const addWouldExceed = computed(() =>
  addAmountValue.value > 0 && (totalMandatory.value + addAmountValue.value) >= props.salary
)
const addFormValid = computed(() =>
  addForm.value.category &&
  addAmountValue.value > 0 &&
  addForm.value.description.trim().length >= 3 &&
  !addWouldExceed.value
)

const catMeta = Object.fromEntries(MANDATORY_CATEGORIES.map(c => [c.value, c]))
function catIcon(cat: string) { return catMeta[cat]?.icon ?? '📦' }
function catLabel(cat: string) { return catMeta[cat]?.label ?? cat }

function onAmountInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(/\./g, '').replace(/[^\d]/g, '')
  const numeric = Number(raw)
  addAmountValue.value = numeric
  addAmountDisplay.value = raw ? String(numeric).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''
}

function cancelAdd() {
  addForm.value = { category: '', description: '' }
  addAmountDisplay.value = ''
  addAmountValue.value = 0
  showCycleChoice.value = false
  emit('update:showAdd', false)
}

function submitAdd() {
  if (!addFormValid.value) return
  showCycleChoice.value = true
}

function confirmAdd(cycle: 'current' | 'next') {
  const now = new Date()
  const forMonth = cycle === 'current' ? now.getMonth() + 1 : props.nextMonth
  const forYear = cycle === 'current' ? now.getFullYear() : props.nextYear
  emit('add', {
    category: addForm.value.category,
    description: addForm.value.description,
    amount: addAmountValue.value,
    forMonth,
    forYear,
  })
  addForm.value = { category: '', description: '' }
  addAmountDisplay.value = ''
  addAmountValue.value = 0
  showCycleChoice.value = false
}

function fmtCur(val: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}
</script>
