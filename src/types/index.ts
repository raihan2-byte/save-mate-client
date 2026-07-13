export interface User {
  user_id: string
  username: string
  email: string
  age?: number
  location?: string
  job_title?: string
  employment_type?: string
}

export interface BudgetTrackerItem {
  category: string
  allocated_amount: number
  actual_spent: number
  carryover_in: number
  deficit_cut_in: number
  effective_budget: number
  remaining: number
  is_finalized: boolean
}

export interface DailyStatus {
  date: string
  total_allocated: number
  total_spent: number
  budgets: BudgetTrackerItem[]
}

export interface Transaction {
  transaction_id: string
  id?: string
  user_id: string
  amount: number
  category: string
  description: string
  assigned_date: string
  created_at: string
  type?: string
}

export interface Income {
  daily_income_id: string
  amount: number
  description: string
  transaction_date: string
  choice: string
}

export interface BudgetPlan {
  plan_id: string
  daily_budget: number
  food_amount: number
  lifestyle_amount: number
  saving_type: string
  for_month: number
  for_year: number
  mid_cycle_days?: number
  cycle_start_date?: string
  savings_amount?: number
  total_mandatory?: number
  daily_savings?: number
  created_at?: string
  region?: string
  region_food_min?: number
  region_food_max?: number
  region_food_ceiling?: number
}

export interface MonthlySummary {
  total_income: number
  total_spent: number
  total_savings: number
}

export interface PersonalData {
  salary: number
  next_salary?: number | null
  payday_day: number
  saving_type: string
  name?: string
  age?: number
  location?: string
  job_title?: string
  employment_type?: string
}
