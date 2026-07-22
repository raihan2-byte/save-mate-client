import api from '@/api'
import { extractError } from '@/utils/errors'
import type { BudgetPlan } from '@/types'

export async function getPlanByMonth(month: number, year: number): Promise<BudgetPlan | null> {
  try {
    const res = await api.get(`/budget-plan/${month}/${year}`)
    return res.data.data ?? null
  } catch (e) {
    throw new Error(extractError(e, 'Gagal memuat budget plan'))
  }
}

export async function getAllPlans(): Promise<BudgetPlan[]> {
  try {
    const res = await api.get('/budget-plan/')
    return res.data.data ?? []
  } catch (e) {
    throw new Error(extractError(e, 'Gagal memuat budget plan'))
  }
}

export async function createOrUpdatePlan(payload: {
  for_month: number
  for_year: number
  saving_type: string
  region?: string
}): Promise<BudgetPlan> {
  try {
    const res = await api.post('/budget-plan/', payload)
    return res.data.data as BudgetPlan
  } catch (e) {
    throw new Error(extractError(e, 'Gagal membuat budget plan'))
  }
}

export async function checkReset(): Promise<void> {
  await api.post('/budget-plan/check-reset').catch(() => {})
}
