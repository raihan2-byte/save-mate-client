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

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-black text-white">Transaksi</h1>
        <p class="text-slate-500 text-sm mt-0.5">Riwayat pengeluaran harian</p>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="transactions.length > 0"
          @click="doExportExcel"
          class="flex items-center gap-1.5 text-xs font-semibold px-2 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          title="Export Excel"
        >
          <Download class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">Excel</span>
        </button>
        <AppButton variant="primary" @click="openAddModal" style="box-shadow: 0 0 20px rgba(16,185,129,0.3)">
          ＋ <span class="hidden sm:inline">Tambah</span>
        </AppButton>
      </div>
    </div>

    <!-- Filter card -->
    <DateFilterBar
      v-model="filterMode"
      :modes="modes"
      :today-str="todayStr"
      :selected-date="selectedDate"
      :selected-label="selectedLabel"
      :is-today="isToday"
      :range-from-date="rangeFromDate"
      :range-to-date="rangeToDate"
      :range-label="rangeLabel"
      @prev-day="prevDay"
      @next-day="nextDay"
      @shift-range="shiftRange"
      @update:selected-date="selectedDate = $event"
      @update:range-from-date="rangeFromDate = $event"
      @update:range-to-date="rangeToDate = $event"
      @update:model-value="onFilterModeChange"
    />

    <!-- Summary bar -->
    <div v-if="transactions.length > 0" class="grid grid-cols-2 gap-2 mb-4">
      <div class="glass-card p-3 text-center">
        <p class="text-slate-500 text-[10px] uppercase tracking-widest mb-1">Total Keluar</p>
        <p class="font-black text-red-400 text-base">{{ formatCurrency(totalSpent) }}</p>
      </div>
      <div class="glass-card p-3 text-center">
        <p class="text-slate-500 text-[10px] uppercase tracking-widest mb-1">Transaksi</p>
        <p class="font-black text-white text-base">{{ transactions.length }}x</p>
      </div>
    </div>

    <!-- List card -->
    <div class="glass-card p-5">
      <LoadingSkeleton v-if="loading" :rows="4" />

      <div v-else-if="loadError" class="text-center py-10">
        <p class="text-red-400 font-semibold mb-1">Gagal memuat transaksi</p>
        <p class="text-slate-500 text-sm">{{ loadError }}</p>
        <AppButton variant="outline" class="mt-4" @click="loadTransactions">Coba Lagi</AppButton>
      </div>

      <EmptyState
        v-else-if="transactions.length === 0"
        icon="📭"
        title="Belum ada transaksi"
        :subtitle="filterMode === 'single' && isToday ? 'Tap tombol + untuk mulai mencatat' : 'Tidak ada catatan di periode ini'"
      />

      <div v-else class="space-y-2">
        <!-- Group by date in range/all mode -->
        <template v-if="filterMode !== 'single'">
          <div v-for="(group, date) in groupedTransactions" :key="date" class="mb-4">
            <p class="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-2 px-1">{{ formatDateGroup(String(date)) }}</p>
            <TransactionItem
              v-for="tx in group"
              :key="tx.transaction_id"
              :transaction="tx"
              @edit="openEditModal"
              @delete="onDeleteRequest"
            />
          </div>
        </template>

        <template v-else>
          <TransactionItem
            v-for="tx in transactions"
            :key="tx.transaction_id"
            :transaction="tx"
            @edit="openEditModal"
            @delete="onDeleteRequest"
          />
        </template>
      </div>
    </div>

    <!-- Add / Edit Transaction Form Modal -->
    <TransactionFormModal
      v-model="showFormModal"
      :editing-transaction="editingTransaction"
      @saved="onFormSaved"
    />

    <!-- Ambiguous date modal -->
    <ModalWrapper v-model="showAmbiguousModal">
      <h2 class="font-black text-white text-lg mb-2">Konfirmasi Tanggal</h2>
      <p class="text-slate-400 text-sm mb-6">{{ ambiguous?.message }}</p>
      <div class="flex gap-3">
        <button
          @click="chooseDate(ambiguous!.options.yesterday_date)"
          class="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold text-sm transition-colors"
        >
          Kemarin<br /><span class="text-slate-400 font-normal text-xs">{{ ambiguous?.options.yesterday_date }}</span>
        </button>
        <button
          @click="chooseDate(ambiguous!.options.today_date)"
          class="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-colors"
          style="box-shadow: 0 0 20px rgba(16,185,129,0.3)"
        >
          Hari Ini<br /><span class="font-normal text-xs text-emerald-100">{{ ambiguous?.options.today_date }}</span>
        </button>
      </div>
    </ModalWrapper>

    <!-- Budget Exceeded Modal -->
    <ModalWrapper v-model="showBudgetExceededModal" persistent>
      <div class="flex justify-center mb-4">
        <div class="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-3xl">
          ⚠️
        </div>
      </div>
      <h2 class="font-black text-white text-xl text-center mb-2">Budget Harian Terlampaui</h2>
      <p class="text-slate-400 text-sm text-center mb-1">
        Total pengeluaran hari ini melebihi budget harian sebesar
      </p>
      <p class="text-red-400 font-black text-2xl text-center mb-6">
        {{ new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(budgetExceeded?.deficit ?? 0) }}
      </p>
      <div class="space-y-2 mb-6">
        <!-- Potong Besok card — state changes based on tomorrow capacity -->
        <div class="rounded-2xl p-4 border"
          :class="tomorrowCutCapacity > 0
            ? 'bg-amber-500/5 border-amber-500/20'
            : 'bg-slate-800/60 border-white/5'">
          <template v-if="tomorrowCutCapacity <= 0">
            <p class="text-slate-500 text-sm font-semibold mb-1">Potong jatah besok:</p>
            <p class="text-slate-600 text-xs">Budget besok sudah mencapai batas potongan non-makanan. Pilih potong tabungan.</p>
          </template>
          <template v-else-if="(budgetExceeded?.deficit ?? 0) - tomorrowCutCapacity > 1">
            <!-- True split case: savings portion is at least 1 rupiah -->
            <p class="text-amber-300 text-sm font-semibold mb-1">Potong sebagian ke besok + tabungan:</p>
            <p class="text-slate-400 text-xs">
              <span class="text-white font-semibold">{{ new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(tomorrowCutCapacity) }}</span>
              dipotong dari budget besok, sisanya
              <span class="text-white font-semibold">{{ new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Math.round((budgetExceeded?.deficit ?? 0) - tomorrowCutCapacity)) }}</span>
              dari tabungan.
            </p>
          </template>
          <template v-else>
            <p class="text-amber-300 text-sm font-semibold mb-1">Potong jatah besok:</p>
            <p class="text-slate-400 text-xs">Kekurangan dikurangi dari budget harian besok. Kamu terdorong lebih hemat besoknya.</p>
          </template>
        </div>
        <div class="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-4">
          <p class="text-violet-300 text-sm font-semibold mb-1">Potong dari tabungan:</p>
          <p class="text-slate-400 text-xs">Kekurangan langsung dikurangi dari tabungan bulan ini. Budget besok tetap normal.</p>
        </div>
      </div>
      <div v-if="budgetExceededError" class="mb-3 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
        {{ budgetExceededError }}
      </div>
      <div class="flex gap-3">
        <AppButton variant="outline" class="flex-1" :loading="deductingSavings" @click="deductFromSavings">
          {{ deductingSavings ? 'Memproses...' : '🏦 Potong Tabungan' }}
        </AppButton>
        <AppButton variant="danger" class="flex-1"
          :loading="applyingDeficit"
          :disabled="tomorrowCutCapacity <= 0"
          @click="confirmDeficit">
          {{ applyingDeficit ? 'Memproses...' : tomorrowCutCapacity <= 0 ? '✂️ Penuh' : '✂️ Potong Besok' }}
        </AppButton>
      </div>
    </ModalWrapper>

    <ConfirmModal
      v-model="showDeleteModal"
      title="Hapus Transaksi"
      message="Transaksi ini akan dihapus dan budget hari ini akan diperbarui."
      confirm-label="Hapus"
      :loading="deleteLoading"
      @confirm="confirmDelete"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import ModalWrapper from '@/components/ui/ModalWrapper.vue'
