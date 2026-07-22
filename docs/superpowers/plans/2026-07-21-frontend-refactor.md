# Frontend Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor SaveMate Vue 3 frontend — extract API service layer, domain composables, fix TypeScript types and error handling — without changing any UX, routes, or API contracts.

**Architecture:** Views become thin shells (template + composable calls). Business logic moves to domain composables. All `api.*` calls centralize in typed service functions under `src/services/`.

**Tech Stack:** Vue 3 Composition API, TypeScript, Pinia, Vite, `vue-tsc` for type checking

## Global Constraints

- No changes to any template HTML, Tailwind classes, or any file under `src/components/`
- No changes to routes, API endpoints, or request/response shapes
- `npm run build` (runs `vue-tsc -b && vite build`) must pass after every task
- No new npm dependencies
- Working directory for all commands: `frontend/save-mate-client`
- All `api.*` calls must live in `src/services/` only — views and composables import service functions

---

## File Map

**New files:**
- `src/services/transaction.service.ts`
- `src/services/budget.service.ts`
- `src/services/plan.service.ts`
- `src/services/income.service.ts`
- `src/services/summary.service.ts`
- `src/services/personalData.service.ts`
- `src/services/mandatory.service.ts`
- `src/composables/useDashboard.ts`
- `src/composables/useEndDay.ts`
- `src/composables/useDeficit.ts`
- `src/composables/useFinancialSettings.ts`
- `src/composables/useIncome.ts`
- `src/composables/useBudgetPlan.ts`

**Modified files:**
- `src/types/index.ts` — add `EndDayChoice`, `AmbiguousResponse`, `MandatoryExpenditure`
- `src/utils/errors.ts` — fix `e: any` → `e: unknown`
- `src/stores/auth.ts` — fix `user: any` → `user: User | null`
- `src/views/DashboardView.vue` — slim `<script setup>`
- `src/views/TransactionsView.vue` — slim `<script setup>`
- `src/views/FinancialSettingsView.vue` — slim `<script setup>`
- `src/views/IncomeView.vue` — slim `<script setup>`
- `src/views/BudgetView.vue` — slim `<script setup>`
- `src/components/settings/MandatoryExpenseList.vue` — import type from `@/types`

**Deleted files:**
- `src/stores/deficit.ts` — dead code, zero callers

---

## Task 1: Extend Types + Create Service Layer

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/services/transaction.service.ts`
- Create: `src/services/budget.service.ts`
- Create: `src/services/plan.service.ts`
- Create: `src/services/income.service.ts`
- Create: `src/services/summary.service.ts`
- Create: `src/services/personalData.service.ts`
- Create: `src/services/mandatory.service.ts`

**Interfaces:**
- Produces: all service functions consumed by Tasks 3–6

- [ ] **Step 1: Extend `src/types/index.ts`** — add three missing types at the bottom of the file

```typescript
// append to src/types/index.ts

export interface EndDayChoice {
  Action: string
  TotalAmount: number
}

export interface AmbiguousResponse {
  requires_clarification: boolean
  message: string
  options: {
    yesterday_date: string
    today_date: string
  }
  original_payload?: Record<string, unknown>
}

export interface MandatoryExpenditure {
  mandatory_expenditure_id: string
  category: string
  description: string
  amount: number
  for_month?: number
  for_year?: number
}
```

- [ ] **Step 2: Create `src/services/transaction.service.ts`**

```typescript
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
```

- [ ] **Step 3: Create `src/services/budget.service.ts`**

```typescript
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
```

- [ ] **Step 4: Create `src/services/plan.service.ts`**

```typescript
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
```

- [ ] **Step 5: Create `src/services/income.service.ts`**

```typescript
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
```

- [ ] **Step 6: Create `src/services/summary.service.ts`**

```typescript
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
```

- [ ] **Step 7: Create `src/services/personalData.service.ts`**

```typescript
import api from '@/api'
import { extractError } from '@/utils/errors'
import type { PersonalData } from '@/types'

export async function getPersonalData(): Promise<PersonalData> {
  try {
    const res = await api.get('/personal-data/')
    return res.data.data as PersonalData
  } catch (e) {
    throw new Error(extractError(e, 'Gagal memuat data pribadi'))
  }
}

export async function updatePersonalData(payload: {
  salary: number
  saving_type: string
  purpose_of_join_here: string
}): Promise<PersonalData> {
  try {
    const res = await api.put('/personal-data/', payload)
    return res.data.data as PersonalData
  } catch (e) {
    throw new Error(extractError(e, 'Gagal menyimpan data pribadi'))
  }
}

export async function setNextSalary(nextSalary: number): Promise<void> {
  try {
    await api.patch('/personal-data/next-salary', { next_salary: nextSalary })
  } catch (e) {
    throw new Error(extractError(e, 'Gagal menyimpan gaji bulan depan'))
  }
}

export async function clearNextSalary(): Promise<void> {
  try {
    await api.delete('/personal-data/next-salary')
  } catch (e) {
    throw new Error(extractError(e, 'Gagal menghapus gaji bulan depan'))
  }
}
```

- [ ] **Step 8: Create `src/services/mandatory.service.ts`**

```typescript
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
```

- [ ] **Step 9: Verify**

```bash
npm run build
```

Expected: no TypeScript errors, build succeeds. The service files are not yet consumed so no usage errors.

- [ ] **Step 10: Commit**

```bash
git add src/types/index.ts src/services/
git commit -m "refactor: add typed service layer and extend types"
```

---

## Task 2: TypeScript Strictness + Error Handling

**Files:**
- Modify: `src/utils/errors.ts`
- Modify: `src/stores/auth.ts`

**Interfaces:**
- Consumes: `User` from `src/types/index.ts`
- Produces: `extractError(e: unknown)` signature used in all service files

- [ ] **Step 1: Fix `src/utils/errors.ts`** — change `e: any` to `e: unknown`

Replace the file content:

```typescript
export function extractError(e: unknown, fallback = 'Terjadi kesalahan'): string {
  const err = e as { response?: { data?: { errors?: string; message?: string } } }
  return err?.response?.data?.errors ?? err?.response?.data?.message ?? fallback
}
```

- [ ] **Step 2: Fix `src/stores/auth.ts`** — type `user` as `User | null`

Replace the import line and `user` ref:

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(null)
  const hasPersonalData = ref<boolean | null>(null)

  const isLoggedIn = computed(() => !!token.value)

  async function login(email: string, password: string) {
    const res = await api.post('/user/login', { email, password })
    token.value = res.data.data.token
    localStorage.setItem('token', token.value!)
    await fetchMe()
    await checkPersonalData()
  }

  async function register(email: string, password: string, username: string) {
    await api.post('/user/register', { email, password, username })
  }

  async function fetchMe() {
    const res = await api.get('/user/me')
    user.value = res.data.data as User
  }

  async function checkPersonalData() {
    try {
      await api.get('/personal-data/')
      hasPersonalData.value = true
    } catch (e: unknown) {
      const err = e as { response?: { status?: number } }
      if (err?.response?.status === 404) {
        hasPersonalData.value = false
      }
    }
  }

  function logout() {
    token.value = null
    user.value = null
    hasPersonalData.value = null
    localStorage.removeItem('token')
  }

  return { token, user, isLoggedIn, hasPersonalData, login, register, fetchMe, checkPersonalData, logout }
})
```

- [ ] **Step 3: Verify**

```bash
npm run build
```

Expected: passes. `auth.user.username` now type-checked against `User` interface.

- [ ] **Step 4: Commit**

```bash
git add src/utils/errors.ts src/stores/auth.ts
git commit -m "refactor: fix TypeScript types and standardize error handling"
```

---

## Task 3: useDashboard + useEndDay + Slim DashboardView

**Files:**
- Create: `src/composables/useDashboard.ts`
- Create: `src/composables/useEndDay.ts`
- Modify: `src/views/DashboardView.vue` (script section only)

**Interfaces:**
- Consumes: `getDailyStatus`, `getEndDayStatus`, `postEndDay`, `postUndoEndDay` from `budget.service.ts`; `getToday` from `transaction.service.ts`; `getPlanByMonth`, `checkReset` from `plan.service.ts`; `getMandatoryByMonth` from `mandatory.service.ts`
- Produces: `useDashboard()` and `useEndDay()` consumed by `DashboardView.vue`

