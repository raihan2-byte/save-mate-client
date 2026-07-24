<template>
  <div class="p-4 md:p-8 max-w-3xl mx-auto relative">

    <!-- Recalculating overlay -->
    <Transition name="fade">
      <div v-if="recalculating"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div class="glass-card px-6 py-4 flex items-center gap-3">
          <Loader2 class="animate-spin w-5 h-5 text-emerald-400" />
          <span class="text-white text-sm font-medium">Menghitung ulang budget...</span>
        </div>
      </div>
    </Transition>

    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-black text-white">Pemasukan</h1>
        <p class="text-slate-500 text-sm mt-0.5">Riwayat penghasilan kamu</p>
      </div>
      <AppButton variant="primary" class="shadow-glow-emerald" @click="openModal">
        ＋ Tambah
      </AppButton>
    </div>

    <!-- Filter card -->
    <div class="glass-card p-4 mb-4">
      <!-- Mode chips -->
      <div class="flex gap-2 mb-4">
        <button v-for="m in modes" :key="m.value" @click="setMode(m.value)"
          class="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
          :class="filterMode === m.value
            ? 'bg-emerald-500 text-white'
            : 'bg-white/5 text-slate-400 hover:bg-white/10'">
          {{ m.label }}
        </button>
      </div>

      <!-- Single day -->
      <template v-if="filterMode === 'single'">
        <div class="flex items-center gap-3 mb-3">
          <button @click="prevDay"
            class="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 transition-colors flex-shrink-0">‹</button>
          <div class="flex-1 text-center">
            <p class="font-bold text-white text-sm">{{ dateLabel }}</p>
          </div>
          <button @click="nextDay" :disabled="isLatestDay"
            class="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 transition-colors flex-shrink-0 disabled:opacity-30 disabled:pointer-events-none">›</button>
        </div>
        <input type="date" v-model="filterDate" :max="todayStr"
          class="w-full rounded-xl border border-white/10 bg-white/5 text-slate-300 text-sm px-4 py-2.5 focus:outline-none focus:border-emerald-500/50" />
      </template>

      <!-- Range -->
      <template v-else-if="filterMode === 'range'">
        <div class="flex items-center gap-3 mb-3">
          <button @click="shiftRange(-1)"
            class="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 transition-colors flex-shrink-0">‹</button>
          <div class="flex-1 text-center">
            <p class="font-bold text-white text-sm">{{ rangeLabel }}</p>
          </div>
          <button @click="shiftRange(1)" :disabled="rangeToDate >= todayStr"
            class="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 transition-colors flex-shrink-0 disabled:opacity-30 disabled:pointer-events-none">›</button>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <p class="text-slate-500 text-[10px] uppercase tracking-widest mb-1 ml-1">Dari</p>
            <input type="date" v-model="rangeFromDate" :max="rangeToDate"
              class="w-full rounded-xl border border-white/10 bg-white/5 text-slate-300 text-sm px-3 py-2 focus:outline-none focus:border-emerald-500/50" />
          </div>
          <div>
            <p class="text-slate-500 text-[10px] uppercase tracking-widest mb-1 ml-1">Sampai</p>
            <input type="date" v-model="rangeToDate" :min="rangeFromDate" :max="todayStr"
              class="w-full rounded-xl border border-white/10 bg-white/5 text-slate-300 text-sm px-3 py-2 focus:outline-none focus:border-emerald-500/50" />
          </div>
        </div>
      </template>

      <!-- All -->
      <template v-else>
        <div class="py-2 text-center">
          <p class="font-bold text-white text-sm">Semua Pemasukan</p>
          <p class="text-slate-500 text-[11px] mt-0.5">Seluruh riwayat penghasilan</p>
        </div>
      </template>
    </div>

    <!-- Total -->
    <div v-if="filteredIncomes.length > 0" class="grid grid-cols-2 gap-3 mb-4">
      <div class="glass-card p-3 text-center">
        <p class="text-slate-500 text-[10px] uppercase tracking-widest mb-1">Total Masuk</p>
        <p class="font-black text-emerald-400 text-base">+{{ formatCurrency(totalIncome) }}</p>
      </div>
      <div class="glass-card p-3 text-center">
        <p class="text-slate-500 text-[10px] uppercase tracking-widest mb-1">Transaksi</p>
        <p class="font-black text-white text-base">{{ filteredIncomes.length }}x</p>
      </div>
    </div>

    <div class="glass-card p-5">
      <LoadingSkeleton v-if="loading" :rows="4" height="h-14" />
      <EmptyState
        v-else-if="filteredIncomes.length === 0"
        icon="💰"
        title="Belum ada pemasukan"
        :subtitle="filterMode === 'all' ? 'Tambahkan sumber penghasilanmu' : 'Tidak ada catatan di periode ini'"
      />
      <div v-else class="space-y-2">
        <!-- Grouped (range/all) -->
        <template v-if="filterMode !== 'single'">
          <div v-for="(group, date) in groupedIncomes" :key="date" class="mb-4">
            <p class="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-2 px-1">{{ formatDateGroup(String(date)) }}</p>
            <IncomeItem
              v-for="item in group"
              :key="item.daily_income_id"
              :income="item"
              @delete="deleteIncome(item.daily_income_id)"
            />
          </div>
        </template>
        <!-- Single day -->
        <template v-else>
          <IncomeItem
            v-for="item in filteredIncomes"
            :key="item.daily_income_id"
            :income="item"
            @delete="deleteIncome(item.daily_income_id)"
          />
        </template>
      </div>
    </div>

    <!-- Add Income Modal -->
    <ModalWrapper v-model="showModal">
      <div class="flex items-center justify-between mb-6">
        <h2 class="font-black text-white text-lg">Tambah Pemasukan</h2>
        <button @click="showModal = false" class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400">✕</button>
      </div>
      <form @submit.prevent="handleSubmitForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-1.5">Jumlah (Rp)</label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">Rp</span>
            <input v-model="amountDisplay" type="text" inputmode="numeric" class="input-dark pl-10" placeholder="0" required />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-1.5">
            Keterangan <span class="text-slate-500 font-normal">(opsional)</span>
          </label>
          <input v-model="form.description" type="text" maxlength="50" class="input-dark" placeholder="Gaji bulanan, freelance, dll." />
          <div class="flex flex-wrap gap-1.5 mt-2">
            <button
              v-for="preset in INCOME_DESCRIPTION_PRESETS"
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
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-1.5">Tanggal</label>
          <input :value="form.date" type="date" class="input-dark opacity-70 cursor-not-allowed" readonly disabled />
          <p class="text-slate-500 text-xs mt-1.5">Pemasukan selalu dicatat untuk hari ini.</p>
        </div>
        <div v-if="error" class="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">{{ error }}</div>
        <div class="flex gap-3 pt-1">
          <AppButton variant="outline" class="flex-1" @click="showModal = false">Batal</AppButton>
          <AppButton type="submit" variant="primary" class="flex-1" :loading="submitting">
            {{ submitting ? 'Menyimpan...' : 'Simpan' }}
          </AppButton>
        </div>
      </form>
    </ModalWrapper>

    <!-- Choice Modal -->
    <IncomeChoiceModal
      v-model="showChoiceModal"
      :income="pendingIncome"
      :cycle-info="cycleInfo"
      :submitting="submitting"
      :selected-choice="selectedChoice"
      :selected-spread-days="selectedSpreadDays"
      :error="choiceError"
      @confirm="handleChoiceConfirm"
    />

    <ConfirmModal
      v-model="showDeleteModal"
      title="Hapus Pemasukan"
      :message="deleteError || 'Pemasukan ini akan dihapus dan efek pada budget besok akan dikembalikan ke semula.'"
      icon="💰"
      confirm-label="Hapus"
      :loading="deleteLoading"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCurrencyInput } from '@/composables/useCurrencyInput'
