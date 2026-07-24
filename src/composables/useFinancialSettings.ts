import { ref, computed } from 'vue'
import { getPersonalData, updatePersonalData, setNextSalary, clearNextSalary } from '@/services/personalData.service'
import { getPlanByMonth, createOrUpdatePlan } from '@/services/plan.service'
import { getMandatoryByMonth, addMandatory, deleteMandatory } from '@/services/mandatory.service'
import { getSummaryByMonth } from '@/services/summary.service'
import { syncToday } from '@/services/budget.service'
import { calcBudgetPreview } from '@/constants/budgetConfig'
import { formatCurrency, formatCurrencyShort } from '@/utils/formatting'
import type { BudgetPlan, MandatoryExpenditure } from '@/types'
import type { PersonalDataFormData } from '@/components/settings/PersonalDataForm.vue'

export function useFinancialSettings() {
  const now = new Date()
  const _nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const nextMonthNum = _nextMonthDate.getMonth() + 1
  const nextYearNum = _nextMonthDate.getFullYear()

  const loading = ref(true)
  const mandatoryLoading = ref(false)
  const isDirty = ref(false)
  const editingPersonal = ref(false)
  const hasTransactions = ref(false)
  const savingPersonal = ref(false)
  const personalError = ref('')
  const savingNextSalary = ref(false)
  const clearingNextSalary = ref(false)
  const nextSalaryError = ref('')
  const showAddExpense = ref(false)
  const addingExpense = ref(false)
  const recalculating = ref(false)
  const recalcPhase = ref('')
  const budgetRefreshing = ref(false)
  const toast = ref<{ message: string; type: 'success' | 'error' } | null>(null)
  let toastTimer: ReturnType<typeof setTimeout> | null = null

  const personalFormData = ref<PersonalDataFormData>({ salary: 0, savingType: '', purpose: '' })
  const originalPersonal = ref<{ salary: number; savingType: string }>({ salary: 0, savingType: '' })
  const salaryDisplay = ref('')
  const nextSalary = ref<number | null>(null)
  const nextSalaryDisplay = ref('')

  const nextSalaryNumeric = computed(() => {
    const raw = nextSalaryDisplay.value.replace(/\./g, '')
    return raw ? Number(raw) : 0
  })
  const salaryNumeric = computed(() => {
    const raw = salaryDisplay.value.replace(/\./g, '')
    return raw ? Number(raw) : 0
  })

  const expenses = ref<MandatoryExpenditure[]>([])
  const nextCycleExpenses = ref<MandatoryExpenditure[]>([])
  const budgetPlan = ref<BudgetPlan | null>(null)
  const paydayDay = ref(1)

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const nextMonthDays = computed(() => new Date(now.getFullYear(), now.getMonth() + 2, 0).getDate())

  const totalMandatory = computed(() => expenses.value.reduce((s, e) => s + (e.amount ?? 0), 0))
  const allExpenses = computed(() => [...(expenses.value ?? []), ...(nextCycleExpenses.value ?? [])])

  const canEditFinancials = computed(() => {
    if (!budgetPlan.value) return true
    return now.getDate() === paydayDay.value
  })

  const nextBudgetPreview = computed(() => {
    if (nextSalaryNumeric.value <= 0) return null
    const allMandatory = allExpenses.value.reduce((s, e) => s + (e.amount ?? 0), 0)
    return calcBudgetPreview(nextSalaryNumeric.value, allMandatory, personalFormData.value.savingType, nextMonthDays.value)
  })

  const monthLabel = computed(() => {
    const b = budgetPlan.value
    if (!b) return now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    const fmt = (d: Date) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    const month = (b.for_month as number) - 1
    const year = b.for_year as number
    if ((b.mid_cycle_days as number) > 0) {
      const startDate = new Date(b.created_at as string)
      startDate.setHours(0, 0, 0, 0)
      const pd = paydayDay.value
      let endDate = new Date(year, month, pd - 1)
      if (endDate < startDate) endDate = new Date(year, month + 1, pd - 1)
      return `${fmt(startDate)} – ${fmt(endDate)}`
    }
    const cycleStart = new Date(year, month, paydayDay.value)
    const cycleEnd = new Date(year, month + 1, paydayDay.value)
    return `${fmt(cycleStart)} – ${fmt(cycleEnd)}`
  })

  const fmtCur = formatCurrency
  const fmtShort = formatCurrencyShort

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    if (toastTimer) clearTimeout(toastTimer)
    toast.value = { message, type }
    toastTimer = setTimeout(() => { toast.value = null }, 3500)
  }

  function toggleEdit() {
    editingPersonal.value = !editingPersonal.value
    if (editingPersonal.value && personalFormData.value.salary > 0) {
      salaryDisplay.value = String(Math.round(personalFormData.value.salary)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      originalPersonal.value = { salary: personalFormData.value.salary, savingType: personalFormData.value.savingType }
    }
  }

  function formatNextSalaryInput() {
    const raw = nextSalaryDisplay.value.replace(/\D/g, '')
    nextSalaryDisplay.value = raw ? Number(raw).toLocaleString('id-ID') : ''
  }

  async function loadAll() {
    loading.value = true
    try {
      const [pdRes, bpRes, summaryRes] = await Promise.allSettled([
        getPersonalData(),
        getPlanByMonth(now.getMonth() + 1, now.getFullYear()),
        getSummaryByMonth(now.getMonth() + 1, now.getFullYear()),
      ])

      if (pdRes.status === 'fulfilled' && pdRes.value) {
        const pd = pdRes.value
        paydayDay.value = pd.payday_day ?? 1
        personalFormData.value = {
          salary: pd.salary ?? 0,
          savingType: pd.saving_type ?? '',
          purpose: (pd as unknown as { purpose_of_join_here?: string }).purpose_of_join_here ?? '',
        }
        if (pd.salary > 0) {
          salaryDisplay.value = String(Math.round(pd.salary)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
        }
        nextSalary.value = pd.next_salary ?? null
        if (nextSalary.value && nextSalary.value > 0) {
          nextSalaryDisplay.value = String(Math.round(nextSalary.value)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
        }
      }

      if (bpRes.status === 'fulfilled') budgetPlan.value = bpRes.value
      if (summaryRes.status === 'fulfilled') {
        const s = summaryRes.value as unknown as { total_food_spent?: number; total_lifestyle_spent?: number }
        if (((s?.total_food_spent ?? 0) + (s?.total_lifestyle_spent ?? 0)) > 0) hasTransactions.value = true
      }
      await loadExpenses()
    } finally {
      loading.value = false
    }
  }

  async function loadExpenses() {
    mandatoryLoading.value = true
    try {
      expenses.value = await getMandatoryByMonth(now.getMonth() + 1, now.getFullYear())
    } catch { expenses.value = [] }
    finally { mandatoryLoading.value = false }
    try {
      nextCycleExpenses.value = await getMandatoryByMonth(nextMonthNum, nextYearNum)
    } catch { nextCycleExpenses.value = [] }
  }

  async function savePersonal() {
    savingPersonal.value = true
    personalError.value = ''
    const newSalary = salaryNumeric.value
    if (newSalary <= totalMandatory.value) {
      personalError.value = `Gaji (${fmtCur(newSalary)}) tidak boleh lebih kecil atau sama dengan total pengeluaran wajib (${fmtCur(totalMandatory.value)}). Kurangi pengeluaran wajib terlebih dahulu.`
      savingPersonal.value = false
      return
    }
    try {
      personalFormData.value.salary = newSalary
      await updatePersonalData({
        salary: personalFormData.value.salary,
        saving_type: personalFormData.value.savingType,
        purpose_of_join_here: personalFormData.value.purpose,
      })
      editingPersonal.value = false
      await recalculate()
    } catch (e: unknown) {
      personalError.value = e instanceof Error ? e.message : 'Gagal menyimpan'
      savingPersonal.value = false
    }
  }

  async function handleSaveNextSalary() {
    nextSalaryError.value = ''
    if (nextSalaryNumeric.value <= 0) return
    if (nextSalaryNumeric.value === personalFormData.value.salary) {
      nextSalaryError.value = `Gaji yang dimasukkan (${fmtCur(nextSalaryNumeric.value)}) sama dengan gaji sekarang — tidak ada perubahan.`
      return
    }
    savingNextSalary.value = true
    try {
      await setNextSalary(nextSalaryNumeric.value)
      nextSalary.value = nextSalaryNumeric.value
      showToast(`Gaji baru ${fmtCur(nextSalaryNumeric.value)} akan aktif mulai gajian tgl ${paydayDay.value}`)
    } catch (e: unknown) {
      nextSalaryError.value = e instanceof Error ? e.message : 'Gagal menyimpan'
    } finally {
      savingNextSalary.value = false
    }
  }

  async function handleClearNextSalary() {
    clearingNextSalary.value = true
    try {
      await clearNextSalary()
      nextSalary.value = null
      nextSalaryDisplay.value = ''
      showToast('Gaji bulan depan dihapus')
    } catch (e: unknown) {
      nextSalaryError.value = e instanceof Error ? e.message : 'Gagal menghapus'
    } finally {
      clearingNextSalary.value = false
    }
  }

  async function recalculate() {
    recalculating.value = true
    recalcPhase.value = 'Membaca data terbaru...'
    try {
      const region = budgetPlan.value?.region ?? 'Jakarta'
      recalcPhase.value = 'Menghitung ulang alokasi...'
      await createOrUpdatePlan({
        for_month: now.getMonth() + 1,
        for_year: now.getFullYear(),
        saving_type: personalFormData.value.savingType,
        region,
      })
      recalcPhase.value = 'Memperbarui budget harian...'
      budgetPlan.value = await getPlanByMonth(now.getMonth() + 1, now.getFullYear())
      isDirty.value = false
      syncToday()
      showToast('Budget berhasil dihitung ulang')
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Gagal menghitung ulang budget', 'error')
    } finally {
      recalculating.value = false
      savingPersonal.value = false
    }
  }

  async function silentRecalculate() {
    if (!budgetPlan.value) return
    budgetRefreshing.value = true
    try {
      const region = (budgetPlan.value.region as string) ?? ''
      const savingType = (budgetPlan.value.saving_type as string) || personalFormData.value.savingType || 'recommendation'
      await createOrUpdatePlan({ for_month: now.getMonth() + 1, for_year: now.getFullYear(), saving_type: savingType, region })
      budgetPlan.value = await getPlanByMonth(now.getMonth() + 1, now.getFullYear())
      isDirty.value = false
      syncToday()
      showToast('Budget plan bulan ini diperbarui otomatis')
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Gagal memperbarui budget', 'error')
    } finally {
      budgetRefreshing.value = false
    }
  }

  async function handleAddMandatory(item: { category: string; description: string; amount: number; forMonth: number; forYear: number }) {
    addingExpense.value = true
    const isCurrentCycle = item.forMonth === (now.getMonth() + 1) && item.forYear === now.getFullYear()
    try {
      await addMandatory({
        category: item.category,
        amount: item.amount,
        description: item.description,
        transaction_date: new Date().toISOString(),
        for_month: item.forMonth,
        for_year: item.forYear,
      })
      showAddExpense.value = false
      await loadExpenses()
      if (isCurrentCycle) {
        budgetPlan.value = await getPlanByMonth(now.getMonth() + 1, now.getFullYear())
        showToast('Pengeluaran wajib ditambahkan, tabungan dipotong otomatis')
      } else {
        showToast('Dicatat — berlaku mulai gajian berikutnya')
      }
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Gagal menambah pengeluaran wajib', 'error')
    } finally {
      addingExpense.value = false
    }
  }

  async function handleDeleteMandatory(id: string) {
    try {
      await deleteMandatory(id)
      await loadExpenses()
      await silentRecalculate()
    } catch {
      showToast('Gagal menghapus pengeluaran wajib', 'error')
    }
  }

  return {
    loading, mandatoryLoading, isDirty, editingPersonal, hasTransactions,
    savingPersonal, personalError, savingNextSalary, clearingNextSalary, nextSalaryError,
    showAddExpense, addingExpense, recalculating, recalcPhase, budgetRefreshing, toast,
    personalFormData, originalPersonal, salaryDisplay, nextSalary, nextSalaryDisplay,
    nextSalaryNumeric, salaryNumeric,
    expenses, nextCycleExpenses, budgetPlan, paydayDay,
    daysInMonth, nextMonthDays, nextMonthNum, nextYearNum,
    totalMandatory, allExpenses, canEditFinancials, nextBudgetPreview, monthLabel,
    fmtCur, fmtShort,
    loadAll, toggleEdit, formatNextSalaryInput,
    savePersonal, handleSaveNextSalary, handleClearNextSalary,
    recalculate, silentRecalculate, handleAddMandatory, handleDeleteMandatory,
  }
}
