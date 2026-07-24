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
  // Undo is allowed anytime on the same day the choice was made (endDayChoice is
  // fetched for today only, so it never lingers into the next day).
  const canUndoEndDay = computed(() => !!endDayChoice.value)

  // "Tutup buku" prompt window: 20:30 until midnight.
  function inEndDayWindow(): boolean {
    const now = new Date()
    const h = now.getHours()
    const m = now.getMinutes()
    return h > 20 || (h === 20 && m >= 30)
  }

  function triggerEndOfDay() {
    endDayTotal.value = totalRemaining.value
    endDayAction.value = ''
    endDayError.value = ''
    showEndDayModal.value = true
  }

  // Proactively open the "tutup buku" prompt when today still has leftover
  // budget and we're inside the evening window. Called on every dashboard
  // load/activate so it keeps nudging until the user decides.
  function maybePromptEndDay() {
    if (canEndDay.value && !showEndDayModal.value && inEndDayWindow()) {
      triggerEndOfDay()
    }
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
      // Yesterday's decision window (20:30–24:00) has already passed, so the
      // leftover defaults to savings.
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
    triggerEndOfDay, maybePromptEndDay, submitEndDay, undoEndDay, checkYesterdayCarryover,
  }
}
