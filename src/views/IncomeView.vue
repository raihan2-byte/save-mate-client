<template>
  <div class="p-4 md:p-8 max-w-3xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-black text-white">Pemasukan</h1>
        <p class="text-slate-500 text-sm mt-0.5">Riwayat penghasilan kamu</p>
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
      <div v-if="loading" class="space-y-3">
        <div v-for="i in 4" :key="i" class="h-14 rounded-xl bg-white/5 animate-pulse" />
      </div>
      <div v-else-if="filteredIncomes.length === 0" class="text-center py-12">
        <p class="text-5xl mb-4">💰</p>
        <p class="text-white font-semibold">Belum ada pemasukan</p>
        <p class="text-slate-500 text-sm mt-1">{{ filterMode === 'all' ? 'Tambahkan sumber penghasilanmu' : 'Tidak ada catatan di periode ini' }}</p>
      </div>
      <div v-else class="space-y-2">
        <!-- Grouped (range/all) -->
        <template v-if="filterMode !== 'single'">
          <div v-for="(group, date) in groupedIncomes" :key="date" class="mb-4">
            <p class="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-2 px-1">{{ formatDateGroup(date) }}</p>
            <div v-for="item in group" :key="item.daily_income_id"
              class="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-lg">💰</div>
                <div>
                  <p class="font-medium text-white text-sm">{{ item.description }}</p>
                  <p class="text-xs text-slate-500">{{ formatDate(item.transaction_date) }}</p>
                </div>
              </div>
              <span class="font-bold text-emerald-400 text-sm tabular-nums">+{{ formatCurrency(item.amount) }}</span>
            </div>
          </div>
        </template>
        <!-- Single day -->
        <template v-else>
          <div v-for="item in filteredIncomes" :key="item.daily_income_id"
            class="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-lg">💰</div>
              <div>
                <p class="font-medium text-white text-sm">{{ item.description }}</p>
                <p class="text-xs text-slate-500">{{ formatDate(item.transaction_date) }}</p>
              </div>
            </div>
            <span class="font-bold text-emerald-400 text-sm tabular-nums">+{{ formatCurrency(item.amount) }}</span>
          </div>
        </template>
      </div>
    </div>

    <!-- Add Income Modal -->
    <Transition name="modal">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" @click.self="closeModal">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeModal" />
        <div class="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 z-10">
          <div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5 md:hidden" />
          <div class="flex items-center justify-between mb-6">
            <h2 class="font-black text-white text-lg">Tambah Pemasukan</h2>
            <button @click="closeModal" class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400">✕</button>
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
              <label class="block text-sm font-medium text-slate-300 mb-1.5">Keterangan <span class="text-slate-600">(min 6 karakter)</span></label>
              <input v-model="form.description" type="text" minlength="6" maxlength="50" class="input-dark" placeholder="Gaji bulanan, freelance, dll." required />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1.5">Tanggal</label>
              <input v-model="form.date" type="date" class="input-dark" required />
            </div>
            <div v-if="error" class="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">{{ error }}</div>
            <div class="flex gap-3 pt-1">
              <button type="button" @click="closeModal" class="btn-secondary flex-1">Batal</button>
              <button type="submit" :disabled="submitting"
                class="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-all disabled:opacity-50">
                {{ submitting ? 'Menyimpan...' : 'Simpan' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- Choice Modal -->
    <Transition name="modal">
      <div v-if="showChoiceModal" class="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div class="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 z-10">
          <div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5 md:hidden" />
          <div class="mb-5">
            <h2 class="font-black text-white text-lg">Mau diapain uangnya?</h2>
            <p class="text-slate-500 text-sm mt-1">Pilih apa yang mau kamu lakukan dengan <span class="text-emerald-400 font-semibold">{{ formatCurrency(pendingAmount) }}</span></p>
          </div>

          <div class="space-y-3">
            <!-- Option 1: Save -->
            <button @click="submitWithChoice('save')"
              :disabled="submitting"
              class="w-full text-left p-4 rounded-2xl border transition-all hover:scale-[1.01] disabled:opacity-50"
              :class="selectedChoice === 'save' ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 bg-white/5 hover:border-emerald-500/50'">
              <div class="flex items-center gap-3">
                <span class="text-2xl">🏦</span>
                <div>
                  <p class="font-bold text-white text-sm">Tabungin</p>
                  <p class="text-emerald-400 text-xs mt-0.5">Tabunganmu bertambah {{ formatCurrency(pendingAmount) }}</p>
                </div>
              </div>
            </button>

            <!-- Option 2: Tomorrow budget -->
            <button @click="submitWithChoice('tomorrow')"
              :disabled="submitting"
              class="w-full text-left p-4 rounded-2xl border transition-all hover:scale-[1.01] disabled:opacity-50"
              :class="selectedChoice === 'tomorrow' ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 bg-white/5 hover:border-emerald-500/50'">
              <div class="flex items-center gap-3">
                <span class="text-2xl">📈</span>
                <div>
                  <p class="font-bold text-white text-sm">Budget besok</p>
                  <p class="text-emerald-400 text-xs mt-0.5">Besok dapat tambahan {{ formatCurrency(pendingAmount) }}</p>
                </div>
              </div>
            </button>

            <!-- Option 3: Spread -->
            <button @click="submitWithChoice('spread')"
              :disabled="submitting"
              class="w-full text-left p-4 rounded-2xl border transition-all hover:scale-[1.01] disabled:opacity-50"
              :class="selectedChoice === 'spread' ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 bg-white/5 hover:border-emerald-500/50'">
              <div class="flex items-center gap-3">
                <span class="text-2xl">📅</span>
                <div>
                  <p class="font-bold text-white text-sm">Bagi rata</p>
                  <p class="text-emerald-400 text-xs mt-0.5">Sisa {{ remainingDays }} hari · +{{ formatCurrency(dailyBonus) }}/hari</p>
                </div>
              </div>
            </button>
          </div>

          <div v-if="choiceError" class="mt-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">{{ choiceError }}</div>

          <button @click="showChoiceModal = false" class="w-full mt-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 text-sm font-medium transition-all">
            Batal
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import api from '@/api'
import { useCurrencyInput } from '@/composables/useCurrencyInput'

const incomes = ref<any[]>([])
const loading = ref(true)
const showModal = ref(false)
const showChoiceModal = ref(false)
const submitting = ref(false)
const error = ref('')
const choiceError = ref('')
const selectedChoice = ref('')
const { displayValue: amountDisplay, numericValue: amountValue, reset: resetAmount } = useCurrencyInput()
const form = ref({ description: '', date: new Date().toISOString().split('T')[0] })

function localStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function addDays(s: string, days: number) {
  const [y, m, d] = s.split('-').map(Number)
  return localStr(new Date(y, m - 1, d + days))
}

const todayStr = localStr(new Date())

// ── Filter state ──────────────────────────────────────────────
type FilterMode = 'single' | 'range' | 'all'
const filterMode = ref<FilterMode>('single')
const modes = [
  { value: 'single', label: 'Tanggal' },
  { value: 'range',  label: 'Rentang' },
  { value: 'all',    label: 'Semua' },
]

const filterDate = ref(todayStr)
const rangeFromDate = ref(addDays(todayStr, -6))
const rangeToDate = ref(todayStr)

const isLatestDay = computed(() => filterDate.value >= todayStr)

const dateLabel = computed(() => {
  const [y, m, d] = filterDate.value.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (filterDate.value === todayStr) return 'Hari Ini'
  if (filterDate.value === addDays(todayStr, -1)) return 'Kemarin'
  return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
})

const rangeLabel = computed(() => {
  const fmt = (s: string) => {
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  }
  return `${fmt(rangeFromDate.value)} – ${fmt(rangeToDate.value)}`
})

function prevDay() { filterDate.value = addDays(filterDate.value, -1) }
function nextDay() { if (!isLatestDay.value) filterDate.value = addDays(filterDate.value, 1) }

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

function setMode(m: FilterMode) { filterMode.value = m }

const filteredIncomes = computed(() => {
  if (filterMode.value === 'all') return incomes.value
  if (filterMode.value === 'single') {
    return incomes.value.filter(i => (i.transaction_date?.split('T')[0] ?? '') === filterDate.value)
  }
  // range
  return incomes.value.filter(i => {
    const d = i.transaction_date?.split('T')[0] ?? ''
    return d >= rangeFromDate.value && d <= rangeToDate.value
  })
})

const totalIncome = computed(() => filteredIncomes.value.reduce((s, i) => s + (i.amount ?? 0), 0))

const groupedIncomes = computed(() => {
  if (filterMode.value === 'single') return {}
  const groups: Record<string, any[]> = {}
  for (const item of filteredIncomes.value) {
    const d = item.transaction_date?.split('T')[0] ?? 'unknown'
    if (!groups[d]) groups[d] = []
    groups[d].push(item)
  }
  return groups
})

// Pending form data waiting for choice
const pendingAmount = ref(0)
const pendingDescription = ref('')
const pendingDate = ref('')

// Computed preview values for "spread" option
const remainingDays = computed(() => {
  const now = new Date()
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const diff = Math.floor((lastDay.getTime() - tomorrow.getTime()) / (1000 * 60 * 60 * 24)) + 1
  return diff < 1 ? 1 : diff
})

const dailyBonus = computed(() => {
  if (remainingDays.value < 1) return pendingAmount.value
  return pendingAmount.value / remainingDays.value
})

function formatCurrency(val: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function openModal() {
  resetAmount()
  form.value = { description: '', date: new Date().toISOString().split('T')[0] }
  error.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

function formatDateGroup(dateStr: string) {
  if (dateStr === todayStr) return 'Hari Ini'
  if (dateStr === addDays(todayStr, -1)) return 'Kemarin'
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

async function loadIncomes() {
  loading.value = true
  try {
    const res = await api.get('/daily-income/')
    const raw = res.data.data
    incomes.value = Array.isArray(raw) ? raw : (raw ? [raw] : [])
  } catch { incomes.value = [] }
  finally { loading.value = false }
}

function handleSubmitForm() {
  if (!amountValue.value || amountValue.value <= 0) {
    error.value = 'Masukkan jumlah yang valid'
    return
  }
  // Store pending data and show choice modal
  pendingAmount.value = amountValue.value
  pendingDescription.value = form.value.description
  pendingDate.value = form.value.date
  selectedChoice.value = ''
  choiceError.value = ''
  showModal.value = false
  showChoiceModal.value = true
}

async function submitWithChoice(choice: string) {
  submitting.value = true
  selectedChoice.value = choice
  choiceError.value = ''
  try {
    await api.post('/daily-income/with-choice', {
      amount: pendingAmount.value,
      description: pendingDescription.value,
      transaction_date: pendingDate.value + 'T00:00:00Z',
      choice,
    })
    showChoiceModal.value = false

    // Jika income untuk hari ini, restore budget besok yang terpotong
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
    if (pendingDate.value === todayStr) {
      restoreTomorrowBudget(pendingAmount.value, todayStr).catch(() => {})
    }

    await loadIncomes()
  } catch (e: any) {
    choiceError.value = e.response?.data?.errors ?? e.response?.data?.message ?? 'Gagal menyimpan'
  } finally {
    submitting.value = false
    selectedChoice.value = ''
  }
}

async function restoreTomorrowBudget(income: number, todayStr: string) {
  const now = new Date()
  const t = new Date(now); t.setDate(t.getDate() + 1)
  const tomorrowStr = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`

  const [todayRes, tomorrowRes] = await Promise.all([
    api.get(`/daily-budget/${todayStr}`),
    api.get(`/daily-budget/${tomorrowStr}`),
  ])

  const todayData = todayRes.data?.data
  const foodPlan: number = todayData?.food_daily_budget ?? 0
  const dailyBudget: number = todayData?.daily_budget ?? 0

  const tomorrowBudgets: any[] = tomorrowRes.data?.data?.budgets ?? []
  const totalCarryover = tomorrowBudgets.reduce((s: number, b: any) => s + (b.carryover_in ?? 0), 0)
  if (totalCarryover >= 0) return // tidak ada potongan, tidak perlu restore

  const tomorrowFood = tomorrowBudgets.find((b: any) => b.category === 'food')
  // Pakai carryover_in langsung — tidak terpengaruh allocated_amount yang bisa salah dari stale data
  const foodCarryover: number = tomorrowFood?.carryover_in ?? 0
  // foodDeficit = seberapa jauh food dipotong dari plan (0 jika tidak dipotong)
  const foodDeficit = Math.max(0, -foodCarryover)

  const calls: Promise<any>[] = []
  let remaining = income

  // Restore food dulu sampai balik ke plan
  if (foodDeficit > 0 && remaining > 0) {
    const foodRestore = Math.min(remaining, foodDeficit)
    calls.push(api.post(`/daily-budget/${todayStr}/carryover`, {
      category: 'food',
      remaining_amount: foodRestore,
      action: 'cut_tomorrow',
    }))
    remaining -= foodRestore
  }

  // Sisa income → lainnya (entertainment, shopping, misc) dibagi rata
  if (remaining > 0.01) {
    for (const cat of ['entertainment', 'shopping', 'misc']) {
      calls.push(api.post(`/daily-budget/${todayStr}/carryover`, {
        category: cat,
        remaining_amount: remaining / 3,
        action: 'cut_tomorrow',
      }))
    }
  }

  await Promise.all(calls)
}

onMounted(loadIncomes)
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
