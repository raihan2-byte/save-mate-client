<template>
  <div class="p-4 md:p-8 max-w-3xl mx-auto">

    <!-- Header -->
    <div class="mb-8">
      <p class="text-slate-500 text-sm">{{ todayDate }}</p>
      <h1 class="text-2xl md:text-3xl font-black text-white mt-1">
        Halo, {{ firstName }} 👋
      </h1>
      <p class="text-slate-400 text-sm mt-1">Ini ringkasan keuanganmu hari ini</p>
    </div>

    <!-- Error state -->
    <p v-if="loadError" class="text-red-400 text-sm text-center mb-6">Gagal memuat data</p>

    <!-- Budget hero card -->
    <DailyBudgetCard
      :budget="budgetPlan"
      :food-tracker="foodTracker"
      :lifestyle-tracker="lifestyleTracker"
      :loading="loadingTx"
      :display-allocated="displayAllocated"
      :display-spent="displaySpent"
    />

    <!-- Stats row -->
    <div class="grid grid-cols-3 gap-3 mb-6">
      <div v-for="stat in summaryStats" :key="stat.label"
        class="glass-card p-4 text-center">
        <p class="text-xl mb-1">{{ stat.icon }}</p>
        <p class="font-black text-white text-sm md:text-base">{{ stat.value }}</p>
        <p class="text-slate-500 text-[10px] md:text-xs mt-0.5">{{ stat.label }}</p>
      </div>
    </div>

    <!-- Food budget card -->
    <div class="glass-card p-5 mb-6">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-lg">🍜</span>
          <p class="font-bold text-white text-sm">Budget Makan Hari Ini</p>
        </div>
        <span class="text-xs font-semibold px-2.5 py-1 rounded-full" :class="foodBadgeClass">
          {{ foodBadgeText }}
        </span>
      </div>
      <div class="bg-white/5 rounded-full h-2 mb-3 overflow-hidden">
        <div class="h-full rounded-full transition-all duration-700"
          :class="foodBarClass"
          :style="{ width: Math.min(foodUsedPct, 100) + '%' }" />
      </div>
      <div class="flex justify-between text-xs text-slate-500">
        <span>Terpakai: <span class="text-white font-medium">{{ formatCurrency(foodSpent) }}</span></span>
        <span>Alokasi: <span class="text-white font-medium">{{ formatCurrencyShort(foodAllocated) }}</span></span>
      </div>
    </div>

    <!-- Tomorrow preview -->
    <TomorrowPreview
      :tomorrow-summary="tomorrowSummary"
      :next-cycle-daily-budget="nextCycleDailyBudget"
      :tomorrow-is-new-cycle="tomorrowIsNewCycle"
      :tomorrow-label="tomorrowLabel"
      :loading="loadingTx"
    />

    <!-- Quick actions -->
    <div class="mb-6">
      <h2 class="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Aksi Cepat</h2>
      <div class="grid grid-cols-2 gap-3">
        <RouterLink v-for="action in quickActions" :key="action.label" :to="action.to"
          class="glass-card p-4 flex items-center gap-3 hover:border-emerald-500/30 hover:-translate-y-0.5 transition-all group">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            :class="action.bg">
            {{ action.icon }}
          </div>
          <div>
            <p class="font-semibold text-white text-sm group-hover:text-emerald-300 transition-colors">{{ action.label }}</p>
            <p class="text-slate-500 text-xs mt-0.5">{{ action.sub }}</p>
          </div>
        </RouterLink>
      </div>
    </div>

    <!-- Carryover modal -->
    <CarryoverModal
      :model-value="showCarryoverModal"
      :carryover-items="carryoverItems"
      :loading="submittingCarryover"
      :yesterday-label="yesterdayLabel"
      @update:model-value="showCarryoverModal = $event"
      @confirm="submitCarryover"
      @set-choice="setChoice"
    />

    <!-- Today's transactions -->
    <div class="glass-card p-5">
      <div class="flex items-center justify-between mb-5">
        <div>
          <h2 class="font-bold text-white">Transaksi Hari Ini</h2>
          <p class="text-slate-500 text-xs mt-0.5">{{ todayTx.length }} transaksi</p>
        </div>
        <RouterLink to="/app/transactions"
          class="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 rounded-lg transition-colors">
          Lihat semua
        </RouterLink>
      </div>

      <!-- Loading -->
      <div v-if="loadingTx" class="space-y-3">
        <div v-for="i in 3" :key="i" class="h-14 rounded-xl bg-white/5 animate-pulse" />
      </div>

      <!-- Empty -->
      <div v-else-if="todayTx.length === 0" class="text-center py-10">
        <p class="text-4xl mb-3">📭</p>
        <p class="text-slate-400 text-sm font-medium">Belum ada transaksi hari ini</p>
        <RouterLink to="/app/transactions"
          class="inline-block mt-4 text-xs text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 rounded-lg hover:bg-emerald-500/20 transition-colors">
          + Tambah Transaksi
        </RouterLink>
      </div>

      <!-- List -->
      <div v-else class="space-y-2">
        <div v-for="tx in todayTx" :key="tx.id ?? tx.transaction_id"
          class="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              :class="tx.type === 'income' ? 'bg-emerald-500/15' : 'bg-red-500/10'">
              {{ tx.type === 'income' ? '⬆️' : '⬇️' }}
            </div>
            <div>
              <p class="text-sm font-medium text-white">{{ tx.description }}</p>
              <p class="text-xs text-slate-500">{{ tx.category || 'Tanpa kategori' }}</p>
            </div>
          </div>
          <span class="font-bold text-sm tabular-nums"
            :class="tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'">
            {{ tx.type === 'income' ? '+' : '-' }}{{ formatCurrency(tx.amount) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Budget history chart -->
    <BudgetHistoryChart class="mt-6" />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePersonalDataStore } from '@/stores/personalData'
import api from '@/api'
import { formatCurrency, formatCurrencyShort } from '@/utils/formatting'
import BudgetHistoryChart from '@/components/BudgetHistoryChart.vue'
import DailyBudgetCard from '@/components/dashboard/DailyBudgetCard.vue'
import TomorrowPreview from '@/components/dashboard/TomorrowPreview.vue'
import CarryoverModal from '@/components/dashboard/CarryoverModal.vue'
import { CATEGORIES } from '@/constants/categories'
import { BUDGET_THRESHOLDS, SAVING_TYPES } from '@/constants/budgetConfig'
import type { DailyStatus, BudgetPlan, Transaction, BudgetTrackerItem } from '@/types'

const auth = useAuthStore()
const pdStore = usePersonalDataStore()

const dailyStatus = ref<DailyStatus | null>(null)
const budgetPlan = ref<BudgetPlan | null>(null)
const todayTx = ref<Transaction[]>([])
const tomorrowStatus = ref<DailyStatus | null>(null)
const loadingTx = ref(true)
const loadError = ref(false)
const paydayDay = ref(0)

// Food budget
const foodTracker = computed<BudgetTrackerItem | undefined>(() =>
  dailyStatus.value?.budgets?.find(b => b.category === 'food')
)
const lifestyleTracker = computed<BudgetTrackerItem | undefined>(() =>
  dailyStatus.value?.budgets?.find(b => b.category !== 'food')
)

const foodAllocated = computed(() => {
  if (foodTracker.value) return foodTracker.value.allocated_amount + (foodTracker.value.carryover_in ?? 0)
  const plan = budgetPlan.value
  if (!plan) return 0
  const midCycleDays = plan.mid_cycle_days ?? 0
  // prefer mid_cycle_days from plan; only fallback to local date calc if plan has no cycle info
  const days = midCycleDays > 0
    ? midCycleDays
    : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  return (plan.food_amount ?? 0) / days
})
const foodSpent = computed(() => foodTracker.value?.actual_spent ?? 0)
const foodRemaining = computed(() => foodAllocated.value - foodSpent.value)
const foodUsedPct = computed(() => foodAllocated.value > 0 ? (foodSpent.value / foodAllocated.value) * 100 : 0)

const foodBadgeClass = computed(() => {
  if (foodRemaining.value < 0) return 'bg-red-500/15 text-red-400'
  if (foodRemaining.value < foodAllocated.value * 0.2) return 'bg-yellow-500/15 text-yellow-400'
  return 'bg-emerald-500/15 text-emerald-400'
})

const foodBadgeText = computed(() =>
  foodRemaining.value < 0 ? 'Over budget' : 'Sisa ' + formatCurrencyShort(foodRemaining.value)
)

const foodBarClass = computed(() => {
  if (foodUsedPct.value > BUDGET_THRESHOLDS.critical) return 'bg-red-400'
  if (foodUsedPct.value > BUDGET_THRESHOLDS.warning) return 'bg-yellow-400'
  return 'bg-emerald-400'
})

// daily_budget dari plan + carryover hari ini
const displayAllocated = computed(() => {
  const base = budgetPlan.value?.daily_budget ?? 0
  const totalCarryover = (dailyStatus.value?.budgets ?? [])
    .reduce((s, b) => s + (b.carryover_in ?? 0), 0)
  return base + totalCarryover
})
const displaySpent = computed(() => dailyStatus.value?.total_spent ?? 0)

// ── Carryover ────────────────────────────────────────────────────
interface CarryoverItem { category: string; remaining: number; choice: string }
const carryoverItems = ref<CarryoverItem[]>([])
const showCarryoverModal = computed({
  get: () => carryoverItems.value.length > 0,
  set: (val: boolean) => { if (!val) carryoverItems.value = [] },
})
const submittingCarryover = ref(false)
const carryoverError = ref('')

// Updated per loadDashboard call so stale-past-midnight is not an issue
const yesterdayStr = ref('')
const yesterdayLabel = ref('')

function setChoice(category: string, action: string) {
  const item = carryoverItems.value.find(i => i.category === category)
  if (item) item.choice = action
}

async function checkYesterdayCarryover() {
  if (!yesterdayStr.value) return
  try {
    const res = await api.get(`/daily-budget/${yesterdayStr.value}`)
    const budgets = (res.data.data?.budgets ?? []) as BudgetTrackerItem[]
    const pending = budgets.filter(b => !b.is_finalized && b.remaining > 0)
    if (pending.length === 0) return

    const hour = new Date().getHours()
    const inWindow = hour >= 22 || hour < 6

    if (inWindow) {
      carryoverItems.value = pending.map(b => ({ category: b.category, remaining: b.remaining, choice: '' }))
    } else {
      await Promise.all(
        pending.map(b =>
          api.post(`/daily-budget/${yesterdayStr.value}/carryover`, {
            category: b.category,
            remaining_amount: b.remaining,
            action: 'save',
          })
        )
      )
      await loadDashboard()
    }
  } catch (e) {
    console.error('checkYesterdayCarryover error', e)
  }
}

async function submitCarryover() {
  const incomplete = carryoverItems.value.find(i => !i.choice)
  if (incomplete) {
    carryoverError.value = 'Pilih opsi untuk semua kategori terlebih dahulu'
    return
  }
  carryoverError.value = ''
  submittingCarryover.value = true
  try {
    await Promise.all(
      carryoverItems.value.map(item =>
        api.post(`/daily-budget/${yesterdayStr.value}/carryover`, {
          category: item.category,
          remaining_amount: item.remaining,
          action: item.choice,
        })
      )
    )
    carryoverItems.value = []
    await loadDashboard()
  } catch (e) {
    console.error('submitCarryover error', e)
    carryoverError.value = 'Gagal menyimpan. Coba lagi.'
  } finally {
    submittingCarryover.value = false
  }
}

const todayDate = ref(new Date().toLocaleDateString('id-ID', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
}))