- [ ] **Step 1: Create `src/composables/useDashboard.ts`**

```typescript
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePersonalDataStore } from '@/stores/personalData'
import { getDailyStatus, getEndDayStatus } from '@/services/budget.service'
import { getToday } from '@/services/transaction.service'
import { getPlanByMonth, checkReset } from '@/services/plan.service'
import { getMandatoryByMonth } from '@/services/mandatory.service'
import { toLocaleDateStr, addDays, formatCurrency, formatCurrencyShort } from '@/utils/formatting'
import { BUDGET_THRESHOLDS, SAVING_TYPES } from '@/constants/budgetConfig'
import type { DailyStatus, BudgetPlan, Transaction, BudgetTrackerItem, EndDayChoice } from '@/types'

export function useDashboard() {
  const auth = useAuthStore()
  const pdStore = usePersonalDataStore()

  const dailyStatus = ref<DailyStatus | null>(null)
  const budgetPlan = ref<BudgetPlan | null>(null)
  const todayTx = ref<Transaction[]>([])
  const tomorrowStatus = ref<DailyStatus | null>(null)
  const loadingTx = ref(true)
  const loadError = ref(false)
  const paydayDay = ref(0)
  const nextCycleMandatory = ref(0)
  const endDayChoice = ref<EndDayChoice | null>(null)

  const todayStr = ref('')
  const todayDate = ref('')
  const todayLabel = ref('')
  const yesterdayStr = ref('')
  const tomorrowStr = ref('')
  const tomorrowLabel = ref('')
  const tomorrowDay = ref(0)

  const firstName = computed(() => auth.user?.username?.split(' ')[0] ?? 'Pengguna')

  const foodTracker = computed<BudgetTrackerItem | undefined>(() =>
    dailyStatus.value?.budgets?.find(b => b.category === 'food')
  )
  const lifestyleTracker = computed<BudgetTrackerItem | undefined>(() =>
    dailyStatus.value?.budgets?.find(b => b.category !== 'food')
  )

  const foodAllocated = computed(() => {
    if (foodTracker.value) return foodTracker.value.allocated_amount + (foodTracker.value.carryover_in ?? 0)
    const plan = budgetPlan.value
    if (!plan) return 0
    const midCycleDays = plan.mid_cycle_days ?? 0
    const now = new Date()
    const days = midCycleDays > 0
      ? midCycleDays
      : new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    return (plan.food_amount ?? 0) / days
  })
  const foodSpent = computed(() => foodTracker.value?.actual_spent ?? 0)
  const foodRemaining = computed(() => foodAllocated.value - foodSpent.value)
  const foodUsedPct = computed(() => foodAllocated.value > 0 ? (foodSpent.value / foodAllocated.value) * 100 : 0)

  const foodBadgeClass = computed(() => {
    if (foodRemaining.value < 0) return 'bg-red-500/15 text-red-400'
    if (foodRemaining.value < foodAllocated.value * 0.2) return 'bg-yellow-500/15 text-yellow-400'
    return 'bg-emerald-500/15 text-emerald-400'
  })
  const foodBadgeText = computed(() =>
    foodRemaining.value < 0 ? 'Over budget' : 'Sisa ' + formatCurrencyShort(foodRemaining.value)
  )
  const foodBarClass = computed(() => {
    if (foodUsedPct.value > BUDGET_THRESHOLDS.critical) return 'bg-red-400'
    if (foodUsedPct.value > BUDGET_THRESHOLDS.warning) return 'bg-yellow-400'
    return 'bg-emerald-400'
  })

  const displayAllocated = computed(() => {
    const base = budgetPlan.value?.daily_budget ?? 0
    const totalCarryover = (dailyStatus.value?.budgets ?? []).reduce((s, b) => s + (b.carryover_in ?? 0), 0)
    return base + totalCarryover
  })
  const displaySpent = computed(() => dailyStatus.value?.total_spent ?? 0)
  const totalRemaining = computed(() => dailyStatus.value?.total_remaining ?? 0)

  const tomorrowIsNewCycle = computed(() =>
    paydayDay.value > 0 && tomorrowDay.value === paydayDay.value
  )

  const nextCycleDailyBudget = computed(() => {
    const pd = pdStore.data
    if (!pd) return null
    const salary = pd.salary ?? 0
    if (!salary) return null
    const savingType = (pd.saving_type ?? 'recommendation').toLowerCase()
    const spend = SAVING_TYPES[savingType]?.spend ?? 0.6
    const available = salary - nextCycleMandatory.value
    if (!tomorrowStr.value) return null
    const td = new Date(tomorrowStr.value)
    const daysInMonth = new Date(td.getFullYear(), td.getMonth() + 1, 0).getDate()
    return available > 0 ? Math.round((available * spend) / daysInMonth) : null
  })

  const tomorrowSummary = computed(() => {
    const plan = budgetPlan.value
    const dailyBudget = plan?.daily_budget ?? 0
    if (!dailyBudget) return null
    const midCycle = plan?.mid_cycle_days ?? 0
    const now = new Date()
    const daysInMonth = midCycle > 0
      ? midCycle
      : new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const foodAlloc = plan?.food_amount
      ? plan.food_amount / daysInMonth
      : (dailyStatus.value?.budgets?.find(b => b.category === 'food')?.allocated_amount ?? 0)
    const othersAllocated = dailyBudget - foodAlloc

    const tomorrowBudgets = tomorrowStatus.value?.budgets ?? []
    const tomorrowFood = tomorrowBudgets.find(b => b.category === 'food')
    const foodCarryover = (tomorrowFood?.carryover_in ?? 0) + (tomorrowFood?.deficit_cut_in ?? 0)
    const othersCarryover = tomorrowBudgets
      .filter(b => b.category !== 'food')
      .reduce((s, b) => s + (b.carryover_in ?? 0) + (b.deficit_cut_in ?? 0), 0)

    const foodEffective = foodAlloc + foodCarryover
    const othersEffectiveRaw = othersAllocated + othersCarryover
    const othersEffective = Math.max(othersEffectiveRaw, 0)
    const totalEffective = foodEffective + othersEffective
    const netCut = totalEffective - dailyBudget

    return {
      foodAllocated: foodAlloc, foodCarryover, foodEffective,
      othersAllocated, othersCarryover, othersEffective,
      totalAllocated: dailyBudget, totalCut: netCut, totalEffective,
      hasAdjustment: netCut !== 0, hasData: true,
    }
  })

  const summaryStats = computed(() => [
    { icon: '⬇️', value: formatCurrency(displaySpent.value), label: 'Terpakai' },
    { icon: '📅', value: formatCurrency(displayAllocated.value), label: 'Budget/Hari' },
    { icon: '💳', value: todayTx.value.length + 'x', label: 'Transaksi' },
  ])

  const quickActions = [
    { to: '/app/transactions', icon: '➕', label: 'Tambah Transaksi', sub: 'Catat pengeluaran', bg: 'bg-emerald-500/15' },
    { to: '/app/budget',       icon: '📊', label: 'Budget Plan',      sub: 'Lihat rencana',    bg: 'bg-cyan-500/15' },
    { to: '/app/income',       icon: '💰', label: 'Pemasukan',        sub: 'Kelola income',    bg: 'bg-violet-500/15' },
    { to: '/app/summary',      icon: '📈', label: 'Ringkasan',        sub: 'Laporan bulanan',  bg: 'bg-orange-500/15' },
  ]

  function buildDates() {
    const now = new Date()
    todayDate.value = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    todayStr.value = toLocaleDateStr(now)
    todayLabel.value = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
    yesterdayStr.value = addDays(todayStr.value, -1)
    tomorrowStr.value = addDays(todayStr.value, 1)
    const tm = new Date(now); tm.setDate(tm.getDate() + 1)
    tomorrowLabel.value = tm.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
    tomorrowDay.value = tm.getDate()
  }

  async function loadDashboard() {
    loadError.value = false
    buildDates()
    const now = new Date()
    try {
      await pdStore.fetch()
      const [statusRes, txRes, planRes, tomorrowRes, mandatoryRes, endDayRes] = await Promise.all([
        getDailyStatus(todayStr.value).catch(() => null),
        getToday().catch(() => []),
        getPlanByMonth(now.getMonth() + 1, now.getFullYear()).catch(() => null),
        getDailyStatus(tomorrowStr.value).catch(() => null),
        getMandatoryByMonth(now.getMonth() + 1, now.getFullYear()).catch(() => []),
        getEndDayStatus(todayStr.value),
      ])
      if (!planRes) loadError.value = true
      dailyStatus.value = statusRes
      todayTx.value = txRes
      budgetPlan.value = planRes
      tomorrowStatus.value = tomorrowRes
      paydayDay.value = pdStore.data?.payday_day ?? 0
      nextCycleMandatory.value = (mandatoryRes as Array<{ amount: number }>).reduce((s, e) => s + (e.amount ?? 0), 0)
      endDayChoice.value = endDayRes
    } catch {
      loadError.value = true
    } finally {
      loadingTx.value = false
    }
  }

  return {
    dailyStatus, budgetPlan, todayTx, tomorrowStatus,
    loadingTx, loadError, paydayDay, endDayChoice,
    todayStr, todayDate, todayLabel, yesterdayStr, tomorrowStr, tomorrowLabel, tomorrowDay,
    firstName, foodTracker, lifestyleTracker,
    foodAllocated, foodSpent, foodRemaining, foodUsedPct,
    foodBadgeClass, foodBadgeText, foodBarClass,
    displayAllocated, displaySpent, totalRemaining,
    tomorrowIsNewCycle, nextCycleDailyBudget, tomorrowSummary,
    summaryStats, quickActions,
    loadDashboard,
  }
}
```