import AppButton from '@/components/ui/AppButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import TransactionFormModal from '@/components/transactions/TransactionFormModal.vue'
import TransactionItem from '@/components/transactions/TransactionItem.vue'
import DateFilterBar from '@/components/transactions/DateFilterBar.vue'
import { formatCurrency, addDays } from '@/utils/formatting'
import { exportTransactionsToExcel } from '@/utils/exportExcel'
import { Loader2, Download } from 'lucide-vue-next'
import { useListFilter } from '@/composables/useListFilter'
import { useDeficit } from '@/composables/useDeficit'
import {
  getToday, getByDate, getByRange,
  addTransactionWithChoice, deleteTransaction,
} from '@/services/transaction.service'
import type { Transaction, AmbiguousResponse } from '@/types'

const {
  todayStr, filterMode, modes,
  selectedDate, isToday, dateLabel: selectedLabel, prevDay, nextDay,
  rangeFromDate, rangeToDate, rangeLabel, shiftRange,
} = useListFilter()

function onFilterModeChange(m: 'single' | 'range' | 'all') {
  filterMode.value = m
  loadTransactions()
}

const transactions = ref<Transaction[]>([])
const loading = ref(true)
const loadError = ref('')
const recalculating = ref(false)

const showFormModal = ref(false)
const editingTransaction = ref<Transaction | null>(null)

