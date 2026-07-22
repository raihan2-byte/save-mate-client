import { ref, computed } from 'vue'
import { usePersonalDataStore } from '@/stores/personalData'
import { getAllPlans, getPlanByMonth, checkReset } from '@/services/plan.service'
import type { BudgetPlan } from '@/types'

export function useBudgetPlan() {
  const pdStore = usePersonalDataStore()
  const plans = ref<BudgetPlan[]>([])
  const loading = ref(true)
  const showGenModal = ref(false)
  const paydayDay = ref(1)
  const now = new Date()
  const viewIndex = ref(-1)

  const budget = computed(() => plans.value[viewIndex.value] ?? null)

  function cycleDateLabel(b: BudgetPlan): string {
    const fmt = (d: Date) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    const pd = paydayDay.value
    if (b.cycle_start_date) {
      const start = new Date(b.cycle_start_date)
      const nextPay = b.mid_cycle_days && b.mid_cycle_days > 0
        ? new Date(b.for_year, b.for_month - 1, pd)
        : new Date(b.for_year, b.for_month, pd)
      const end = new Date(nextPay.getTime() - 86400000)
      return `${fmt(start)} – ${fmt(end)}`
    }
    if (b.mid_cycle_days && b.mid_cycle_days > 0) {
      const startDate = new Date(b.created_at ?? '')
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(b.for_year, b.for_month - 1, pd - 1)
      return `${fmt(startDate)} – ${fmt(endDate)}`
    }
    const cycleStart = new Date(b.for_year, b.for_month - 1, pd)
    const cycleEnd = new Date(b.for_year, b.for_month, pd)
    return `${fmt(cycleStart)} – ${fmt(cycleEnd)}`
  }

  const monthLabel = computed(() => {
    if (!budget.value) return ''
    return cycleDateLabel(budget.value) || `${budget.value.for_month}/${budget.value.for_year}`
  })

  const budgetStats = computed(() => [
    { label: 'Per Hari', value: budget.value?.daily_budget ?? 0 },
    { label: 'Wajib', value: budget.value?.total_mandatory ?? 0 },
    { label: 'Tabungan', value: budget.value?.savings_amount ?? 0 },
  ])

  const breakdown = computed(() => [
    { icon: '🏠', label: 'Pengeluaran Wajib', value: budget.value?.total_mandatory ?? 0, color: 'bg-red-400' },
    { icon: '🍜', label: 'Kebutuhan Makan',   value: budget.value?.food_amount ?? 0,     color: 'bg-cyan-400' },
    { icon: '🛍️', label: 'Gaya Hidup',        value: budget.value?.lifestyle_amount ?? 0, color: 'bg-violet-400' },
    { icon: '💰', label: 'Tabungan',          value: budget.value?.savings_amount ?? 0,  color: 'bg-emerald-400' },
  ])

  function pct(val: number): string {
    const b = budget.value
    if (!b) return '0'
    const total = (b.food_amount ?? 0) + (b.lifestyle_amount ?? 0) + (b.savings_amount ?? 0) + (b.total_mandatory ?? 0)
    if (total <= 0) return '0'
    return Math.min((val / total) * 100, 100).toFixed(1)
  }

  function prevMonth() { if (viewIndex.value > 0) viewIndex.value-- }

  async function nextMonth() {
    if (viewIndex.value < plans.value.length - 1) { viewIndex.value++; return }
    const last = plans.value[plans.value.length - 1]
    if (!last) return
    const nextM = last.for_month === 12 ? 1 : last.for_month + 1
    const nextY = last.for_month === 12 ? last.for_year + 1 : last.for_year
    const todayM = now.getMonth() + 1; const todayY = now.getFullYear()
    if (nextY > todayY || (nextY === todayY && nextM > todayM + 1)) return
    try {
      const plan = await getPlanByMonth(nextM, nextY)
      if (plan) plans.value.push(plan)
    } catch {}
    viewIndex.value = plans.value.length - 1
  }

  async function loadAllPlans() {
    loading.value = true
    try {
      checkReset()
      const [fetchedPlans] = await Promise.all([getAllPlans(), pdStore.fetch()])
      paydayDay.value = pdStore.data?.payday_day ?? 1
      plans.value = fetchedPlans
      const todayStr = now.toISOString().slice(0, 10)
      let idx = plans.value.length - 1
      for (let i = plans.value.length - 1; i >= 0; i--) {
        const p = plans.value[i]
        const start = p.cycle_start_date ? p.cycle_start_date.slice(0, 10) : null
        if (start && start <= todayStr) { idx = i; break }
      }
      viewIndex.value = idx
    } catch { plans.value = [] }
    finally { loading.value = false }
  }

  return {
    plans, loading, showGenModal, paydayDay, viewIndex,
    budget, monthLabel, budgetStats, breakdown,
    pct, prevMonth, nextMonth, loadAllPlans,
  }
}
