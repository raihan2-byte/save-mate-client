import api from '@/api'
import { extractError } from '@/utils/errors'
import type { MonthlySummary } from '@/types'

export async function getSummaryByMonth(month: number, year: number): Promise<MonthlySummary | null> {
  try {
    const res = await api.get(`/summary/month/${month}/${year}`)
    return res.data.data ?? null
  } catch (e) {
    throw new Error(extractError(e, 'Gagal memuat ringkasan'))
  }
}

export async function deductSavings(amount: number): Promise<void> {
  try {
    await api.post('/summary/deduct-savings', { amount })
  } catch (e) {
    throw new Error(extractError(e, 'Gagal memotong tabungan'))
  }
}
