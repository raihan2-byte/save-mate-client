export const BUDGET_THRESHOLDS = { warning: 60, critical: 80 }
export const SPREAD_DURATIONS = [7, 14, 30]
export const DEFAULT_MONTH_DAYS = 30

// Display-only ordering/labels. The save/spend split for each type comes from
// the server (see stores/budgetConfig.ts) — never hardcode it here again.
export const SAVING_TYPE_KEYS = ['frugal', 'recommendation', 'normal'] as const

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

/**
 * Mirrors the server's allocation for preview purposes only.
 *
 * `alloc` and `foodPct` must come from the budget-config store — they are the
 * server's own numbers. Returns null when the config has not loaded yet, so a
 * preview is never rendered from guessed percentages.
 */
export function calcBudgetPreview(
  salary: number,
  mandatory: number,
  savingType: string,
  daysInMonth: number,
  alloc: { save: number; spend: number } | null,
  foodPct: number | undefined,
): BudgetPreview | null {
  if (!alloc || foodPct === undefined) return null
  const available = salary - mandatory
  if (available <= 0) return null
  const savingsAmount = available * alloc.save
  const spendingBudget = available * alloc.spend
  const foodAmount = spendingBudget * foodPct
  const lifestyleAmount = spendingBudget * (1 - foodPct)
  const dailyBudget = spendingBudget / daysInMonth
  const dailySavings = savingsAmount / daysInMonth
  return { salary, mandatory, available, savingsAmount, spendingBudget, foodAmount, lifestyleAmount, dailyBudget, dailySavings, savingType }
}
