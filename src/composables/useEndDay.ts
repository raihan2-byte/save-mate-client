import { ref, computed } from 'vue'
import { postEndDay, postUndoEndDay, getDailyStatus, getEndDayStatus } from '@/services/budget.service'
import type { EndDayChoice, BudgetTrackerItem } from '@/types'

export function useEndDay(
  todayStr: Readonly<{ value: string }>,
  yesterdayStr: Readonly<{ value: string }>,
  endDayChoice: { value: EndDayChoice | null },
  totalRemaining: Readonly<{ value: number }>,
  onReload: () => Promise<void>
) {
  const showEndDayModal = ref(false)
  const endDayAction = ref('')
  const endDayTotal = ref(0)
  const submittingEndDay = ref(false)
  const endDayError = ref('')
  const undoError = ref('')
  const undoing = ref(false)

  const canEndDay = computed(() => !endDayChoice.value && totalRemaining.value > 0)
  const canUndoEndDay = computed(() => !!endDayChoice.value && new Date().getHours() < 22)

  function triggerEndOfDay() {
    endDayTotal.value = totalRemaining.value
    endDayAction.value = ''
    endDayError.value = ''
    showEndDayModal.value = true
  }

  async function submitEndDay() {
    if (!endDayAction.value) return
    submittingEndDay.value = true
    endDayError.value = ''
    try {
      await postEndDay(todayStr.value, endDayAction.value, endDayTotal.value)
      showEndDayModal.value = false
      await onReload()
    } catch (e: unknown) {
      endDayError.value = e instanceof Error ? e.message : 'Gagal menyimpan. Coba lagi.'
    } finally {
      submittingEndDay.value = false
    }
  }

  async function undoEndDay() {
    undoing.value = true
    undoError.value = ''
    try {
      await postUndoEndDay(todayStr.value)
      await onReload()
    } catch (e: unknown) {
      undoError.value = e instanceof Error ? e.message : 'Gagal membatalkan.'
    } finally {
      undoing.value = false
    }
  }

  async function checkYesterdayCarryover() {
    if (!yesterdayStr.value) return
    try {
      // Already finalized (end-day done) for yesterday → nothing to do
      const alreadyProcessed = await getEndDayStatus(yesterdayStr.value).catch(() => null)
      if (alreadyProcessed) return
      const status = await getDailyStatus(yesterdayStr.value).catch(() => null)
      if (!status) return
      const budgets = (status.budgets ?? []) as BudgetTrackerItem[]
      const pending = budgets.filter(b => !b.is_finalized && b.remaining > 0)
      if (pending.length === 0) return
      const hour = new Date().getHours()
      if (hour >= 22 || hour < 6) return
      const totalRem = pending.reduce((s, b) => s + b.remaining, 0)
      await postEndDay(yesterdayStr.value, 'save', totalRem)
      await onReload()
    } catch {
      // non-critical — silently ignore
    }
  }

  return {
    showEndDayModal, endDayAction, endDayTotal,
    submittingEndDay, endDayError, undoError, undoing,
    canEndDay, canUndoEndDay,
    triggerEndOfDay, submitEndDay, undoEndDay, checkYesterdayCarryover,
  }
}