- [ ] **Step 2: Create `src/composables/useEndDay.ts`**

```typescript
import { ref, computed } from 'vue'
import { postEndDay, postUndoEndDay, getDailyStatus } from '@/services/budget.service'
import type { EndDayChoice, BudgetTrackerItem } from '@/types'

export function useEndDay(
  todayStr: Readonly<{ value: string }>,
  yesterdayStr: Readonly<{ value: string }>,
  endDayChoice: { value: EndDayChoice | null },
  totalRemaining: Readonly<{ value: number }>,
  onReload: () => Promise<void>
) {
  const showEndDayModal = ref(false)
  const endDayAction = ref('')
  const endDayTotal = ref(0)
  const submittingEndDay = ref(false)
  const endDayError = ref('')
  const undoError = ref('')
  const undoing = ref(false)

  const canEndDay = computed(() => !endDayChoice.value && totalRemaining.value > 0)
  const canUndoEndDay = computed(() => !!endDayChoice.value && new Date().getHours() < 22)

  function triggerEndOfDay() {
    endDayTotal.value = totalRemaining.value
    endDayAction.value = ''
    endDayError.value = ''
    showEndDayModal.value = true
  }

  async function submitEndDay() {
    if (!endDayAction.value) return
    submittingEndDay.value = true
    endDayError.value = ''
    try {
      await postEndDay(todayStr.value, endDayAction.value, endDayTotal.value)
      showEndDayModal.value = false
      await onReload()
    } catch (e: unknown) {
      endDayError.value = e instanceof Error ? e.message : 'Gagal menyimpan. Coba lagi.'
    } finally {
      submittingEndDay.value = false
    }
  }

  async function undoEndDay() {
    undoing.value = true
    undoError.value = ''
    try {
      await postUndoEndDay(todayStr.value)
      await onReload()
    } catch (e: unknown) {
      undoError.value = e instanceof Error ? e.message : 'Gagal membatalkan.'
    } finally {
      undoing.value = false
    }
  }

  async function checkYesterdayCarryover() {
    if (!yesterdayStr.value) return
    try {
      const status = await getDailyStatus(yesterdayStr.value).catch(() => null)
      if (!status) return
      const budgets = (status.budgets ?? []) as BudgetTrackerItem[]
      const pending = budgets.filter(b => !b.is_finalized && b.remaining > 0)
      if (pending.length === 0) return
      const hour = new Date().getHours()
      if (hour >= 22 || hour < 6) return
      const totalRem = pending.reduce((s, b) => s + b.remaining, 0)
      await postEndDay(yesterdayStr.value, 'save', totalRem)
      await onReload()
    } catch {
      // non-critical — silently ignore
    }
  }

  return {
    showEndDayModal, endDayAction, endDayTotal,
    submittingEndDay, endDayError, undoError, undoing,
    canEndDay, canUndoEndDay,
    triggerEndOfDay, submitEndDay, undoEndDay, checkYesterdayCarryover,
  }
}
```

- [ ] **Step 3: Replace `<script setup>` in `src/views/DashboardView.vue`**

Replace only the `<script setup lang="ts">...</script>` block (keep the template unchanged):

```typescript
<script setup lang="ts">
import { onMounted, onActivated } from 'vue'
import { RouterLink } from 'vue-router'
import { formatCurrency, formatCurrencyShort } from '@/utils/formatting'
import { checkReset } from '@/services/plan.service'
import BudgetHistoryChart from '@/components/BudgetHistoryChart.vue'
import DailyBudgetCard from '@/components/dashboard/DailyBudgetCard.vue'
import TomorrowPreview from '@/components/dashboard/TomorrowPreview.vue'
import CarryoverModal from '@/components/dashboard/CarryoverModal.vue'
import { useDashboard } from '@/composables/useDashboard'
import { useEndDay } from '@/composables/useEndDay'

const {
  dailyStatus, budgetPlan, todayTx, tomorrowStatus,
  loadingTx, loadError, paydayDay, endDayChoice,
  todayStr, todayDate, todayLabel, yesterdayStr, tomorrowStr, tomorrowLabel, tomorrowDay,
  firstName, foodTracker, lifestyleTracker,
  foodAllocated, foodSpent, foodRemaining, foodUsedPct,
  foodBadgeClass, foodBadgeText, foodBarClass,
  displayAllocated, displaySpent, totalRemaining,
  tomorrowIsNewCycle, nextCycleDailyBudget, tomorrowSummary,
  summaryStats, quickActions,
  loadDashboard,
} = useDashboard()

const {
  showEndDayModal, endDayAction, endDayTotal,
  submittingEndDay, endDayError, undoError, undoing,
  canEndDay, canUndoEndDay,
  triggerEndOfDay, submitEndDay, undoEndDay, checkYesterdayCarryover,
} = useEndDay(todayStr, yesterdayStr, endDayChoice, totalRemaining, loadDashboard)

onMounted(async () => {
  checkReset()
  await loadDashboard()
  await checkYesterdayCarryover()
})
onActivated(loadDashboard)
</script>
```

- [ ] **Step 4: Verify**

```bash
npm run build
```

Expected: passes. DashboardView template bindings all resolve through the composables.

- [ ] **Step 5: Commit**

```bash
git add src/composables/useDashboard.ts src/composables/useEndDay.ts src/views/DashboardView.vue
git commit -m "refactor: extract useDashboard and useEndDay composables"
```

---

## Task 4: useDeficit + Slim TransactionsView

**Files:**
- Create: `src/composables/useDeficit.ts`
- Modify: `src/views/TransactionsView.vue` (script section only)

**Interfaces:**
- Consumes: `patchDeficitChoice`, `getByDate` from `transaction.service.ts`; `getDailyStatus`, `postCarryover` from `budget.service.ts`
- Produces: `useDeficit()` consumed by `TransactionsView.vue`

- [ ] **Step 1: Create `src/composables/useDeficit.ts`**

