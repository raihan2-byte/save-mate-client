export const BUDGET_THRESHOLDS = { warning: 60, critical: 80 }
export const FOOD_SPEND_PCT = 0.65
export const LIFESTYLE_SPEND_PCT = 0.35
export const SAVING_TYPES: Record<string, { save: number; spend: number }> = {
  frugal:         { save: 0.65, spend: 0.35 },
  recommendation: { save: 0.45, spend: 0.55 },
  normal:         { save: 0.25, spend: 0.75 },
}
export const SPREAD_DURATIONS = [7, 14, 30]
export const DEFAULT_MONTH_DAYS = 30

export interface BudgetPreview {
  salary: number
  mandatory: number
  available: number
  savingsAmount: number
  spendingBudget: number
  foodAmount: number
  lifestyleAmount: number
  dailyBudget: number
  dailySavings: number
  savingType: string
}

export function calcBudgetPreview(
  salary: number,
  mandatory: number,
  savingType: string,
  daysInMonth: number,
): BudgetPreview | null {
  const alloc = SAVING_TYPES[savingType] ?? SAVING_TYPES.recommendation
  const available = salary - mandatory
  if (available <= 0) return null
  const savingsAmount = available * alloc.save
  const spendingBudget = available * alloc.spend
  const foodAmount = spendingBudget * FOOD_SPEND_PCT
  const lifestyleAmount = spendingBudget * LIFESTYLE_SPEND_PCT
  const dailyBudget = spendingBudget / daysInMonth
  const dailySavings = savingsAmount / daysInMonth
  return { salary, mandatory, available, savingsAmount, spendingBudget, foodAmount, lifestyleAmount, dailyBudget, dailySavings, savingType }
}