import { usePersonalDataStore } from '@/stores/personalData'
import { useIncome } from '@/composables/useIncome'
import ConfirmModal from '@/components/ConfirmModal.vue'
import ModalWrapper from '@/components/ui/ModalWrapper.vue'
import AppButton from '@/components/ui/AppButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import IncomeItem from '@/components/income/IncomeItem.vue'
import IncomeChoiceModal from '@/components/income/IncomeChoiceModal.vue'
import { formatCurrency, toLocaleDateStr, addDays as addDaysUtil } from '@/utils/formatting'
import { INCOME_DESCRIPTION_PRESETS } from '@/constants/categories'
import type { Income } from '@/types/index'
import { Loader2 } from 'lucide-vue-next'

const {
  incomes, loading, submitting, deleteLoading, recalculating,
  error, choiceError, deleteError,
  loadIncomes, confirmDelete: doConfirmDelete, handleChoiceConfirm: doChoiceConfirm,
} = useIncome()

const pdStore = usePersonalDataStore()
const { displayValue: amountDisplay, numericValue: amountValue, reset: resetAmount } = useCurrencyInput()

const showModal = ref(false)
const showChoiceModal = ref(false)
const showDeleteModal = ref(false)
const deletingIncomeId = ref('')
const selectedChoice = ref('')
const selectedSpreadDays = ref(0)
const daysLeftInCycle = ref(30)
const form = ref({ description: '', date: new Date().toISOString().split('T')[0] })
const pendingIncome = ref<Income | null>(null)