```typescript
import { ref } from 'vue'
import { patchDeficitChoice, getByDate } from '@/services/transaction.service'
import { getDailyStatus, postCarryover } from '@/services/budget.service'
import { toLocaleDateStr, addDays } from '@/utils/formatting'

export function useDeficit(onAfterHandled: () => Promise<void>) {
  const showBudgetExceededModal = ref(false)
  const budgetExceeded = ref<{ category: string; deficit: number } | null>(null)
  const applyingDeficit = ref(false)
  const deductingSavings = ref(false)
  const tomorrowCutCapacity = ref(0)
  const budgetExceededError = ref('')
  const isHandlingOverrun = ref(false)
  let _overrunVer = 0

  async function checkDailyBudgetOverrun() {
    if (showBudgetExceededModal.value || isHandlingOverrun.value) return
    const myVer = ++_overrunVer
    try {
      const today = toLocaleDateStr(new Date())
      const tomorrow = addDays(today, 1)
      const [budgetData, txs, tomorrowData] = await Promise.all([
        getDailyStatus(today).catch(() => null),
        getByDate(today).catch(() => []),
        getDailyStatus(tomorrow).catch(() => null),
      ])
      if (!budgetData) return

      const dailyBudget = (budgetData as { daily_budget?: number; total_allocated?: number }).daily_budget
        ?? (budgetData as { daily_budget?: number; total_allocated?: number }).total_allocated ?? 0
      const foodDailyBudget = (budgetData as { food_daily_budget?: number }).food_daily_budget ?? 0
      const nonFoodDailyBudget = dailyBudget - foodDailyBudget
      const totalSpentVal = budgetData.total_spent ?? 0
      const totalDeficit = totalSpentVal - dailyBudget
      if (totalDeficit <= 0) {
        if (myVer !== _overrunVer) return
        patchDeficitChoice(today, 'normal', 0).catch(() => {})
        return
      }

      const savingsAlreadyCut = txs.reduce((s, t) => s + ((t as { deficit_savings_cut?: number }).deficit_savings_cut ?? 0), 0)
      const tomorrowBudgets = tomorrowData?.budgets ?? []
      const tomorrowAlreadyCut = tomorrowBudgets
        .filter(b => b.category !== 'food')
        .reduce((s, b) => s + Math.abs(Math.min((b as { deficit_cut_in?: number }).deficit_cut_in ?? 0, 0)), 0)
      const incrementalDeficit = Math.max(totalDeficit - savingsAlreadyCut - tomorrowAlreadyCut, 0)
      if (myVer !== _overrunVer) return
      if (incrementalDeficit < 1) {
        patchDeficitChoice(today, 'normal', 0).catch(() => {})
        return
      }

      tomorrowCutCapacity.value = Math.max(nonFoodDailyBudget - tomorrowAlreadyCut, 0)
      budgetExceeded.value = { category: '', deficit: incrementalDeficit }
      budgetExceededError.value = ''
      showBudgetExceededModal.value = true
    } catch (e) {
      console.error('[overrun check] error:', e)
    }
  }

  async function deductFromSavings() {
    if (!budgetExceeded.value) return
    deductingSavings.value = true
    isHandlingOverrun.value = true
    budgetExceededError.value = ''
    ++_overrunVer
    try {
      const today = toLocaleDateStr(new Date())
      await patchDeficitChoice(today, 'savings', budgetExceeded.value.deficit)
      showBudgetExceededModal.value = false
      budgetExceeded.value = null
      await onAfterHandled()
    } catch (e: unknown) {
      budgetExceededError.value = e instanceof Error ? e.message : 'Gagal memotong tabungan. Coba lagi.'
    } finally {
      deductingSavings.value = false
      isHandlingOverrun.value = false
    }
  }

  async function confirmDeficit() {
    if (!budgetExceeded.value) return
    applyingDeficit.value = true
    isHandlingOverrun.value = true
    budgetExceededError.value = ''
    ++_overrunVer
    try {
      const today = toLocaleDateStr(new Date())
      const deficit = Math.round(budgetExceeded.value.deficit)
      const toCutTomorrow = Math.min(deficit, Math.round(tomorrowCutCapacity.value))
      const toCutSavings = Math.max(0, deficit - toCutTomorrow)

      if (toCutTomorrow > 0) {
        const nonFoodCats = ['entertainment', 'shopping', 'misc']
        await Promise.all(nonFoodCats.map(cat =>
          postCarryover(today, cat, -(toCutTomorrow / nonFoodCats.length), 'cut_tomorrow')
        ))
      }
      await patchDeficitChoice(today, 'tomorrow', toCutSavings)
      showBudgetExceededModal.value = false
      budgetExceeded.value = null
      await onAfterHandled()
    } catch (e: unknown) {
      budgetExceededError.value = e instanceof Error ? e.message : 'Gagal memotong budget besok. Coba lagi.'
    } finally {
      applyingDeficit.value = false
      isHandlingOverrun.value = false
    }
  }

  return {
    showBudgetExceededModal, budgetExceeded,
    applyingDeficit, deductingSavings,
    tomorrowCutCapacity, budgetExceededError,
    checkDailyBudgetOverrun, deductFromSavings, confirmDeficit,
  }
}
```

- [ ] **Step 2: Replace `<script setup>` in `src/views/TransactionsView.vue`**

Replace only the `<script setup lang="ts">...</script>` block (keep template unchanged):

```typescript
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import ModalWrapper from '@/components/ui/ModalWrapper.vue'
import AppButton from '@/components/ui/AppButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import TransactionFormModal from '@/components/transactions/TransactionFormModal.vue'
import TransactionItem from '@/components/transactions/TransactionItem.vue'
import DateFilterBar from '@/components/transactions/DateFilterBar.vue'
import { formatCurrency, toLocaleDateStr, addDays } from '@/utils/formatting'
import { exportTransactionsToExcel } from '@/utils/exportExcel'
import { Loader2, Download } from 'lucide-vue-next'
import { useListFilter } from '@/composables/useListFilter'
import { useDeficit } from '@/composables/useDeficit'
import {
  getToday, getByDate, getByRange,
  addTransactionWithChoice, deleteTransaction,
} from '@/services/transaction.service'
import type { Transaction, AmbiguousResponse } from '@/types'

const {
  todayStr, filterMode, modes,
  selectedDate, isToday, dateLabel: selectedLabel, prevDay, nextDay,
  rangeFromDate, rangeToDate, rangeLabel, shiftRange,
} = useListFilter()

function onFilterModeChange(m: 'single' | 'range' | 'all') {
  filterMode.value = m
  loadTransactions()
}

const transactions = ref<Transaction[]>([])
const loading = ref(true)
const loadError = ref('')
const recalculating = ref(false)

const showFormModal = ref(false)
const editingTransaction = ref<Transaction | null>(null)

const showAmbiguousModal = ref(false)
const ambiguous = ref<AmbiguousResponse | null>(null)
const pendingPayload = ref<Record<string, unknown> | null>(null)

const showDeleteModal = ref(false)
const deletingId = ref('')
const deleteLoading = ref(false)

async function loadTransactions() {
  loading.value = true
  loadError.value = ''
  try {
    if (filterMode.value === 'single') {
      transactions.value = isToday.value ? await getToday() : await getByDate(selectedDate.value)
    } else if (filterMode.value === 'range') {
      transactions.value = await getByRange(rangeFromDate.value, rangeToDate.value)
    } else {
      const now = new Date()
      const from = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`
      transactions.value = await getByRange(from, todayStr)
    }
  } catch (e: unknown) {
    loadError.value = e instanceof Error ? e.message : 'Gagal memuat transaksi'
    transactions.value = []
  } finally {
    loading.value = false
  }
}

async function waitAndReload() {
  recalculating.value = true
  await loadTransactions()
  recalculating.value = false
}

const {
  showBudgetExceededModal, budgetExceeded,
  applyingDeficit, deductingSavings,
  tomorrowCutCapacity, budgetExceededError,
  checkDailyBudgetOverrun, deductFromSavings, confirmDeficit,
} = useDeficit(loadTransactions)

function openAddModal() { editingTransaction.value = null; showFormModal.value = true }
function openEditModal(tx: Transaction) { editingTransaction.value = tx; showFormModal.value = true }
function onDeleteRequest(tx: Transaction) { deletingId.value = tx.transaction_id; showDeleteModal.value = true }

async function confirmDelete() {
  deleteLoading.value = true
  try {
    await deleteTransaction(deletingId.value)
    showDeleteModal.value = false
    await waitAndReload()
    await checkDailyBudgetOverrun()
  } catch (e: unknown) {
    loadError.value = e instanceof Error ? e.message : 'Gagal menghapus transaksi'
  } finally {
    deleteLoading.value = false
  }
}

async function onFormSaved(
  clarification?: { message: string; options: { yesterday_date: string; today_date: string }; originalPayload?: Record<string, unknown> }
) {
  if (clarification) {
    ambiguous.value = clarification as AmbiguousResponse
    pendingPayload.value = clarification.originalPayload ?? null
    showAmbiguousModal.value = true
    return
  }
  await waitAndReload()
  await checkDailyBudgetOverrun()
}

async function chooseDate(date: string) {
  if (!ambiguous.value) return
  try {
    await addTransactionWithChoice({ ...(pendingPayload.value as Record<string, unknown> ?? {}), user_choice_date: date } as Parameters<typeof addTransactionWithChoice>[0])
    showAmbiguousModal.value = false
    ambiguous.value = null
    pendingPayload.value = null
    await loadTransactions()
  } catch {
    showAmbiguousModal.value = false
  }
}

