import api from '@/api'
import { extractError } from '@/utils/errors'
import type { Transaction, AmbiguousResponse } from '@/types'

export async function getToday(): Promise<Transaction[]> {
  try {
    const res = await api.get('/transactions/today')
    return res.data.data ?? []
  } catch (e) {
    throw new Error(extractError(e, 'Gagal memuat transaksi hari ini'))
  }
}

export async function getByDate(date: string): Promise<Transaction[]> {
  try {
    const res = await api.get(`/transactions/date/${date}`)
    return res.data.data ?? []
  } catch (e) {
    throw new Error(extractError(e, 'Gagal memuat transaksi'))
  }
}

export async function getByRange(from: string, to: string): Promise<Transaction[]> {
  try {
    const res = await api.get(`/transactions/range?from=${from}&to=${to}`)
    return res.data.data ?? []
  } catch (e) {
    throw new Error(extractError(e, 'Gagal memuat transaksi'))
  }
}

export async function addTransaction(payload: {
  amount: number
  category: string
  description: string
  input_timestamp: string
}): Promise<{ transaction: Transaction | null; ambiguous: AmbiguousResponse | null }> {
  try {
    const res = await api.post('/transactions/', payload)
    const data = res.data.data
    if (data?.requires_clarification) return { transaction: null, ambiguous: data as AmbiguousResponse }
    return { transaction: data as Transaction, ambiguous: null }
  } catch (e) {
    throw new Error(extractError(e, 'Gagal menambah transaksi'))
  }
}

export async function addTransactionWithChoice(payload: {
  amount: number
  category: string
  description?: string
  input_timestamp: string
  user_choice_date: string
}): Promise<Transaction> {
  try {
    const res = await api.post('/transactions/add-with-choice', payload)
    return res.data.data as Transaction
  } catch (e) {
    throw new Error(extractError(e, 'Gagal menambah transaksi'))
  }
}

export async function updateTransaction(
  id: string,
  payload: { amount: number; category: string; description: string }
): Promise<void> {
  try {
    await api.put(`/transactions/${id}`, payload)
  } catch (e) {
    throw new Error(extractError(e, 'Gagal mengubah transaksi'))
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  try {
    await api.delete(`/transactions/${id}`)
  } catch (e) {
    throw new Error(extractError(e, 'Gagal menghapus transaksi'))
  }
}

export async function patchDeficitChoice(
  date: string,
  choice: string,
  savingsCut: number
): Promise<void> {
  try {
    await api.patch('/transactions/deficit-choice', { date, choice, savings_cut: savingsCut })
  } catch (e) {
    throw new Error(extractError(e, 'Gagal menyimpan pilihan deficit'))
  }
}
