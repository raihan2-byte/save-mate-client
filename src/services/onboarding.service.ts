import api from '@/api'
import { extractError } from '@/utils/errors'

export interface OnboardingItem {
  category?: string
  description: string
  amount: number
}

/**
 * Raw onboarding answers. Deliberately contains no derived figures — the server
 * works out whether the user is mid-cycle, how many days remain until payday,
 * how the balance splits across calendar months, and the budget allocation.
 */
export interface CompleteOnboardingPayload {
  salary: number
  purpose_of_join_here: string
  saving_type: string
  payday_day: number
  region?: string
  mandatory_items: OnboardingItem[]
  mid_cycle_strategy?: string
  current_balance?: number
  pending_items?: OnboardingItem[]
}

export async function completeOnboarding(payload: CompleteOnboardingPayload): Promise<void> {
  try {
    await api.post('/onboarding/complete', payload)
  } catch (e) {
    throw new Error(extractError(e, 'Gagal menyimpan data onboarding'))
  }
}