const totalSpent = computed(() => transactions.value.reduce((s, t) => s + (t.amount ?? 0), 0))

const groupedTransactions = computed(() => {
  const groups: Record<string, Transaction[]> = {}
  for (const tx of transactions.value) {
    const date = tx.assigned_date?.split('T')[0] ?? 'unknown'
    if (!groups[date]) groups[date] = []
    groups[date].push(tx)
  }
  return groups
})

function formatDateGroup(dateStr: string) {
  if (dateStr === todayStr) return 'Hari Ini'
  if (dateStr === addDays(todayStr, -1)) return 'Kemarin'
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function doExportExcel() {
  const label = filterMode.value === 'single'
    ? selectedDate.value
    : filterMode.value === 'range'
      ? `${rangeFromDate.value}_sd_${rangeToDate.value}`
      : 'semua'
  exportTransactionsToExcel(transactions.value, label)
}

watch(selectedDate, () => { if (filterMode.value === 'single') loadTransactions() })
watch([rangeFromDate, rangeToDate], () => { if (filterMode.value === 'range') loadTransactions() })

onMounted(async () => {
  await loadTransactions()
  await checkDailyBudgetOverrun()
})
</script>
```

- [ ] **Step 3: Verify**

```bash
npm run build
```

Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add src/composables/useDeficit.ts src/views/TransactionsView.vue
git commit -m "refactor: extract useDeficit composable, slim TransactionsView"
```

---

## Task 5: useFinancialSettings + Slim FinancialSettingsView

**Files:**
- Create: `src/composables/useFinancialSettings.ts`
- Modify: `src/views/FinancialSettingsView.vue` (script section only)

**Interfaces:**
- Consumes: `getPersonalData`, `updatePersonalData`, `setNextSalary`, `clearNextSalary` from `personalData.service.ts`; `getPlanByMonth`, `createOrUpdatePlan` from `plan.service.ts`; `getMandatoryByMonth`, `addMandatory`, `deleteMandatory` from `mandatory.service.ts`; `getSummaryByMonth` from `summary.service.ts`; `syncToday` from `budget.service.ts`
- Produces: `useFinancialSettings()` consumed by `FinancialSettingsView.vue`

- [ ] **Step 1: Create `src/composables/useFinancialSettings.ts`**

```typescript
import { ref, computed } from 'vue'
import { getPersonalData, updatePersonalData, setNextSalary, clearNextSalary } from '@/services/personalData.service'
import { getPlanByMonth, createOrUpdatePlan } from '@/services/plan.service'
import { getMandatoryByMonth, addMandatory, deleteMandatory } from '@/services/mandatory.service'
import { getSummaryByMonth } from '@/services/summary.service'
import { syncToday } from '@/services/budget.service'
import { calcBudgetPreview } from '@/constants/budgetConfig'
import { formatCurrency, formatCurrencyShort } from '@/utils/formatting'
import type { BudgetPlan, MandatoryExpenditure } from '@/types'
import type { PersonalDataFormData } from '@/components/settings/PersonalDataForm.vue'

export function useFinancialSettings() {
  const now = new Date()
  const _nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const nextMonthNum = _nextMonthDate.getMonth() + 1
  const nextYearNum = _nextMonthDate.getFullYear()

  const loading = ref(true)
  const mandatoryLoading = ref(false)
  const isDirty = ref(false)
  const editingPersonal = ref(false)
  const hasTransactions = ref(false)
  const savingPersonal = ref(false)
  const personalError = ref('')
  const savingNextSalary = ref(false)
  const clearingNextSalary = ref(false)
  const nextSalaryError = ref('')
  const showAddExpense = ref(false)
  const addingExpense = ref(false)
  const recalculating = ref(false)
  const recalcPhase = ref('')
  const budgetRefreshing = ref(false)
  const toast = ref<{ message: string; type: 'success' | 'error' } | null>(null)
  let toastTimer: ReturnType<typeof setTimeout> | null = null

  const personalFormData = ref<PersonalDataFormData>({ salary: 0, savingType: '', purpose: '' })
  const originalPersonal = ref<{ salary: number; savingType: string }>({ salary: 0, savingType: '' })
  const salaryDisplay = ref('')
  const nextSalary = ref<number | null>(null)
  const nextSalaryDisplay = ref('')

  const nextSalaryNumeric = computed(() => {
    const raw = nextSalaryDisplay.value.replace(/\./g, '')
    return raw ? Number(raw) : 0
  })
  const salaryNumeric = computed(() => {
    const raw = salaryDisplay.value.replace(/\./g, '')
    return raw ? Number(raw) : 0
  })

  const expenses = ref<MandatoryExpenditure[]>([])
  const nextCycleExpenses = ref<MandatoryExpenditure[]>([])
  const budgetPlan = ref<BudgetPlan | null>(null)
  const paydayDay = ref(1)

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const nextMonthDays = computed(() => new Date(now.getFullYear(), now.getMonth() + 2, 0).getDate())

  const totalMandatory = computed(() => expenses.value.reduce((s, e) => s + (e.amount ?? 0), 0))
  const allExpenses = computed(() => [...(expenses.value ?? []), ...(nextCycleExpenses.value ?? [])])

  const canEditFinancials = computed(() => {
    if (!budgetPlan.value) return true
    return now.getDate() === paydayDay.value
  })

  const nextBudgetPreview = computed(() => {
    if (nextSalaryNumeric.value <= 0) return null
    const allMandatory = allExpenses.value.reduce((s, e) => s + (e.amount ?? 0), 0)
    return calcBudgetPreview(nextSalaryNumeric.value, allMandatory, personalFormData.value.savingType, nextMonthDays.value)
  })

  const monthLabel = computed(() => {
    const b = budgetPlan.value
    if (!b) return now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    const fmt = (d: Date) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    const month = (b.for_month as number) - 1
    const year = b.for_year as number
    if ((b.mid_cycle_days as number) > 0) {
      const startDate = new Date(b.created_at as string)
      startDate.setHours(0, 0, 0, 0)
      const pd = paydayDay.value
      let endDate = new Date(year, month, pd - 1)
      if (endDate < startDate) endDate = new Date(year, month + 1, pd - 1)
      return `${fmt(startDate)} – ${fmt(endDate)}`
    }
    const cycleStart = new Date(year, month, paydayDay.value)
    const cycleEnd = new Date(year, month + 1, paydayDay.value)
    return `${fmt(cycleStart)} – ${fmt(cycleEnd)}`
  })

  const fmtCur = formatCurrency
  const fmtShort = formatCurrencyShort

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    if (toastTimer) clearTimeout(toastTimer)
    toast.value = { message, type }
    toastTimer = setTimeout(() => { toast.value = null }, 3500)
  }

  function toggleEdit() {
    editingPersonal.value = !editingPersonal.value
    if (editingPersonal.value && personalFormData.value.salary > 0) {
      salaryDisplay.value = String(Math.round(personalFormData.value.salary)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      originalPersonal.value = { salary: personalFormData.value.salary, savingType: personalFormData.value.savingType }
    }
  }

  function formatNextSalaryInput() {
    const raw = nextSalaryDisplay.value.replace(/\D/g, '')
    nextSalaryDisplay.value = raw ? Number(raw).toLocaleString('id-ID') : ''
  }

  async function loadAll() {
    loading.value = true
    try {
      const [pdRes, bpRes, summaryRes] = await Promise.allSettled([
        getPersonalData(),
        getPlanByMonth(now.getMonth() + 1, now.getFullYear()),
        getSummaryByMonth(now.getMonth() + 1, now.getFullYear()),
      ])

      if (pdRes.status === 'fulfilled') {
        const pd = pdRes.value
        paydayDay.value = pd.payday_day ?? 1
        personalFormData.value = {
          salary: pd.salary ?? 0,
          savingType: pd.saving_type ?? '',
          purpose: (pd as unknown as { purpose_of_join_here?: string }).purpose_of_join_here ?? '',
        }
        if (pd.salary > 0) {
          salaryDisplay.value = String(Math.round(pd.salary)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
        }
        nextSalary.value = pd.next_salary ?? null
        if (nextSalary.value && nextSalary.value > 0) {
          nextSalaryDisplay.value = String(Math.round(nextSalary.value)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
        }
      }

      if (bpRes.status === 'fulfilled') budgetPlan.value = bpRes.value
      if (summaryRes.status === 'fulfilled') {
        const s = summaryRes.value as unknown as { total_food_spent?: number; total_lifestyle_spent?: number }
        if (((s?.total_food_spent ?? 0) + (s?.total_lifestyle_spent ?? 0)) > 0) hasTransactions.value = true
      }
      await loadExpenses()
    } finally {
      loading.value = false
    }
  }

  async function loadExpenses() {
    mandatoryLoading.value = true
    try {
      expenses.value = await getMandatoryByMonth(now.getMonth() + 1, now.getFullYear())
    } catch { expenses.value = [] }
    finally { mandatoryLoading.value = false }
    try {
      nextCycleExpenses.value = await getMandatoryByMonth(nextMonthNum, nextYearNum)
    } catch { nextCycleExpenses.value = [] }
  }

  async function savePersonal() {
    savingPersonal.value = true
    personalError.value = ''
    const newSalary = salaryNumeric.value
    if (newSalary <= totalMandatory.value) {
      personalError.value = `Gaji (${fmtCur(newSalary)}) tidak boleh lebih kecil atau sama dengan total pengeluaran wajib (${fmtCur(totalMandatory.value)}). Kurangi pengeluaran wajib terlebih dahulu.`
      savingPersonal.value = false
      return
    }
    try {
      personalFormData.value.salary = newSalary
      await updatePersonalData({
        salary: personalFormData.value.salary,
        saving_type: personalFormData.value.savingType,
        purpose_of_join_here: personalFormData.value.purpose,
      })
      editingPersonal.value = false
      await recalculate()
    } catch (e: unknown) {
      personalError.value = e instanceof Error ? e.message : 'Gagal menyimpan'
      savingPersonal.value = false
    }
  }

  async function handleSaveNextSalary() {
    nextSalaryError.value = ''
    if (nextSalaryNumeric.value <= 0) return
    if (nextSalaryNumeric.value === personalFormData.value.salary) {
      nextSalaryError.value = `Gaji yang dimasukkan (${fmtCur(nextSalaryNumeric.value)}) sama dengan gaji sekarang — tidak ada perubahan.`
      return
    }
    savingNextSalary.value = true
    try {
      await setNextSalary(nextSalaryNumeric.value)
      nextSalary.value = nextSalaryNumeric.value
      showToast(`Gaji baru ${fmtCur(nextSalaryNumeric.value)} akan aktif mulai gajian tgl ${paydayDay.value}`)
    } catch (e: unknown) {
      nextSalaryError.value = e instanceof Error ? e.message : 'Gagal menyimpan'
    } finally {
      savingNextSalary.value = false
    }
  }

  async function handleClearNextSalary() {
    clearingNextSalary.value = true
    try {
      await clearNextSalary()
      nextSalary.value = null
      nextSalaryDisplay.value = ''
      showToast('Gaji bulan depan dihapus')
    } catch (e: unknown) {
      nextSalaryError.value = e instanceof Error ? e.message : 'Gagal menghapus'
    } finally {
      clearingNextSalary.value = false
    }
  }

  async function recalculate() {
    recalculating.value = true
    recalcPhase.value = 'Membaca data terbaru...'
    try {
      const region = budgetPlan.value?.region ?? 'Jakarta'
      recalcPhase.value = 'Menghitung ulang alokasi...'
      await createOrUpdatePlan({
        for_month: now.getMonth() + 1,
        for_year: now.getFullYear(),
        saving_type: personalFormData.value.savingType,
        region,
      })
      recalcPhase.value = 'Memperbarui budget harian...'
      budgetPlan.value = await getPlanByMonth(now.getMonth() + 1, now.getFullYear())
      isDirty.value = false
      syncToday()
      showToast('Budget berhasil dihitung ulang')
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Gagal menghitung ulang budget', 'error')
    } finally {
      recalculating.value = false
      savingPersonal.value = false
    }
  }

  async function silentRecalculate() {
    if (!budgetPlan.value) return
    budgetRefreshing.value = true
    try {
      const region = (budgetPlan.value.region as string) ?? ''
      const savingType = (budgetPlan.value.saving_type as string) || personalFormData.value.savingType || 'recommendation'
      await createOrUpdatePlan({ for_month: now.getMonth() + 1, for_year: now.getFullYear(), saving_type: savingType, region })
      budgetPlan.value = await getPlanByMonth(now.getMonth() + 1, now.getFullYear())
      isDirty.value = false
      syncToday()
      showToast('Budget plan bulan ini diperbarui otomatis')
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Gagal memperbarui budget', 'error')
    } finally {
      budgetRefreshing.value = false
    }
  }

  async function handleAddMandatory(item: { category: string; description: string; amount: number; forMonth: number; forYear: number }) {
    addingExpense.value = true
    const isCurrentCycle = item.forMonth === (now.getMonth() + 1) && item.forYear === now.getFullYear()
    try {
      await addMandatory({
        category: item.category,
        amount: item.amount,
        description: item.description,
        transaction_date: new Date().toISOString(),
        for_month: item.forMonth,
        for_year: item.forYear,
      })
      showAddExpense.value = false
      await loadExpenses()
      if (isCurrentCycle) {
        budgetPlan.value = await getPlanByMonth(now.getMonth() + 1, now.getFullYear())
        showToast('Pengeluaran wajib ditambahkan, tabungan dipotong otomatis')
      } else {
        showToast('Dicatat — berlaku mulai gajian berikutnya')
      }
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Gagal menambah pengeluaran wajib', 'error')
    } finally {
      addingExpense.value = false
    }
  }

  async function handleDeleteMandatory(id: string) {
    try {
      await deleteMandatory(id)
      await loadExpenses()
      await silentRecalculate()
    } catch {
      showToast('Gagal menghapus pengeluaran wajib', 'error')
    }
  }

  return {
    loading, mandatoryLoading, isDirty, editingPersonal, hasTransactions,
    savingPersonal, personalError, savingNextSalary, clearingNextSalary, nextSalaryError,
    showAddExpense, addingExpense, recalculating, recalcPhase, budgetRefreshing, toast,
    personalFormData, salaryDisplay, nextSalary, nextSalaryDisplay,
    nextSalaryNumeric, salaryNumeric,
    expenses, nextCycleExpenses, budgetPlan, paydayDay,
    daysInMonth, nextMonthDays, nextMonthNum, nextYearNum,
    totalMandatory, allExpenses, canEditFinancials, nextBudgetPreview, monthLabel,
    fmtCur, fmtShort,
    loadAll, toggleEdit, formatNextSalaryInput,
    savePersonal, handleSaveNextSalary, handleClearNextSalary,
    recalculate, silentRecalculate, handleAddMandatory, handleDeleteMandatory,
  }
}
```

- [ ] **Step 2: Replace `<script setup>` in `src/views/FinancialSettingsView.vue`**

Replace only the `<script setup lang="ts">...</script>` block (keep template and `<style scoped>` unchanged):

```typescript
<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import PersonalDataForm from '@/components/settings/PersonalDataForm.vue'
import MandatoryExpenseList from '@/components/settings/MandatoryExpenseList.vue'
import BudgetPreviewCard from '@/components/settings/BudgetPreviewCard.vue'
import { useFinancialSettings } from '@/composables/useFinancialSettings'

const {
  loading, mandatoryLoading, isDirty, editingPersonal, hasTransactions,
  savingPersonal, personalError, savingNextSalary, clearingNextSalary, nextSalaryError,
  showAddExpense, addingExpense, recalculating, recalcPhase, budgetRefreshing, toast,
  personalFormData, salaryDisplay, nextSalary, nextSalaryDisplay,
  nextSalaryNumeric, salaryNumeric,
  expenses, nextCycleExpenses, budgetPlan, paydayDay,
  daysInMonth, nextMonthDays, nextMonthNum, nextYearNum,
  totalMandatory, allExpenses, canEditFinancials, nextBudgetPreview, monthLabel,
  fmtCur, fmtShort,
  loadAll, toggleEdit, formatNextSalaryInput,
  savePersonal, handleSaveNextSalary, handleClearNextSalary,
  recalculate, silentRecalculate, handleAddMandatory, handleDeleteMandatory,
} = useFinancialSettings()

onMounted(loadAll)
</script>
```

- [ ] **Step 3: Verify**

```bash
npm run build
```

Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add src/composables/useFinancialSettings.ts src/views/FinancialSettingsView.vue
git commit -m "refactor: extract useFinancialSettings composable, slim FinancialSettingsView"
```

---

## Task 6: useIncome + useBudgetPlan + Slim IncomeView + BudgetView

**Files:**
- Create: `src/composables/useIncome.ts`
- Create: `src/composables/useBudgetPlan.ts`
- Modify: `src/views/IncomeView.vue` (script section only)
- Modify: `src/views/BudgetView.vue` (script section only)

**Interfaces:**
- Consumes: `getAllIncomes`, `addIncomeWithChoice`, `deleteIncome` from `income.service.ts`; `getAllPlans`, `getPlanByMonth`, `checkReset` from `plan.service.ts`

- [ ] **Step 1: Create `src/composables/useIncome.ts`**

```typescript
import { ref } from 'vue'
import { getAllIncomes, addIncomeWithChoice, deleteIncome } from '@/services/income.service'
import type { Income } from '@/types'

export function useIncome() {
  const incomes = ref<Income[]>([])
  const loading = ref(true)
  const submitting = ref(false)
  const deleteLoading = ref(false)
  const recalculating = ref(false)
  const error = ref('')
  const choiceError = ref('')
  const deleteError = ref('')

  async function loadIncomes() {
    loading.value = true
    try {
      incomes.value = await getAllIncomes()
    } catch { incomes.value = [] }
    finally { loading.value = false }
  }

  async function waitAndReload() {
    recalculating.value = true
    await new Promise(r => setTimeout(r, 500))
    await loadIncomes()
    recalculating.value = false
  }

  async function confirmDelete(incomeId: string): Promise<boolean> {
    deleteLoading.value = true
    deleteError.value = ''
    try {
      await deleteIncome(incomeId)
      await waitAndReload()
      return true
    } catch (e: unknown) {
      deleteError.value = e instanceof Error ? e.message : 'Gagal menghapus pemasukan'
      return false
    } finally {
      deleteLoading.value = false
    }
  }

  async function handleChoiceConfirm(
    pending: { amount: number; description: string; transaction_date: string } | null,
    choice: string,
    spreadDays?: number
  ): Promise<boolean> {
    if (!pending) return false
    submitting.value = true
    choiceError.value = ''
    try {
      await addIncomeWithChoice({
        amount: pending.amount,
        description: pending.description,
        transaction_date: pending.transaction_date + 'T00:00:00Z',
        choice,
        ...(choice === 'spread' && spreadDays !== undefined ? { spread_days: spreadDays } : {}),
      })
      await waitAndReload()
      return true
    } catch (e: unknown) {
      choiceError.value = e instanceof Error ? e.message : 'Gagal menambah pemasukan'
      return false
    } finally {
      submitting.value = false
    }
  }

  return {
    incomes, loading, submitting, deleteLoading, recalculating,
    error, choiceError, deleteError,
    loadIncomes, confirmDelete, handleChoiceConfirm,
  }
}
```

- [ ] **Step 2: Replace `<script setup>` in `src/views/IncomeView.vue`**

Replace only the `<script setup lang="ts">...</script>` block (keep template and `<style>` unchanged):

```typescript
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCurrencyInput } from '@/composables/useCurrencyInput'
import { usePersonalDataStore } from '@/stores/personalData'
import { useIncome } from '@/composables/useIncome'
import ConfirmModal from '@/components/ConfirmModal.vue'
import ModalWrapper from '@/components/ui/ModalWrapper.vue'
import AppButton from '@/components/ui/AppButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import IncomeItem from '@/components/income/IncomeItem.vue'
import IncomeChoiceModal from '@/components/income/IncomeChoiceModal.vue'
import { formatCurrency, toLocaleDateStr, addDays as addDaysUtil } from '@/utils/formatting'
import type { Income } from '@/types/index'
import { Loader2 } from 'lucide-vue-next'