const firstName = computed(() => auth.user?.username?.split(' ')[0] ?? 'Pengguna')

const summaryStats = computed(() => [
  { icon: '⬇️', value: formatCurrency(displaySpent.value), label: 'Terpakai' },
  { icon: '📅', value: formatCurrency(displayAllocated.value), label: 'Budget/Hari' },
  { icon: '💳', value: todayTx.value.length + 'x', label: 'Transaksi' },
])

const quickActions = [
  { to: '/app/transactions', icon: '➕', label: 'Tambah Transaksi', sub: 'Catat pengeluaran', bg: 'bg-emerald-500/15' },
  { to: '/app/budget',       icon: '📊', label: 'Budget Plan',      sub: 'Lihat rencana',    bg: 'bg-cyan-500/15' },
  { to: '/app/income',       icon: '💰', label: 'Pemasukan',        sub: 'Kelola income',    bg: 'bg-violet-500/15' },
  { to: '/app/summary',      icon: '📈', label: 'Ringkasan',        sub: 'Laporan bulanan',  bg: 'bg-orange-500/15' },
]

// ── Tomorrow budget preview ───────────────────────────────────────
// Computed fresh each loadDashboard call to avoid stale-past-midnight
const tomorrowStr = ref('')
const tomorrowLabel = ref('')
const tomorrowDay = ref(0)

