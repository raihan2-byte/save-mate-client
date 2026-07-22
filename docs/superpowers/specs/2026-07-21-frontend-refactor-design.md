# Frontend Refactor Design — SaveMate Vue 3

Date: 2026-07-21

## Scope

Code-only refactor. No flow changes, no UI changes, no endpoint changes. User experience stays identical.

---

## Problem

Three views are oversized and mix responsibilities:
- `DashboardView.vue` — 493 lines: API calls, business logic, date computation, UI state
- `TransactionsView.vue` — 528 lines: API calls, deficit logic, budget overrun detection, export
- `FinancialSettingsView.vue` — 680 lines: form logic, next-salary logic, budget preview, mandatory list

Additional issues:
- `deficit.ts` store is dead code (zero imports outside itself)
- Date strings built manually in DashboardView instead of using existing `toLocaleDateStr()`
- `useApiState` composable exists but is barely used
- API calls (`api.get/post/patch`) are scattered across 5+ files — no service layer

---

## Design

### 1. API Service Layer — `src/services/`

Pure functions per domain. Views and composables import from here only. No direct `api.*` calls outside services.

```
src/services/
  transaction.service.ts    — CRUD transactions, range queries, deficit-choice patch
  budget.service.ts         — daily-budget get, carryover, end-day, undo-end-day, end-day-status
  plan.service.ts           — budget-plan get/create/update, check-reset
  income.service.ts         — income CRUD
  summary.service.ts        — monthly summary, deduct-savings
  personalData.service.ts   — personal-data get/create/update, next-salary
  mandatory.service.ts      — mandatory-expenditure CRUD
```

Each function is typed: accepts typed params, returns typed data (not raw axios response).

### 2. Composables — `src/composables/`

Logic extracted from fat views. Each composable owns: refs, computed, methods for its domain.

| Composable | Replaces logic from |
|---|---|
| `useDashboard.ts` | DashboardView: load, date helpers, calcTomorrowSummary, food stats |
| `useEndDay.ts` | DashboardView: endDayChoice, submitEndDay, undoEndDay, checkYesterdayCarryover |
| `useDeficit.ts` | TransactionsView: checkDailyBudgetOverrun, confirmDeficit, deductFromSavings |
| `useFinancialSettings.ts` | FinancialSettingsView: form state, save/update, next-salary logic |
| `useIncome.ts` | IncomeView: income list, add, delete |
| `useBudgetPlan.ts` | BudgetView: plan load, history |

Existing composables stay unchanged: `useListFilter`, `useApiState`, `useCurrencyInput`.

### 3. TypeScript Strictness

- `auth.ts`: `user` typed `any` → typed as `User` from `src/types/index.ts`
- Catch blocks: `catch (e: any)` → `catch (e: unknown)` with `extractError()` from utils
- Service functions return typed data, not `AxiosResponse<any>`

### 4. Error Handling Standardization

One rule: all API errors go through `extractError()` from `src/utils/errors.ts`. No inline `e?.response?.data?.message` chains anywhere outside that utility. Service layer catches and re-throws as `Error` with message from `extractError()`.

Pattern:
```ts
// service layer
try {
  const res = await api.get('/transactions/today')
  return res.data.data
} catch (e) {
  throw new Error(extractError(e, 'Gagal memuat transaksi'))
}

// composable / view
} catch (e) {
  error.value = e instanceof Error ? e.message : 'Terjadi kesalahan'
}
```

### 5. Cleanup

- Delete `src/stores/deficit.ts` — dead code, no callers
- Replace manual date strings in DashboardView with `toLocaleDateStr()` from utils
- Use `useApiState` inside new composables where applicable

---

## What Does NOT Change

- All route paths and route structure
- All API endpoints and request/response shapes
- All Pinia stores: `auth.ts`, `personalData.ts`
- All UI: templates, Tailwind classes, components
- All existing composables: `useListFilter`, `useApiState`, `useCurrencyInput`
- All utils: `formatting.ts`, `errors.ts`, `exportExcel.ts`, `exportPdf.ts`
- All component files under `src/components/`

---

## Result

Views become thin shells (~80–120 lines each):
```ts
// DashboardView.vue <script setup>
const { budgetPlan, dailyStatus, foodTracker, tomorrowSummary, loadDashboard } = useDashboard()
const { endDayChoice, showEndDayModal, submitEndDay, undoEndDay } = useEndDay()
```

One place to change an endpoint. One place per business rule. Views only render.