const {
  incomes, loading, submitting, deleteLoading, recalculating,
  error, choiceError, deleteError,
  loadIncomes, confirmDelete: doConfirmDelete, handleChoiceConfirm,
} = useIncome()

const pdStore = usePersonalDataStore()
const { displayValue: amountDisplay, numericValue: amountValue, reset: resetAmount } = useCurrencyInput()

const showModal = ref(false)
const showChoiceModal = ref(false)
const showDeleteModal = ref(false)
const deletingIncomeId = ref('')
const selectedChoice = ref('')
const selectedSpreadDays = ref(0)
const daysLeftInCycle = ref(30)
const form = ref({ description: '', date: new Date().toISOString().split('T')[0] })
const pendingIncome = ref<{ amount: number; description: string; transaction_date: string } | null>(null)

const todayStr = toLocaleDateStr(new Date())
function addDays(s: string, days: number) { return addDaysUtil(s, days) }

type FilterMode = 'single' | 'range' | 'all'
const filterMode = ref<FilterMode>('single')
const modes: { value: FilterMode; label: string }[] = [
  { value: 'single', label: 'Tanggal' },
  { value: 'range',  label: 'Rentang' },
  { value: 'all',    label: 'Semua' },
]
const filterDate = ref(todayStr)
const rangeFromDate = ref(addDays(todayStr, -6))
const rangeToDate = ref(todayStr)
const isLatestDay = computed(() => filterDate.value >= todayStr)
const dateLabel = computed(() => {
  if (filterDate.value === todayStr) return 'Hari Ini'
  if (filterDate.value === addDays(todayStr, -1)) return 'Kemarin'
  const [y, m, d] = filterDate.value.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
})
const rangeLabel = computed(() => {
  const fmt = (s: string) => { const [y,m,d] = s.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) }
  return `${fmt(rangeFromDate.value)} – ${fmt(rangeToDate.value)}`
})
function prevDay() { filterDate.value = addDays(filterDate.value, -1) }
function nextDay() { if (!isLatestDay.value) filterDate.value = addDays(filterDate.value, 1) }
function shiftRange(dir: number) {
  const days = Math.max(1, Math.round((new Date(rangeToDate.value).getTime() - new Date(rangeFromDate.value).getTime()) / 86400000) + 1)
  const newFrom = addDays(rangeFromDate.value, dir * days)
  const newTo = addDays(rangeToDate.value, dir * days)
  if (newTo > todayStr) return
  rangeFromDate.value = newFrom; rangeToDate.value = newTo
}
function setMode(m: FilterMode) { filterMode.value = m }

