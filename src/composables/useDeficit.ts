import { ref } from 'vue'
import { patchDeficitChoice, getByDate } from '@/services/transaction.service'
import { getDailyStatus } from '@/services/budget.service'
import { toLocaleDateStr, addDays } from '@/utils/formatting'

export function useDeficit(onAfterHandled: () => Promise<void>) {
  const showBudgetExceededModal = ref(false)
  const budgetExceeded = ref<{ category: string; deficit: number } | null>(null)
  const applyingDeficit = ref(false)
  const deductingSavings = ref(false)
  const tomorrowCutCapacity = ref(0)
  const budgetExceededError = ref('')
  const isHandlingOverrun = ref(false)
  let _overrunVer = 0

  async function checkDailyBudgetOverrun() {
    if (showBudgetExceededModal.value || isHandlingOverrun.value) return
    const myVer = ++_overrunVer
    try {
      const today = toLocaleDateStr(new Date())
      const tomorrow = addDays(today, 1)
      const [budgetData, txs, tomorrowData] = await Promise.all([
        getDailyStatus(today).catch(() => null),
        getByDate(today).catch(() => []),
        getDailyStatus(tomorrow).catch(() => null),
      ])
      if (!budgetData) return

      const dailyBudget = (budgetData as { daily_budget?: number; total_allocated?: number }).daily_budget
        ?? (budgetData as { daily_budget?: number; total_allocated?: number }).total_allocated ?? 0
      const foodDailyBudget = (budgetData as { food_daily_budget?: number }).food_daily_budget ?? 0
      const nonFoodDailyBudget = dailyBudget - foodDailyBudget
      const totalSpentVal = budgetData.total_spent ?? 0
      const totalDeficit = totalSpentVal - dailyBudget
      if (totalDeficit <= 0) {
        if (myVer !== _overrunVer) return
        return
      }

      const savingsAlreadyCut = txs.reduce((s, t) => s + ((t as { deficit_savings_cut?: number }).deficit_savings_cut ?? 0), 0)
      const tomorrowBudgets = tomorrowData?.budgets ?? []
      const tomorrowAlreadyCut = tomorrowBudgets
        .filter(b => b.category !== 'food')
        .reduce((s, b) => s + Math.abs(Math.min((b as { deficit_cut_in?: number }).deficit_cut_in ?? 0, 0)), 0)
      const incrementalDeficit = Math.max(totalDeficit - savingsAlreadyCut - tomorrowAlreadyCut, 0)
      if (myVer !== _overrunVer) return
      if (incrementalDeficit < 1) {
        return
      }

      tomorrowCutCapacity.value = Math.max(nonFoodDailyBudget - tomorrowAlreadyCut, 0)
      budgetExceeded.value = { category: '', deficit: incrementalDeficit }
      budgetExceededError.value = ''
      showBudgetExceededModal.value = true
    } catch (e) {
      console.error('[overrun check] error:', e)
    }
  }

  async function deductFromSavings() {
    if (!budgetExceeded.value) return
    deductingSavings.value = true
    isHandlingOverrun.value = true
    budgetExceededError.value = ''
    ++_overrunVer
    try {
      const today = toLocaleDateStr(new Date())
      await patchDeficitChoice(today, 'savings', budgetExceeded.value.deficit)
      showBudgetExceededModal.value = false
      budgetExceeded.value = null
      await onAfterHandled()
    } catch (e: unknown) {
      budgetExceededError.value = e instanceof Error ? e.message : 'Gagal memotong tabungan. Coba lagi.'
    } finally {
      deductingSavings.value = false
      isHandlingOverrun.value = false
    }
  }

  async function confirmDeficit() {
    if (!budgetExceeded.value) return
    applyingDeficit.value = true
    isHandlingOverrun.value = true
    budgetExceededError.value = ''
    ++_overrunVer
    try {
      const today = toLocaleDateStr(new Date())
      const deficit = Math.round(budgetExceeded.value.deficit)
      const toCutTomorrow = Math.min(deficit, Math.round(tomorrowCutCapacity.value))
      const toCutSavings = Math.max(0, deficit - toCutTomorrow)

      // Backend calculates proporsional distribution per category when choice='tomorrow'
      await patchDeficitChoice(today, 'tomorrow', toCutSavings, toCutTomorrow)
      showBudgetExceededModal.value = false
      budgetExceeded.value = null
      await onAfterHandled()
    } catch (e: unknown) {
      budgetExceededError.value = e instanceof Error ? e.message : 'Gagal memotong budget besok. Coba lagi.'
    } finally {
      applyingDeficit.value = false
      isHandlingOverrun.value = false
    }
  }

  return {
    showBudgetExceededModal, budgetExceeded,
    applyingDeficit, deductingSavings,
    tomorrowCutCapacity, budgetExceededError,
    checkDailyBudgetOverrun, deductFromSavings, confirmDeficit,
  }
}
