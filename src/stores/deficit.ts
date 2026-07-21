import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'
import { toLocaleDateStr, addDays } from '@/utils/formatting'

export const useDeficitStore = defineStore('deficit', () => {
  const show = ref(false)
  const deficit = ref(0)
  const nonFoodCapacityTomorrow = ref(0)
  const error = ref('')
  const applyingDeficit = ref(false)
  const deductingSavings = ref(false)

  // Berapa yang bisa dipotong dari budget besok (max = nonFoodCapacity)
  const cutTomorrowAmt = computed(() => Math.min(deficit.value, nonFoodCapacityTomorrow.value))
  // Sisanya harus potong tabungan
  const cutSavingsAmt = computed(() => deficit.value - cutTomorrowAmt.value)
  // Tombol "Potong Besok" disabled kalau non-food capacity = 0
  const canCutTomorrow = computed(() => nonFoodCapacityTomorrow.value > 0.01)

  async function check() {
    try {
      const today = toLocaleDateStr(new Date())
      const tomorrow = addDays(today, 1)
      const [todayRes, tomorrowRes] = await Promise.all([
        api.get(`/daily-budget/${today}`),
        api.get(`/daily-budget/${tomorrow}`),
      ])
      const data = todayRes.data?.data
      if (data?.has_unhandled_deficit) {
        deficit.value = (data?.total_spent ?? 0) - (data?.daily_budget ?? 0)
        const tomorrowBudgets: Array<{ category: string; allocated_amount: number; carryover_in: number }> =
          tomorrowRes.data?.data?.budgets ?? []
        const nonFoodFromTracker = tomorrowBudgets
          .filter(b => b.category !== 'food')
          .reduce((s, b) => s + (b.allocated_amount ?? 0) + (b.carryover_in ?? 0), 0)
        // Fallback ke plan kalau besok belum ada tracker rows
        const nonFoodFromPlan = (data?.daily_budget ?? 0) - (data?.food_daily_budget ?? 0)
        nonFoodCapacityTomorrow.value = tomorrowBudgets.length > 0 ? nonFoodFromTracker : nonFoodFromPlan
        error.value = ''
        show.value = true
      } else {
        show.value = false
      }
    } catch {}
  }

  async function deductFromSavings() {
    deductingSavings.value = true
    error.value = ''
    try {
      const today = toLocaleDateStr(new Date())
      await api.post('/summary/deduct-savings', { amount: deficit.value })
      await api.patch('/transactions/deficit-choice', { date: today, choice: 'savings', savings_cut: deficit.value })
      show.value = false
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'Gagal memotong tabungan. Coba lagi.'
    } finally {
      deductingSavings.value = false
    }
  }

  async function confirmDeficit() {
    applyingDeficit.value = true
    error.value = ''
    try {
      const today = toLocaleDateStr(new Date())
      const tomorrow = addDays(today, 1)

      const tomorrowRes = await api.get(`/daily-budget/${tomorrow}`)
      const tomorrowBudgets: Array<{ category: string; allocated_amount: number; carryover_in: number }> =
        tomorrowRes.data?.data?.budgets ?? []
      const nonFoodBudgets = tomorrowBudgets.filter(b => b.category !== 'food')

      // Gunakan nonFoodCapacityTomorrow dari store (sudah ada fallback ke plan)
      const nonFoodCap = nonFoodCapacityTomorrow.value
      const cutTomorrow = Math.min(deficit.value, nonFoodCap)
      const cutSavings = deficit.value - cutTomorrow

      const calls: Promise<unknown>[] = []

      // Potong non-food besok proporsional
      if (cutTomorrow > 0.01) {
        if (nonFoodBudgets.length > 0) {
          // Ada tracker rows — potong proporsional
          for (const b of nonFoodBudgets) {
            const cap = (b.allocated_amount ?? 0) + (b.carryover_in ?? 0)
            if (cap <= 0) continue
            const cut = cutTomorrow * (cap / nonFoodCap)
            if (cut > 0.01) {
              calls.push(api.post(`/daily-budget/${today}/carryover`, {
                category: b.category,
                remaining_amount: -cut,
                action: 'cut_tomorrow',
              }))
            }
          }
        } else {
          // Belum ada tracker rows besok — bagi rata ke 3 kategori non-food
          for (const cat of ['entertainment', 'shopping', 'misc']) {
            const cut = cutTomorrow / 3
            if (cut > 0.01) {
              calls.push(api.post(`/daily-budget/${today}/carryover`, {
                category: cat,
                remaining_amount: -cut,
                action: 'cut_tomorrow',
              }))
            }
          }
        }
      }

      // Sisa deficit (yang tidak bisa dipotong dari besok) → tabungan
      if (cutSavings > 0.01) {
        calls.push(api.post('/summary/deduct-savings', { amount: cutSavings }))
      }

      await Promise.all(calls)
      await api.patch('/transactions/deficit-choice', { date: today, choice: 'tomorrow', savings_cut: cutSavings })
      show.value = false
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'Gagal memotong budget besok. Coba lagi.'
    } finally {
      applyingDeficit.value = false
    }
  }

  return {
    show, deficit, nonFoodCapacityTomorrow,
    cutTomorrowAmt, cutSavingsAmt, canCutTomorrow,
    error, applyingDeficit, deductingSavings,
    check, deductFromSavings, confirmDeficit,
  }
})
