<template>
  <div class="p-4 md:p-8 max-w-3xl mx-auto">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-black text-white">Transaksi</h1>
        <p class="text-slate-500 text-sm mt-0.5">Riwayat pengeluaran harian</p>
      </div>
      <button @click="openModal"
        class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition-all hover:scale-105"
        style="box-shadow: 0 0 20px rgba(16,185,129,0.3)">
        ＋ Tambah
      </button>
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
            class="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 transition-colors flex-shrink-0">
            ‹
          </button>
          <div class="flex-1 text-center">
            <p class="font-bold text-white text-sm">{{ selectedLabel }}</p>
          </div>
          <button @click="nextDay" :disabled="isToday"
            class="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 transition-colors flex-shrink-0 disabled:opacity-30 disabled:pointer-events-none">
            ›
          </button>
        </div>
        <input type="date" v-model="selectedDate" :max="todayStr"
          class="w-full rounded-xl border border-white/10 bg-white/5 text-slate-300 text-sm px-4 py-2.5 focus:outline-none focus:border-emerald-500/50" />
      </template>

      <!-- Range -->
      <template v-else-if="filterMode === 'range'">
        <div class="flex items-center gap-3 mb-3">
          <button @click="shiftRange(-1)"
            class="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 transition-colors flex-shrink-0">
            ‹
          </button>
          <div class="flex-1 text-center">
            <p class="font-bold text-white text-sm">{{ rangeLabel }}</p>
          </div>
          <button @click="shiftRange(1)" :disabled="rangeToDate >= todayStr"
            class="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 transition-colors flex-shrink-0 disabled:opacity-30 disabled:pointer-events-none">
            ›
          </button>
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
          <p class="font-bold text-white text-sm">Semua Transaksi</p>
          <p class="text-slate-500 text-[11px] mt-0.5">Seluruh riwayat pengeluaran</p>
        </div>
      </template>
    </div>

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
      <div v-if="loading" class="space-y-3">
        <div v-for="i in 4" :key="i" class="h-16 rounded-xl bg-white/5 animate-pulse" />
      </div>

      <div v-else-if="transactions.length === 0" class="text-center py-14">
        <p class="text-5xl mb-4">📭</p>
        <p class="text-white font-semibold">Belum ada transaksi</p>
        <p class="text-slate-500 text-sm mt-1">
          {{ filterMode === 'single' && isToday ? 'Tap tombol + untuk mulai mencatat' : 'Tidak ada catatan di periode ini' }}
        </p>
      </div>

      <div v-else class="space-y-2">
        <!-- Group by date in range/all mode -->
        <template v-if="filterMode !== 'single'">
          <div v-for="(group, date) in groupedTransactions" :key="date" class="mb-4">
            <p class="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-2 px-1">{{ formatDateGroup(date) }}</p>
            <div v-for="tx in group" :key="tx.transaction_id"
              class="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-red-500/10">
                  {{ categoryEmoji(tx.category) }}
                </div>
                <div>
                  <p class="font-medium text-white text-sm">{{ tx.description || '—' }}</p>
                  <p class="text-xs text-slate-500">{{ categoryLabel(tx.category) }}</p>
                </div>
              </div>
              <span class="font-bold text-sm tabular-nums text-red-400">-{{ formatCurrency(tx.amount) }}</span>
            </div>
          </div>
        </template>

        <template v-else>
          <div v-for="tx in transactions" :key="tx.transaction_id"
            class="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-red-500/10">
                {{ categoryEmoji(tx.category) }}
              </div>
              <div>
                <p class="font-medium text-white text-sm">{{ tx.description || '—' }}</p>
                <p class="text-xs text-slate-500">{{ categoryLabel(tx.category) }}</p>
              </div>
            </div>
            <span class="font-bold text-sm tabular-nums text-red-400">-{{ formatCurrency(tx.amount) }}</span>
          </div>
        </template>
      </div>
    </div>

    <!-- Add Modal -->
    <Transition name="modal">
      <div v-if="showModal"
        class="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
        @click.self="showModal = false">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showModal = false" />

        <div class="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 z-10">
          <div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5 md:hidden" />
          <div class="flex items-center justify-between mb-6">
            <h2 class="font-black text-white text-lg">Tambah Transaksi</h2>
            <button @click="showModal = false" class="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors">✕</button>
          </div>

          <form @submit.prevent="handleAdd" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1.5">Jumlah (Rp)</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">Rp</span>
                <input v-model="amountDisplay" type="text" inputmode="numeric" class="input-dark pl-10" placeholder="0" required />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1.5">Keterangan</label>
              <input v-model="form.description" type="text" class="input-dark" placeholder="Makan siang, bensin, dll." />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1.5">Kategori</label>
              <select v-model="form.category" class="input-dark" required>
                <option value="" disabled>Pilih kategori</option>
                <option value="food">🍔 Makanan</option>
                <option value="entertainment">🎮 Hiburan</option>
                <option value="shopping">🛍️ Belanja</option>
                <option value="misc">📦 Lainnya</option>
              </select>
            </div>

            <div v-if="error" class="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">{{ error }}</div>

            <div class="flex gap-3 pt-1">
              <button type="button" @click="showModal = false" class="btn-secondary flex-1">Batal</button>
              <button type="submit" :disabled="submitting"
                class="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-all disabled:opacity-50">
                {{ submitting ? 'Menyimpan...' : 'Simpan' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- Ambiguous date modal -->
    <Transition name="modal">
      <div v-if="ambiguous"
        class="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div class="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 z-10">
          <div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5 md:hidden" />
          <h2 class="font-black text-white text-lg mb-2">Konfirmasi Tanggal</h2>
          <p class="text-slate-400 text-sm mb-6">{{ ambiguous.message }}</p>
          <div class="flex gap-3">
            <button @click="chooseDate(ambiguous.options.yesterday_date)"
              class="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold text-sm transition-colors">
              Kemarin<br /><span class="text-slate-400 font-normal text-xs">{{ ambiguous.options.yesterday_date }}</span>
            </button>
            <button @click="chooseDate(ambiguous.options.today_date)"
              class="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-colors"
              style="box-shadow: 0 0 20px rgba(16,185,129,0.3)">
              Hari Ini<br /><span class="font-normal text-xs text-emerald-100">{{ ambiguous.options.today_date }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
    <!-- Budget Exceeded Modal -->
    <Transition name="modal">
      <div v-if="budgetExceeded"
        class="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div class="relative w-full max-w-md rounded-3xl border border-red-500/20 bg-slate-900 p-6 z-10">
          <div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5 md:hidden" />

          <!-- Icon -->
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
            {{ new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(budgetExceeded.deficit) }}
          </p>

          <div class="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 mb-6">
            <p class="text-amber-300 text-sm font-semibold mb-1">Jika potong jatah besok:</p>
            <p class="text-slate-400 text-xs">Kekurangan ini akan dikurangi dari budget harian kamu besok. Ini mendorong kamu lebih hemat besoknya.</p>
          </div>

          <div class="flex gap-3">
            <button @click="budgetExceeded = null"
              class="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-sm transition-colors">
              Biarkan Saja
            </button>
            <button @click="confirmDeficit" :disabled="applyingDeficit"
              class="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold text-sm transition-colors disabled:opacity-50">
              {{ applyingDeficit ? 'Memproses...' : 'Potong Besok' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import api from '@/api'
import { useCurrencyInput } from '@/composables/useCurrencyInput'

const CATEGORY_MAP: Record<string, { label: string; emoji: string }> = {
  food:          { label: 'Makanan',  emoji: '🍔' },
  entertainment: { label: 'Hiburan',  emoji: '🎮' },
  shopping:      { label: 'Belanja',  emoji: '🛍️' },
  misc:          { label: 'Lainnya',  emoji: '📦' },
}

function localDateStr(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(dateStr: string, days: number) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return localDateStr(new Date(y, m - 1, d + days))
}

const todayStr = localDateStr(new Date())

// ── Filter state ──────────────────────────────────────────────
type FilterMode = 'single' | 'range' | 'all'
const filterMode = ref<FilterMode>('single')
const modes = [
  { value: 'single', label: 'Tanggal' },
  { value: 'range',  label: 'Rentang' },
  { value: 'all',    label: 'Semua' },
]

// Single mode
const selectedDate = ref(todayStr)
const isToday = computed(() => selectedDate.value === todayStr)

const selectedLabel = computed(() => {
  const [y, m, d] = selectedDate.value.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (selectedDate.value === todayStr) return 'Hari Ini'
  if (selectedDate.value === addDays(todayStr, -1)) return 'Kemarin'
  return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
})

function prevDay() {
  selectedDate.value = addDays(selectedDate.value, -1)
}
function nextDay() {
  if (isToday.value) return
  selectedDate.value = addDays(selectedDate.value, 1)
}

// Range mode
const rangeFromDate = ref(addDays(todayStr, -6))
const rangeToDate = ref(todayStr)

const rangeLabel = computed(() => {
  const fmt = (s: string) => {
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  }
  return `${fmt(rangeFromDate.value)} – ${fmt(rangeToDate.value)}`
})

function shiftRange(dir: number) {
  const days = Math.max(1, Math.round(
    (new Date(rangeToDate.value).getTime() - new Date(rangeFromDate.value).getTime()) / 86400000
  ) + 1)
  const newFrom = addDays(rangeFromDate.value, dir * days)
  const newTo = addDays(rangeToDate.value, dir * days)
  if (newTo > todayStr) return
  rangeFromDate.value = newFrom
  rangeToDate.value = newTo
}

function setMode(m: FilterMode) {
  filterMode.value = m
  loadTransactions()
}

// ── Data ──────────────────────────────────────────────────────
const transactions = ref<any[]>([])
const loading = ref(true)
const showModal = ref(false)
const submitting = ref(false)
const error = ref('')
const ambiguous = ref<any>(null)
const pendingForm = ref<any>(null)

// Budget exceeded modal
const budgetExceeded = ref<{ category: string; deficit: number } | null>(null)
const applyingDeficit = ref(false)

const { displayValue: amountDisplay, numericValue: amountValue, reset: resetAmount } = useCurrencyInput()
const form = ref({ description: '', category: '' })

const totalSpent = computed(() => transactions.value.reduce((s, t) => s + (t.amount ?? 0), 0))

const groupedTransactions = computed(() => {
  const groups: Record<string, any[]> = {}
  for (const tx of transactions.value) {
    const date = tx.assigned_date?.split('T')[0] ?? tx.assigned_date ?? 'unknown'
    if (!groups[date]) groups[date] = []
    groups[date].push(tx)
  }
  return groups
})

function categoryEmoji(cat: string) { return CATEGORY_MAP[cat]?.emoji ?? '💸' }
function categoryLabel(cat: string) { return CATEGORY_MAP[cat]?.label ?? cat }

function formatCurrency(val: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

function formatDateGroup(dateStr: string) {
  if (dateStr === todayStr) return 'Hari Ini'
  if (dateStr === addDays(todayStr, -1)) return 'Kemarin'
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function openModal() {
  resetAmount()
  form.value = { description: '', category: '' }
  error.value = ''
  showModal.value = true
}

async function loadTransactions() {
  loading.value = true
  try {
    let res
    if (filterMode.value === 'single') {
      const endpoint = isToday.value ? '/transactions/today' : `/transactions/date/${selectedDate.value}`
      res = await api.get(endpoint)
    } else if (filterMode.value === 'range') {
      res = await api.get(`/transactions/range?from=${rangeFromDate.value}&to=${rangeToDate.value}`)
    } else {
      res = await api.get('/transactions/range')
    }
    transactions.value = res.data.data ?? []
  } catch { transactions.value = [] }
  finally { loading.value = false }
}

watch(selectedDate, () => { if (filterMode.value === 'single') loadTransactions() })
watch([rangeFromDate, rangeToDate], () => { if (filterMode.value === 'range') loadTransactions() })

async function checkBudgetAfterAdd(category: string) {
  try {
    const today = localDateStr(new Date())
    const res = await api.get(`/daily-budget/${today}`)
    const data = res.data?.data
    // daily_budget dari plan — tidak terpengaruh tracker mana yang ada di DB
    const dailyBudget = data?.daily_budget ?? data?.total_allocated ?? 0
    const totalSpent = data?.total_spent ?? 0
    const deficit = totalSpent - dailyBudget
    if (deficit > 0) {
      budgetExceeded.value = { category, deficit }
    }
  } catch {}
}

async function handleAdd() {
  submitting.value = true
  error.value = ''
  try {
    const payload = {
      amount: amountValue.value,
      category: form.value.category,
      description: form.value.description,
      input_timestamp: new Date().toISOString(),
    }
    const res = await api.post('/transactions/add', payload)

    if (res.data?.data?.requires_clarification) {
      pendingForm.value = payload
      ambiguous.value = res.data.data
      showModal.value = false
      return
    }

    showModal.value = false
    await loadTransactions()
    await checkBudgetAfterAdd(form.value.category)
  } catch (e: any) {
    error.value = e.response?.data?.errors ?? e.response?.data?.message ?? 'Gagal menyimpan transaksi'
  } finally { submitting.value = false }
}

async function confirmDeficit() {
  if (!budgetExceeded.value) return
  applyingDeficit.value = true
  try {
    const today = localDateStr(new Date())
    const statusRes = await api.get(`/daily-budget/${today}`)
    const data = statusRes.data?.data

    const dailyBudget: number = data?.daily_budget ?? 0
    const foodDailyBudget: number = data?.food_daily_budget ?? 0
    const nonFoodDailyBudget = dailyBudget - foodDailyBudget

    const deficit = budgetExceeded.value.deficit
    const calls: Promise<any>[] = []
    let remaining = deficit

    // Potong dari non-food dulu (entertainment, shopping, misc) — food dilindungi
    if (nonFoodDailyBudget > 0) {
      const cutFromNonFood = Math.min(deficit, nonFoodDailyBudget)
      // Distribusi merata ke 3 kategori non-food
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

    // Kalau deficit > non-food, potong sisanya dari food
    if (remaining > 0.01) {
      calls.push(api.post(`/daily-budget/${today}/carryover`, {
        category: 'food',
        remaining_amount: -remaining,
        action: 'cut_tomorrow',
      }))
    }

    await Promise.all(calls)
  } catch {} finally {
    applyingDeficit.value = false
    budgetExceeded.value = null
  }
}

async function chooseDate(date: string) {
  if (!pendingForm.value) return
  try {
    await api.post('/transactions/add-with-choice', {
      ...pendingForm.value,
      user_choice_date: date,
    })
    ambiguous.value = null
    pendingForm.value = null
    await loadTransactions()
  } catch {
    ambiguous.value = null
  }
}

onMounted(loadTransactions)
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
