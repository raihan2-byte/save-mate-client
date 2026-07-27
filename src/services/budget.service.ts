import api from '@/api'
import { extractError } from '@/utils/errors'
import type { DailyStatus, EndDayChoice } from '@/types'

export async function getDailyStatus(date: string): Promise<DailyStatus | null> {
  try {
    const res = await api.get(`/daily-budget/${date}`)
    return res.data.data ?? null
  } catch (e) {
    throw new Error(extractError(e, 'Gagal memuat status budget harian'))
  }
}

export async function postCarryover(
  date: string,
  category: string,
  remainingAmount: number,
  action: string
): Promise<void> {
  try {
    await api.post(`/daily-budget/${date}/carryover`, {
      category,
      remaining_amount: remainingAmount,
      action,
    })
  } catch (e) {
    throw new Error(extractError(e, 'Gagal memproses carryover'))
  }
}

export async function postEndDay(
  date: string,
  action: string,
  totalRemaining: number
): Promise<void> {
  try {
    await api.post(`/daily-budget/${date}/end-day`, { action, total_remaining: totalRemaining })
  } catch (e) {
    throw new Error(extractError(e, 'Gagal menyimpan akhir hari'))
  }
}

export async function postUndoEndDay(date: string): Promise<void> {
  try {
    await api.post(`/daily-budget/${date}/undo-end-day`)
  } catch (e) {
    throw new Error(extractError(e, 'Gagal membatalkan akhir hari'))
  }
}

/**
 * Ask the server to close out any past day the user never decided on. The
 * server picks the days, sums the leftovers and applies the default (savings) —
 * the client only supplies today's date. Returns how many days were settled.
 */
export async function settlePendingDays(today: string): Promise<number> {
  try {
    const res = await api.post(`/daily-budget/${today}/settle-pending`)
    return res.data.data?.settled_days ?? 0
  } catch {
    // Non-critical: the next dashboard load retries, and the server is
    // idempotent so nothing is double-counted.
    return 0
  }
}

export async function getEndDayStatus(date: string): Promise<EndDayChoice | null> {
  try {
    const res = await api.get(`/daily-budget/${date}/end-day-status`)
    return res.data.data ?? null
  } catch {
    return null
  }
}

export async function syncToday(): Promise<void> {
  await api.post('/daily-budget/sync-today').catch(() => {})
}
