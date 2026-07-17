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
          class="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
        >
          <Download class="w-3.5 h-3.5" />
          Excel
        </button>
        <AppButton variant="primary" @click="openAddModal" style="box-shadow: 0 0 20px rgba(16,185,129,0.3)">
          ＋ Tambah
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
    <div v-if="transactions.length > 0" class="grid grid-cols-2 gap-3 mb-4">
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
    <ModalWrapper v-model="showBudgetExceededModal">
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
        <div class="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
          <p class="text-amber-300 text-sm font-semibold mb-1">Potong jatah besok:</p>
          <p class="text-slate-400 text-xs">Kekurangan dikurangi dari budget harian besok. Kamu terdorong lebih hemat besoknya.</p>
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
        <AppButton variant="danger" class="flex-1" :loading="applyingDeficit" @click="confirmDeficit">
          {{ applyingDeficit ? 'Memproses...' : '✂️ Potong Besok' }}
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
import api from '@/api'
import ConfirmModal from '@/components/ConfirmModal.vue'
import ModalWrapper from '@/components/ui/ModalWrapper.vue'
import AppButton from '@/components/ui/AppButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import TransactionFormModal from '@/components/transactions/TransactionFormModal.vue'
import TransactionItem from '@/components/transactions/TransactionItem.vue'
import DateFilterBar from '@/components/transactions/DateFilterBar.vue'
import { formatCurrency, toLocaleDateStr, addDays } from '@/utils/formatting'
import { extractError } from '@/utils/errors'
import { exportTransactionsToExcel } from '@/utils/exportExcel'
import { Loader2, Download } from 'lucide-vue-next'
import { useListFilter } from '@/composables/useListFilter'
import type { Transaction } from '@/types'

const {
  todayStr,
  filterMode, modes,
  selectedDate, isToday, dateLabel: selectedLabel, prevDay, nextDay,
  rangeFromDate, rangeToDate, rangeLabel, shiftRange,
} = useListFilter()

function onFilterModeChange(m: 'single' | 'range' | 'all') {
  filterMode.value = m
  loadTransactions()
}

// ── Data ──────────────────────────────────────────────────────
const transactions = ref<Transaction[]>([])
const loading = ref(true)
const loadError = ref('')

// Form modal (add + edit combined)
const showFormModal = ref(false)
const editingTransaction = ref<Transaction | null>(null)

// Ambiguous date clarification
const showAmbiguousModal = ref(false)
const ambiguous = ref<{ message: string; options: { yesterday_date: string; today_date: string } } | null>(null)
const pendingPayload = ref<Record<string, unknown> | null>(null)
const budgetExceededError = ref('')

// Budget exceeded modal
const showBudgetExceededModal = ref(false)
const budgetExceeded = ref<{ category: string; deficit: number } | null>(null)
const applyingDeficit = ref(false)
const deductingSavings = ref(false)

const recalculating = ref(false)

// Delete state
const showDeleteModal = ref(false)
const deletingId = ref('')
const deleteLoading = ref(false)

function openAddModal() {
  editingTransaction.value = null
  showFormModal.value = true
}

function openEditModal(tx: Transaction) {
  editingTransaction.value = tx
  showFormModal.value = true
}

function onDeleteRequest(tx: Transaction) {
  deletingId.value = tx.transaction_id
  showDeleteModal.value = true
}

async function waitAndReload() {
  recalculating.value = true
  await loadTransactions()
  recalculating.value = false
}

async function confirmDelete() {
  deleteLoading.value = true
  try {
    await api.delete(`/transactions/${deletingId.value}`)
    showDeleteModal.value = false
    await waitAndReload()
  } catch (e: unknown) {
    loadError.value = extractError(e, 'Gagal menghapus transaksi')
  } finally {
    deleteLoading.value = false
  }
}

function onFormSaved(
  clarification?: { message: string; options: { yesterday_date: string; today_date: string }; originalPayload?: Record<string, unknown> }
) {
  if (clarification) {
    ambiguous.value = clarification
    pendingPayload.value = clarification.originalPayload ?? null
    showAmbiguousModal.value = true
    return
  }
  waitAndReload().then(() => {
    if (!editingTransaction.value) {
      checkDailyBudgetOverrun()
    }
  })
}

const totalSpent = computed(() => transactions.value.reduce((s, t) => s + (t.amount ?? 0), 0))

