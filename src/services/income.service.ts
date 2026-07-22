import api from '@/api'
import { extractError } from '@/utils/errors'
import type { Income } from '@/types'

export async function getAllIncomes(): Promise<Income[]> {
  try {
    const res = await api.get('/daily-income/')
    const raw = res.data.data
    return Array.isArray(raw) ? raw : raw ? [raw] : []
  } catch (e) {
    throw new Error(extractError(e, 'Gagal memuat pemasukan'))
  }
}

export async function addIncomeWithChoice(payload: {
  amount: number
  description: string
  transaction_date: string
  choice: string
  spread_days?: number
}): Promise<void> {
  try {
    await api.post('/daily-income/with-choice', payload)
  } catch (e) {
    throw new Error(extractError(e, 'Gagal menambah pemasukan'))
  }
}

export async function deleteIncome(id: string): Promise<void> {
  try {
    await api.delete(`/daily-income/${id}`)
  } catch (e) {
    throw new Error(extractError(e, 'Gagal menghapus pemasukan'))
  }
}
