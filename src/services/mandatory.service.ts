import api from '@/api'
import { extractError } from '@/utils/errors'
import type { MandatoryExpenditure } from '@/types'

export async function getMandatoryByMonth(
  month: number,
  year: number
): Promise<MandatoryExpenditure[]> {
  try {
    const res = await api.get(`/mandatory-expenditure/month/${month}/${year}`)
    const raw = res.data.data
    const list = raw?.data ?? raw
    return Array.isArray(list) ? (list as MandatoryExpenditure[]) : []
  } catch (e) {
    throw new Error(extractError(e, 'Gagal memuat pengeluaran wajib'))
  }
}

export async function addMandatory(payload: {
  category: string
  amount: number
  description: string
  transaction_date: string
  for_month: number
  for_year: number
}): Promise<void> {
  try {
    await api.post('/mandatory-expenditure/', payload)
  } catch (e) {
    throw new Error(extractError(e, 'Gagal menambah pengeluaran wajib'))
  }
}

export async function deleteMandatory(id: string): Promise<void> {
  try {
    await api.delete(`/mandatory-expenditure/${id}`)
  } catch (e) {
    throw new Error(extractError(e, 'Gagal menghapus pengeluaran wajib'))
  }
}