const groupedTransactions = computed(() => {
  const groups: Record<string, Transaction[]> = {}
  for (const tx of transactions.value) {
    const date = tx.assigned_date?.split('T')[0] ?? tx.assigned_date ?? 'unknown'
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

async function loadTransactions() {
  loading.value = true
  loadError.value = ''
  try {
    let res
    if (filterMode.value === 'single') {
      const endpoint = isToday.value ? '/transactions/today' : `/transactions/date/${selectedDate.value}`
      res = await api.get(endpoint)
    } else if (filterMode.value === 'range') {
      res = await api.get(`/transactions/range?from=${rangeFromDate.value}&to=${rangeToDate.value}`)
    } else {
      // cap "all" mode to current month to avoid unbounded payload
      const now = new Date()
      const from = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`
      const to = todayStr
      res = await api.get(`/transactions/range?from=${from}&to=${to}`)
    }
    transactions.value = res.data.data ?? []
  } catch (e: unknown) {
    loadError.value = extractError(e, 'Gagal memuat transaksi')
    transactions.value = []
  } finally {
    loading.value = false
  }
}

watch(selectedDate, () => { if (filterMode.value === 'single') loadTransactions() })
watch([rangeFromDate, rangeToDate], () => { if (filterMode.value === 'range') loadTransactions() })

async function checkDailyBudgetOverrun() {
  if (localStorage.getItem(deficitHandledKey())) return
  try {
    const today = toLocaleDateStr(new Date())
    const res = await api.get(`/daily-budget/${today}`)
    const data = res.data?.data
    const dailyBudget = data?.daily_budget ?? data?.total_allocated ?? 0
    const totalSpentVal = data?.total_spent ?? 0
    const totalDeficit = totalSpentVal - dailyBudget
    if (totalDeficit > 0) {
      budgetExceeded.value = { category: '', deficit: totalDeficit }
      budgetExceededError.value = ''
      showBudgetExceededModal.value = true
    }
  } catch {}
}

async function deductFromSavings() {
  if (!budgetExceeded.value) return
  deductingSavings.value = true
  budgetExceededError.value = ''
  try {
    await api.post('/summary/deduct-savings', { amount: budgetExceeded.value.deficit })
    localStorage.setItem(deficitHandledKey(), 'true')
    showBudgetExceededModal.value = false
    budgetExceeded.value = null
  } catch (e: any) {
    budgetExceededError.value = e.response?.data?.message ?? 'Gagal memotong tabungan. Coba lagi.'
  } finally {
    deductingSavings.value = false
  }
}

async function confirmDeficit() {
  if (!budgetExceeded.value) return
  applyingDeficit.value = true
  try {
    const today = toLocaleDateStr(new Date())
    const tomorrow = addDays(today, 1)

    const [statusRes, tomorrowRes] = await Promise.all([
      api.get(`/daily-budget/${today}`),
      api.get(`/daily-budget/${tomorrow}`),
    ])
    const data = statusRes.data?.data
    const tomorrowBudgets: Array<{ category: string; carryover_in?: number }> = tomorrowRes.data?.data?.budgets ?? []

    const dailyBudget: number = data?.daily_budget ?? 0
    const foodDailyBudget: number = data?.food_daily_budget ?? 0
    const nonFoodDailyBudget = dailyBudget - foodDailyBudget

    const incomeNonFoodCarryover = tomorrowBudgets
      .filter(b => b.category !== 'food')
      .reduce((s, b) => s + (b.carryover_in ?? 0), 0)
    const incomeFoodCarryover = tomorrowBudgets.find(b => b.category === 'food')?.carryover_in ?? 0

    const nonFoodCapacity = nonFoodDailyBudget + incomeNonFoodCarryover
    const foodCapacity = foodDailyBudget + incomeFoodCarryover

    const totalSpentVal: number = data?.total_spent ?? 0
    const deficit = Math.max(totalSpentVal - dailyBudget, 0)
    const calls: Promise<unknown>[] = []
    let remaining = deficit

    if (nonFoodCapacity > 0.01 && remaining > 0.01) {
      const cutFromNonFood = Math.min(remaining, nonFoodCapacity)
      const nonFoodCats = ['entertainment', 'shopping', 'misc']
      for (const cat of nonFoodCats) {
        const cut = cutFromNonFood / nonFoodCats.length
        if (cut > 0.01) {
          calls.push(api.post(`/daily-budget/${today}/carryover`, {
            category: cat,
            remaining_amount: -cut,
            action: 'cut_tomorrow',
          }))
        }
      }
      remaining -= cutFromNonFood
    }

    if (remaining > 0.01 && foodCapacity > 0.01) {
      calls.push(api.post(`/daily-budget/${today}/carryover`, {
        category: 'food',
        remaining_amount: -Math.min(remaining, foodCapacity),
        action: 'cut_tomorrow',
      }))
    }

    await Promise.all(calls)
    localStorage.setItem(deficitHandledKey(), 'true')
    showBudgetExceededModal.value = false
    budgetExceeded.value = null
  } catch (e: any) {
    budgetExceededError.value = e.response?.data?.message ?? 'Gagal memotong budget besok. Coba lagi.'
  } finally {
    applyingDeficit.value = false
  }
}

async function chooseDate(date: string) {
  if (!pendingPayload.value && !ambiguous.value) return
  try {
    await api.post('/transactions/add-with-choice', {
      ...(pendingPayload.value ?? {}),
      user_choice_date: date,
    })
    showAmbiguousModal.value = false
    ambiguous.value = null
    pendingPayload.value = null
    await loadTransactions()
  } catch {
    showAmbiguousModal.value = false
  }
}

function doExportExcel() {
  const label = filterMode.value === 'single'
    ? selectedDate.value
    : filterMode.value === 'range'
      ? `${rangeFromDate.value}_sd_${rangeToDate.value}`
      : 'semua'
  exportTransactionsToExcel(transactions.value, label)
}

function deficitHandledKey() {
  return `deficit_handled_${toLocaleDateStr(new Date())}`
}

onMounted(async () => {
  await loadTransactions()
  await checkDailyBudgetOverrun()
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