const todayStr = toLocaleDateStr(new Date())
function addDays(s: string, days: number) { return addDaysUtil(s, days) }

type FilterMode = 'single' | 'range' | 'all'
const filterMode = ref<FilterMode>('single')
const modes: { value: FilterMode; label: string }[] = [
  { value: 'single', label: 'Tanggal' },
  { value: 'range',  label: 'Rentang' },
  { value: 'all',    label: 'Semua' },
]
const filterDate = ref(todayStr)
const rangeFromDate = ref(addDays(todayStr, -6))
const rangeToDate = ref(todayStr)
const isLatestDay = computed(() => filterDate.value >= todayStr)
const dateLabel = computed(() => {
  if (filterDate.value === todayStr) return 'Hari Ini'
  if (filterDate.value === addDays(todayStr, -1)) return 'Kemarin'
  const [y, m, d] = filterDate.value.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
})
const rangeLabel = computed(() => {
  const fmt = (s: string) => { const [y,m,d] = s.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) }
  return `${fmt(rangeFromDate.value)} – ${fmt(rangeToDate.value)}`
})
function prevDay() { filterDate.value = addDays(filterDate.value, -1) }
function nextDay() { if (!isLatestDay.value) filterDate.value = addDays(filterDate.value, 1) }
function shiftRange(dir: number) {
  const days = Math.max(1, Math.round((new Date(rangeToDate.value).getTime() - new Date(rangeFromDate.value).getTime()) / 86400000) + 1)
  const newFrom = addDays(rangeFromDate.value, dir * days)
  const newTo = addDays(rangeToDate.value, dir * days)
  if (newTo > todayStr) return
  rangeFromDate.value = newFrom; rangeToDate.value = newTo
}
function setMode(m: FilterMode) { filterMode.value = m }

const filteredIncomes = computed(() => {
  if (filterMode.value === 'all') return incomes.value
  if (filterMode.value === 'single') return incomes.value.filter(i => (i.transaction_date?.split('T')[0] ?? '') === filterDate.value)
  return incomes.value.filter(i => { const d = i.transaction_date?.split('T')[0] ?? ''; return d >= rangeFromDate.value && d <= rangeToDate.value })
})
const totalIncome = computed(() => filteredIncomes.value.reduce((s, i) => s + (i.amount ?? 0), 0))
const groupedIncomes = computed(() => {
  if (filterMode.value === 'single') return {} as Record<string, Income[]>
  const groups: Record<string, Income[]> = {}
  for (const item of filteredIncomes.value) {
    const d = item.transaction_date?.split('T')[0] ?? 'unknown'
    if (!groups[d]) groups[d] = []
    groups[d].push(item)
  }
  return groups
})

function openModal() {
  resetAmount(); form.value = { description: '', date: new Date().toISOString().split('T')[0] }; error.value = ''; showModal.value = true
}
function formatDateGroup(dateStr: string) {
  if (dateStr === todayStr) return 'Hari Ini'
  if (dateStr === addDays(todayStr, -1)) return 'Kemarin'
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
function deleteIncome(incomeId: string) { deletingIncomeId.value = incomeId; showDeleteModal.value = true }
async function confirmDelete() {
  const ok = await doConfirmDelete(deletingIncomeId.value)
  if (ok) showDeleteModal.value = false
}
function handleSubmitForm() {
  if (!amountValue.value || amountValue.value <= 0) { error.value = 'Masukkan jumlah yang valid'; return }
  pendingIncome.value = {
    daily_income_id: '',
    amount: amountValue.value,
    description: form.value.description.trim() || 'Pemasukan',
    transaction_date: todayStr, // income is always recorded for today
    choice: '',
  }
  selectedChoice.value = ''; choiceError.value = ''; showModal.value = false; showChoiceModal.value = true
}
async function handleChoiceConfirm(choice: string, spreadDays?: number) {
  selectedChoice.value = choice
  if (spreadDays !== undefined) selectedSpreadDays.value = spreadDays
  const ok = await doChoiceConfirm(pendingIncome.value, choice, spreadDays)
  if (ok) { showChoiceModal.value = false; pendingIncome.value = null }
}

const cycleInfo = computed(() => ({ daysLeft: daysLeftInCycle.value, nextPayday: '' }))

onMounted(async () => {
  await pdStore.fetch()
  const pd = pdStore.data
  if (pd?.payday_day) {
    const now = new Date()
    const payday = pd.payday_day
    const nextPayday = new Date(now.getFullYear(), now.getMonth(), payday)
    if (nextPayday <= now) nextPayday.setMonth(nextPayday.getMonth() + 1)
    daysLeftInCycle.value = Math.ceil((nextPayday.getTime() - now.getTime()) / 86400000)
  }
  await loadIncomes()
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