function calcTomorrowSummary(plan: BudgetPlan | null, tomorrowStatusVal: DailyStatus | null) {
  const dailyBudget = plan?.daily_budget ?? 0
  if (!dailyBudget) return null

  const midCycle = plan?.mid_cycle_days ?? 0
  const now = new Date()
  const daysInMonth = midCycle > 0
    ? midCycle
    : new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const foodAlloc = plan?.food_amount
    ? plan.food_amount / daysInMonth
    : (dailyStatus.value?.budgets?.find(b => b.category === 'food')?.allocated_amount ?? 0)
  const othersAllocated = dailyBudget - foodAlloc

  const tomorrowBudgets = tomorrowStatusVal?.budgets ?? []
  const tomorrowFood = tomorrowBudgets.find(b => b.category === 'food')
  const foodCarryover = (tomorrowFood?.carryover_in ?? 0) + (tomorrowFood?.deficit_cut_in ?? 0)
  const othersCarryover = tomorrowBudgets
    .filter(b => b.category !== 'food')
    .reduce((s, b) => s + (b.carryover_in ?? 0) + (b.deficit_cut_in ?? 0), 0)

  const totalCut = foodCarryover + othersCarryover

  const foodEffective = foodAlloc + foodCarryover
  const othersEffectiveRaw = othersAllocated + othersCarryover
  const othersEffective = Math.max(othersEffectiveRaw, 0)
  const totalEffective = foodEffective + othersEffective
  const netCut = totalEffective - dailyBudget

  return {
    foodAllocated: foodAlloc,
    foodCarryover,
    foodEffective,
    othersAllocated,
    othersCarryover,
    othersEffective,
    totalAllocated: dailyBudget,
    totalCut: netCut,
    totalEffective,
    hasAdjustment: totalCut !== 0,
    hasData: true,
  }
}

