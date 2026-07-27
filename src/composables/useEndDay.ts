import { ref, computed } from 'vue'
import { postEndDay, postUndoEndDay, settlePendingDays } from '@/services/budget.service'
import type { EndDayChoice } from '@/types'

export function useEndDay(
  todayStr: Readonly<{ value: string }>,
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

  // Close out any day whose decision window (20:30–24:00) has passed without the
  // user choosing. The server decides which days qualify and how much is left —
  // this used to be worked out here, which meant it only ever caught yesterday
  // and only if the dashboard happened to be opened.
  async function settleExpiredDays() {
    if (!todayStr.value) return
    const settled = await settlePendingDays(todayStr.value)
    if (settled > 0) await onReload()
  }

  return {
    showEndDayModal, endDayAction, endDayTotal,
    submittingEndDay, endDayError, undoError, undoing,
    canEndDay, canUndoEndDay,
    triggerEndOfDay, maybePromptEndDay, submitEndDay, undoEndDay, settleExpiredDays,
  }
}