const showAmbiguousModal = ref(false)
const ambiguous = ref<AmbiguousResponse | null>(null)
const pendingPayload = ref<Record<string, unknown> | null>(null)

const showDeleteModal = ref(false)
const deletingId = ref('')
const deleteLoading = ref(false)

async function loadTransactions() {
  loading.value = true
  loadError.value = ''
  try {
    if (filterMode.value === 'single') {
      transactions.value = isToday.value ? await getToday() : await getByDate(selectedDate.value)
    } else if (filterMode.value === 'range') {
      transactions.value = await getByRange(rangeFromDate.value, rangeToDate.value)
    } else {
      const now = new Date()
      const from = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`
      transactions.value = await getByRange(from, todayStr)
    }
  } catch (e: unknown) {
    loadError.value = e instanceof Error ? e.message : 'Gagal memuat transaksi'
    transactions.value = []
  } finally {
    loading.value = false
  }
}

async function waitAndReload() {
  recalculating.value = true
  await loadTransactions()
  recalculating.value = false
}

const {
  showBudgetExceededModal, budgetExceeded,
  applyingDeficit, deductingSavings,
  tomorrowCutCapacity, budgetExceededError,
  checkDailyBudgetOverrun, deductFromSavings, confirmDeficit,
} = useDeficit(loadTransactions)

function openAddModal() { editingTransaction.value = null; showFormModal.value = true }
function openEditModal(tx: Transaction) { editingTransaction.value = tx; showFormModal.value = true }
function onDeleteRequest(tx: Transaction) { deletingId.value = tx.transaction_id; showDeleteModal.value = true }

async function confirmDelete() {
  deleteLoading.value = true
  try {
    await deleteTransaction(deletingId.value)
    showDeleteModal.value = false
    await waitAndReload()
    await checkDailyBudgetOverrun()
  } catch (e: unknown) {
    loadError.value = e instanceof Error ? e.message : 'Gagal menghapus transaksi'
  } finally {
    deleteLoading.value = false
  }
}

async function onFormSaved(
  clarification?: { message: string; options: { yesterday_date: string; today_date: string }; originalPayload?: Record<string, unknown> }
) {
  if (clarification) {
    ambiguous.value = clarification as AmbiguousResponse
    pendingPayload.value = clarification.originalPayload ?? null
    showAmbiguousModal.value = true
    return
  }
  await waitAndReload()
  await checkDailyBudgetOverrun()
}

async function chooseDate(date: string) {
  if (!ambiguous.value) return
  try {
    await addTransactionWithChoice({ ...(pendingPayload.value as Record<string, unknown> ?? {}), user_choice_date: date } as Parameters<typeof addTransactionWithChoice>[0])
    showAmbiguousModal.value = false
    ambiguous.value = null
    pendingPayload.value = null
    await loadTransactions()
  } catch {
    showAmbiguousModal.value = false
  }
}

const totalSpent = computed(() => transactions.value.reduce((s, t) => s + (t.amount ?? 0), 0))

const groupedTransactions = computed(() => {
  const groups: Record<string, Transaction[]> = {}
  for (const tx of transactions.value) {
    const date = tx.assigned_date?.split('T')[0] ?? 'unknown'
    if (!groups[date]) groups[date] = []
    groups[date].push(tx)
  }
  return groups
})

function formatDateGroup(dateStr: string) {
  if (dateStr === todayStr) return 'Hari Ini'
  if (dateStr === addDays(todayStr, -1)) return 'Kemarin'
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function doExportExcel() {
  const label = filterMode.value === 'single'
    ? selectedDate.value
    : filterMode.value === 'range'
      ? `${rangeFromDate.value}_sd_${rangeToDate.value}`
      : 'semua'
  exportTransactionsToExcel(transactions.value, label)
}

watch(selectedDate, () => { if (filterMode.value === 'single') loadTransactions() })
watch([rangeFromDate, rangeToDate], () => { if (filterMode.value === 'range') loadTransactions() })

onMounted(async () => {
  await loadTransactions()
  await checkDailyBudgetOverrun()
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