const tomorrowIsNewCycle = computed(() =>
  paydayDay.value > 0 && tomorrowDay.value === paydayDay.value
)

const nextCycleMandatory = ref(0)

const nextCycleDailyBudget = computed(() => {
  const pd = pdStore.data
  if (!pd) return null
  const salary = pd.salary ?? 0
  if (!salary) return null
  const savingType = (pd.saving_type ?? 'recommendation').toLowerCase()
  const spend = SAVING_TYPES[savingType]?.spend ?? 0.6
  const available = salary - nextCycleMandatory.value
  if (!tomorrowStr.value) return null
  const td = new Date(tomorrowStr.value)
  const daysInMonth = new Date(td.getFullYear(), td.getMonth() + 1, 0).getDate()
  return available > 0 ? Math.round((available * spend) / daysInMonth) : null
})

const tomorrowSummary = computed(() => calcTomorrowSummary(budgetPlan.value, tomorrowStatus.value))

async function loadDashboard() {
  loadError.value = false
  const now = new Date()

  // Recompute date strings fresh each call (guards against stale-past-midnight)
  todayDate.value = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
  const yd = new Date(now); yd.setDate(yd.getDate() - 1)
  yesterdayStr.value = `${yd.getFullYear()}-${String(yd.getMonth()+1).padStart(2,'0')}-${String(yd.getDate()).padStart(2,'0')}`
  yesterdayLabel.value = yd.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
  const tm = new Date(now); tm.setDate(tm.getDate() + 1)
  tomorrowStr.value = `${tm.getFullYear()}-${String(tm.getMonth()+1).padStart(2,'0')}-${String(tm.getDate()).padStart(2,'0')}`
  tomorrowLabel.value = tm.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
  tomorrowDay.value = tm.getDate()

  try {
    await pdStore.fetch()
    const [statusRes, txRes, planRes, tomorrowRes, mandatoryRes] = await Promise.all([
      api.get(`/daily-budget/${today}`).catch(() => null),
      api.get('/transactions/today').catch(() => null),
      api.get(`/budget-plan/${now.getMonth()+1}/${now.getFullYear()}`).catch(() => null),
      api.get(`/daily-budget/${tomorrowStr.value}`).catch(() => null),
      api.get(`/mandatory-expenditure/month/${now.getMonth()+1}/${now.getFullYear()}`).catch(() => null),
    ])
    // Show error only if the critical plan request failed
    if (!planRes) loadError.value = true
    dailyStatus.value = statusRes?.data?.data ?? null
    todayTx.value = txRes?.data?.data ?? []
    budgetPlan.value = planRes?.data?.data ?? null
    tomorrowStatus.value = tomorrowRes?.data?.data ?? null
    paydayDay.value = pdStore.data?.payday_day ?? 0
    nextCycleMandatory.value = mandatoryRes?.data?.data?.total ?? 0
  } catch {
    loadError.value = true
  } finally {
    loadingTx.value = false
  }
}

onMounted(async () => {
  api.post('/budget-plan/check-reset').catch(() => null)
  await loadDashboard()
  await checkYesterdayCarryover()
})

onActivated(loadDashboard)
</script>
