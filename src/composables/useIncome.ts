import { ref } from 'vue'
import { getAllIncomes, addIncomeWithChoice, deleteIncome } from '@/services/income.service'
import type { Income } from '@/types'

export function useIncome() {
  const incomes = ref<Income[]>([])
  const loading = ref(true)
  const submitting = ref(false)
  const deleteLoading = ref(false)
  const recalculating = ref(false)
  const error = ref('')
  const choiceError = ref('')
  const deleteError = ref('')

  async function loadIncomes() {
    loading.value = true
    try {
      incomes.value = await getAllIncomes()
    } catch { incomes.value = [] }
    finally { loading.value = false }
  }

  async function waitAndReload() {
    recalculating.value = true
    await new Promise(r => setTimeout(r, 500))
    await loadIncomes()
    recalculating.value = false
  }

  async function confirmDelete(incomeId: string): Promise<boolean> {
    deleteLoading.value = true
    deleteError.value = ''
    try {
      await deleteIncome(incomeId)
      await waitAndReload()
      return true
    } catch (e: unknown) {
      deleteError.value = e instanceof Error ? e.message : 'Gagal menghapus pemasukan'
      return false
    } finally {
      deleteLoading.value = false
    }
  }

  async function handleChoiceConfirm(
    pending: { amount: number; description: string; transaction_date: string } | null,
    choice: string,
    spreadDays?: number
  ): Promise<boolean> {
    if (!pending) return false
    submitting.value = true
    choiceError.value = ''
    try {
      await addIncomeWithChoice({
        amount: pending.amount,
        description: pending.description,
        transaction_date: pending.transaction_date + 'T00:00:00Z',
        choice,
        ...(choice === 'spread' && spreadDays !== undefined ? { spread_days: spreadDays } : {}),
      })
      await waitAndReload()
      return true
    } catch (e: unknown) {
      choiceError.value = e instanceof Error ? e.message : 'Gagal menambah pemasukan'
      return false
    } finally {
      submitting.value = false
    }
  }

  return {
    incomes, loading, submitting, deleteLoading, recalculating,
    error, choiceError, deleteError,
    loadIncomes, confirmDelete, handleChoiceConfirm,
  }
}