const filteredIncomes = computed(() => {
  if (filterMode.value === 'all') return incomes.value
  if (filterMode.value === 'single') return incomes.value.filter(i => (i.transaction_date?.split('T')[0] ?? '') === filterDate.value)
  return incomes.value.filter(i => { const d = i.transaction_date?.split('T')[0] ?? ''; return d >= rangeFromDate.value && d <= rangeToDate.value })
})
const totalIncome = computed(() => filteredIncomes.value.reduce((s, i) => s + (i.amount ?? 0), 0))
const groupedIncomes = computed(() => {
  if (filterMode.value === 'single') return {} as Record<string, Income[]>
  const groups: Record<string, Income[]> = {}
  for (const item of filteredIncomes.value) {
    const d = item.transaction_date?.split('T')[0] ?? 'unknown'
    if (!groups[d]) groups[d] = []
    groups[d].push(item)
  }
  return groups
})

function openModal() {
  resetAmount(); form.value = { description: '', date: new Date().toISOString().split('T')[0] }; error.value = ''; showModal.value = true
}
function formatDateGroup(dateStr: string) {
  if (dateStr === todayStr) return 'Hari Ini'
  if (dateStr === addDays(todayStr, -1)) return 'Kemarin'
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
function deleteIncome(incomeId: string) { deletingIncomeId.value = incomeId; showDeleteModal.value = true }
async function confirmDelete() {
  const ok = await doConfirmDelete(deletingIncomeId.value)
  if (ok) showDeleteModal.value = false
}
function handleSubmitForm() {
  if (!amountValue.value || amountValue.value <= 0) { error.value = 'Masukkan jumlah yang valid'; return }
  pendingIncome.value = { amount: amountValue.value, description: form.value.description, transaction_date: form.value.date }
  selectedChoice.value = ''; choiceError.value = ''; showModal.value = false; showChoiceModal.value = true
}
async function handleChoiceConfirmWrapper(choice: string, spreadDays?: number) {
  selectedChoice.value = choice
  if (spreadDays !== undefined) selectedSpreadDays.value = spreadDays
  const ok = await handleChoiceConfirm(pendingIncome.value, choice, spreadDays)
  if (ok) { showChoiceModal.value = false; pendingIncome.value = null }
}

const cycleInfo = computed(() => ({ daysLeft: daysLeftInCycle.value, nextPayday: '' }))

onMounted(async () => {
  await pdStore.fetch()
  const pd = pdStore.data
  if (pd?.payday_day) {
    const now = new Date()
    const payday = pd.payday_day
    const nextPayday = new Date(now.getFullYear(), now.getMonth(), payday)
    if (nextPayday <= now) nextPayday.setMonth(nextPayday.getMonth() + 1)
    daysLeftInCycle.value = Math.ceil((nextPayday.getTime() - now.getTime()) / 86400000)
  }
  await loadIncomes()
})
</script>
```

- [ ] **Step 3: Create `src/composables/useBudgetPlan.ts`**

```typescript
import { ref, computed } from 'vue'
import { usePersonalDataStore } from '@/stores/personalData'
import { getAllPlans, getPlanByMonth, checkReset } from '@/services/plan.service'
import { formatCurrency, formatCurrencyShort } from '@/utils/formatting'
import type { BudgetPlan } from '@/types'

export function useBudgetPlan() {
  const pdStore = usePersonalDataStore()
  const plans = ref<BudgetPlan[]>([])
  const loading = ref(true)
  const showGenModal = ref(false)
  const paydayDay = ref(1)
  const now = new Date()
  const viewIndex = ref(-1)

  const budget = computed(() => plans.value[viewIndex.value] ?? null)

  function cycleDateLabel(b: BudgetPlan): string {
    const fmt = (d: Date) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    const pd = paydayDay.value
    if (b.cycle_start_date) {
      const start = new Date(b.cycle_start_date)
      const nextPay = b.mid_cycle_days && b.mid_cycle_days > 0
        ? new Date(b.for_year, b.for_month - 1, pd)
        : new Date(b.for_year, b.for_month, pd)
      const end = new Date(nextPay.getTime() - 86400000)
      return `${fmt(start)} – ${fmt(end)}`
    }
    if (b.mid_cycle_days && b.mid_cycle_days > 0) {
      const startDate = new Date(b.created_at ?? '')
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(b.for_year, b.for_month - 1, pd - 1)
      return `${fmt(startDate)} – ${fmt(endDate)}`
    }
    const cycleStart = new Date(b.for_year, b.for_month - 1, pd)
    const cycleEnd = new Date(b.for_year, b.for_month, pd)
    return `${fmt(cycleStart)} – ${fmt(cycleEnd)}`
  }

  const monthLabel = computed(() => {
    if (!budget.value) return ''
    return cycleDateLabel(budget.value) || `${budget.value.for_month}/${budget.value.for_year}`
  })

  const budgetStats = computed(() => [
    { label: 'Per Hari', value: budget.value?.daily_budget ?? 0 },
    { label: 'Wajib', value: budget.value?.total_mandatory ?? 0 },
    { label: 'Tabungan', value: budget.value?.savings_amount ?? 0 },
  ])

  const breakdown = computed(() => [
    { icon: '🏠', label: 'Pengeluaran Wajib', value: budget.value?.total_mandatory ?? 0, color: 'bg-red-400' },
    { icon: '🍜', label: 'Kebutuhan Makan',   value: budget.value?.food_amount ?? 0,     color: 'bg-cyan-400' },
    { icon: '🛍️', label: 'Gaya Hidup',        value: budget.value?.lifestyle_amount ?? 0, color: 'bg-violet-400' },
    { icon: '💰', label: 'Tabungan',          value: budget.value?.savings_amount ?? 0,  color: 'bg-emerald-400' },
  ])

  function pct(val: number): string {
    const b = budget.value
    if (!b) return '0'
    const total = (b.food_amount ?? 0) + (b.lifestyle_amount ?? 0) + (b.savings_amount ?? 0) + (b.total_mandatory ?? 0)
    if (total <= 0) return '0'
    return Math.min((val / total) * 100, 100).toFixed(1)
  }

  function prevMonth() { if (viewIndex.value > 0) viewIndex.value-- }

  async function nextMonth() {
    if (viewIndex.value < plans.value.length - 1) { viewIndex.value++; return }
    const last = plans.value[plans.value.length - 1]
    if (!last) return
    const nextM = last.for_month === 12 ? 1 : last.for_month + 1
    const nextY = last.for_month === 12 ? last.for_year + 1 : last.for_year
    const todayM = now.getMonth() + 1; const todayY = now.getFullYear()
    if (nextY > todayY || (nextY === todayY && nextM > todayM + 1)) return
    try {
      const plan = await getPlanByMonth(nextM, nextY)
      if (plan) plans.value.push(plan)
    } catch {}
    viewIndex.value = plans.value.length - 1
  }

  async function loadAllPlans() {
    loading.value = true
    try {
      checkReset()
      const [fetchedPlans] = await Promise.all([getAllPlans(), pdStore.fetch()])
      paydayDay.value = pdStore.data?.payday_day ?? 1
      plans.value = fetchedPlans
      const todayStr = now.toISOString().slice(0, 10)
      let idx = plans.value.length - 1
      for (let i = plans.value.length - 1; i >= 0; i--) {
        const p = plans.value[i]
        const start = p.cycle_start_date ? p.cycle_start_date.slice(0, 10) : null
        if (start && start <= todayStr) { idx = i; break }
      }
      viewIndex.value = idx
    } catch { plans.value = [] }
    finally { loading.value = false }
  }

  return {
    plans, loading, showGenModal, paydayDay, viewIndex,
    budget, monthLabel, budgetStats, breakdown,
    pct, prevMonth, nextMonth, loadAllPlans,
  }
}
```

- [ ] **Step 4: Replace `<script setup>` in `src/views/BudgetView.vue`**

Replace only the `<script setup lang="ts">...</script>` block (keep template and `<style scoped>` unchanged):

```typescript
<script setup lang="ts">
import { onMounted } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import SectionCard from '@/components/ui/SectionCard.vue'
import BudgetGenerateModal from '@/components/budget/BudgetGenerateModal.vue'
import { formatCurrency, formatCurrencyShort } from '@/utils/formatting'
import { useBudgetPlan } from '@/composables/useBudgetPlan'

const {
  plans, loading, showGenModal, paydayDay, viewIndex,
  budget, monthLabel, budgetStats, breakdown,
  pct, prevMonth, nextMonth, loadAllPlans,
} = useBudgetPlan()

onMounted(loadAllPlans)
</script>
```

- [ ] **Step 5: Verify**

```bash
npm run build
```

Expected: passes.

- [ ] **Step 6: Commit**

```bash
git add src/composables/useIncome.ts src/composables/useBudgetPlan.ts src/views/IncomeView.vue src/views/BudgetView.vue
git commit -m "refactor: extract useIncome and useBudgetPlan composables"
```

---

## Task 7: Cleanup

**Files:**
- Delete: `src/stores/deficit.ts`
- Modify: `src/components/settings/MandatoryExpenseList.vue` — import `MandatoryExpenditure` from `@/types`

**Interfaces:** none

- [ ] **Step 1: Delete dead store**

```bash
rm src/stores/deficit.ts
```

- [ ] **Step 2: Fix `MandatoryExpenseList.vue` — import type from `@/types`**

In `src/components/settings/MandatoryExpenseList.vue`, find the local interface definition:

```typescript
export interface MandatoryExpenditure {
  mandatory_expenditure_id: string
  category: string
  description: string
  amount: number
  for_month?: number
  for_year?: number
}
```

Replace it with an import from `@/types` and re-export for backward compatibility:

```typescript
export type { MandatoryExpenditure } from '@/types'
```

This keeps the `export` that `FinancialSettingsView.vue` (and any other consumers) imports via `import MandatoryExpenseList, { type MandatoryExpenditure }`.

- [ ] **Step 3: Final verify**

```bash
npm run build
```

Expected: clean build, no errors.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "refactor: cleanup dead code, unify MandatoryExpenditure type"
```
