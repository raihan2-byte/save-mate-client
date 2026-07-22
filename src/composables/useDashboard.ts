import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePersonalDataStore } from '@/stores/personalData'
import { getDailyStatus, getEndDayStatus } from '@/services/budget.service'
import { getToday } from '@/services/transaction.service'
import { getPlanByMonth } from '@/services/plan.service'
import { getMandatoryByMonth } from '@/services/mandatory.service'
import { toLocaleDateStr, addDays, formatCurrency, formatCurrencyShort } from '@/utils/formatting'
import { BUDGET_THRESHOLDS, SAVING_TYPES } from '@/constants/budgetConfig'
import type { DailyStatus, BudgetPlan, Transaction, BudgetTrackerItem, EndDayChoice } from '@/types'

export function useDashboard() {
  const auth = useAuthStore()
  const pdStore = usePersonalDataStore()

  const dailyStatus = ref<DailyStatus | null>(null)
  const budgetPlan = ref<BudgetPlan | null>(null)
  const todayTx = ref<Transaction[]>([])
  const tomorrowStatus = ref<DailyStatus | null>(null)
  const loadingTx = ref(true)
  const loadError = ref(false)
  const paydayDay = ref(0)
  const nextCycleMandatory = ref(0)
  const endDayChoice = ref<EndDayChoice | null>(null)

  const todayStr = ref('')
  const todayDate = ref('')
  const todayLabel = ref('')
  const yesterdayStr = ref('')
  const tomorrowStr = ref('')
  const tomorrowLabel = ref('')
  const tomorrowDay = ref(0)

  const firstName = computed(() => auth.user?.username?.split(' ')[0] ?? 'Pengguna')

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
    const now = new Date()
    const days = midCycleDays > 0
      ? midCycleDays
      : new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
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

  const displayAllocated = computed(() => {
    const base = budgetPlan.value?.daily_budget ?? 0
    const totalCarryover = (dailyStatus.value?.budgets ?? []).reduce((s, b) => s + (b.carryover_in ?? 0), 0)
    return base + totalCarryover
  })
  const displaySpent = computed(() => dailyStatus.value?.total_spent ?? 0)
  const totalRemaining = computed(() => dailyStatus.value?.total_remaining ?? 0)

  const tomorrowIsNewCycle = computed(() =>
    paydayDay.value > 0 && tomorrowDay.value === paydayDay.value
  )

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

  const tomorrowSummary = computed(() => {
    const plan = budgetPlan.value
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

    const tomorrowBudgets = tomorrowStatus.value?.budgets ?? []
    const tomorrowFood = tomorrowBudgets.find(b => b.category === 'food')
    const foodCarryover = (tomorrowFood?.carryover_in ?? 0) + (tomorrowFood?.deficit_cut_in ?? 0)
    const othersCarryover = tomorrowBudgets
      .filter(b => b.category !== 'food')
      .reduce((s, b) => s + (b.carryover_in ?? 0) + (b.deficit_cut_in ?? 0), 0)

    const foodEffective = foodAlloc + foodCarryover
    const othersEffectiveRaw = othersAllocated + othersCarryover
    const othersEffective = Math.max(othersEffectiveRaw, 0)
    const totalEffective = foodEffective + othersEffective
    const netCut = totalEffective - dailyBudget

    return {
      foodAllocated: foodAlloc, foodCarryover, foodEffective,
      othersAllocated, othersCarryover, othersEffective,
      totalAllocated: dailyBudget, totalCut: netCut, totalEffective,
      hasAdjustment: netCut !== 0, hasData: true,
    }
  })

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

  function buildDates() {
    const now = new Date()
    todayDate.value = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    todayStr.value = toLocaleDateStr(now)
    todayLabel.value = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
    yesterdayStr.value = addDays(todayStr.value, -1)
    tomorrowStr.value = addDays(todayStr.value, 1)
    const tm = new Date(now); tm.setDate(tm.getDate() + 1)
    tomorrowLabel.value = tm.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
    tomorrowDay.value = tm.getDate()
  }

  async function loadDashboard() {
    loadError.value = false
    buildDates()
    const now = new Date()
    try {
      await pdStore.fetch()
      const [statusRes, txRes, planRes, tomorrowRes, mandatoryRes, endDayRes] = await Promise.all([
        getDailyStatus(todayStr.value).catch(() => null),
        getToday().catch(() => []),
        getPlanByMonth(now.getMonth() + 1, now.getFullYear()).catch(() => null),
        getDailyStatus(tomorrowStr.value).catch(() => null),
        getMandatoryByMonth(now.getMonth() + 1, now.getFullYear()).catch(() => []),
        getEndDayStatus(todayStr.value),
      ])
      if (!planRes) loadError.value = true
      dailyStatus.value = statusRes
      todayTx.value = txRes
      budgetPlan.value = planRes
      tomorrowStatus.value = tomorrowRes
      paydayDay.value = pdStore.data?.payday_day ?? 0
      nextCycleMandatory.value = (mandatoryRes as Array<{ amount: number }>).reduce((s, e) => s + (e.amount ?? 0), 0)
      endDayChoice.value = endDayRes
    } catch {
      loadError.value = true
    } finally {
      loadingTx.value = false
    }
  }

  return {
    dailyStatus, budgetPlan, todayTx, tomorrowStatus,
    loadingTx, loadError, paydayDay, endDayChoice,
    todayStr, todayDate, todayLabel, yesterdayStr, tomorrowStr, tomorrowLabel, tomorrowDay,
    firstName, foodTracker, lifestyleTracker,
    foodAllocated, foodSpent, foodRemaining, foodUsedPct,
    foodBadgeClass, foodBadgeText, foodBarClass,
    displayAllocated, displaySpent, totalRemaining,
    tomorrowIsNewCycle, nextCycleDailyBudget, tomorrowSummary,
    summaryStats, quickActions,
    loadDashboard,
  }
}
