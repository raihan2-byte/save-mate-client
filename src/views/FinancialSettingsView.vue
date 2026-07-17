<template>
  <div class="p-4 md:p-8 max-w-2xl mx-auto pb-20">

    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-black text-white">Pengaturan Keuangan</h1>
        <p class="text-slate-500 text-sm mt-0.5">{{ canEditFinancials ? 'Edit data & hitung ulang budget' : `Hanya bisa diedit saat gajian (tgl ${paydayDay})` }}</p>
      </div>
      <div v-if="isDirty" class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
        <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span class="text-amber-300 text-xs font-semibold">Ada perubahan</span>
      </div>
    </div>

    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="h-32 rounded-2xl bg-white/5 animate-pulse" />
    </div>

    <template v-else>

      <!-- ─── Edit locked: bukan hari gajian ─────────────── -->
      <div v-if="!canEditFinancials"
        class="flex items-start gap-3 p-4 mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/5">
        <span class="text-xl flex-shrink-0">🔒</span>
        <div class="flex-1">
          <p class="font-semibold text-amber-300 text-sm">Edit hanya bisa dilakukan saat gajian (tgl {{ paydayDay }})</p>
          <p class="text-slate-400 text-xs mt-1">Mau set gaji bulan depan? Isi di bagian bawah. Atau kalau ada pemasukan tambahan sekarang, bisa langsung masukkan.</p>
          <RouterLink to="/app/income"
            class="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition-colors">
            💰 Tambah Pemasukan
          </RouterLink>
        </div>
      </div>

      <!-- ─── Gaji Bulan Depan (selalu visible jika ada budget plan) ─── -->
      <section v-if="budgetPlan" class="glass-card p-5 mb-4">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-lg">📅</span>
          <h2 class="font-bold text-white">Gaji Bulan Depan</h2>
        </div>

        <!-- Reminder jika sudah diset -->
        <div v-if="nextSalary && nextSalary > 0"
          :class="nextSalary > personalFormData.salary
            ? 'bg-emerald-500/10 border-emerald-500/25'
            : 'bg-orange-500/10 border-orange-500/25'"
          class="flex items-start gap-3 p-3 mb-4 rounded-xl border">
          <span class="flex-shrink-0">{{ nextSalary > personalFormData.salary ? '📈' : '📉' }}</span>
          <div>
            <p :class="nextSalary > personalFormData.salary ? 'text-emerald-300' : 'text-orange-300'"
              class="text-sm font-semibold">
              {{ nextSalary > personalFormData.salary ? 'Naik' : 'Turun' }} ke {{ fmtCur(nextSalary) }} mulai gajian tgl {{ paydayDay }}
            </p>
            <p class="text-slate-400 text-xs mt-0.5">
              Dari {{ fmtCur(personalFormData.salary) }} →
              <span :class="nextSalary > personalFormData.salary ? 'text-emerald-400' : 'text-orange-400'" class="font-semibold">
                {{ nextSalary > personalFormData.salary ? '+' : '' }}{{ fmtCur(nextSalary - personalFormData.salary) }}
              </span>
              · Berlaku otomatis saat siklus berikutnya dimulai.
            </p>
          </div>
        </div>

        <p class="text-slate-400 text-xs mb-3">Gaji kamu bulan depan berapa? Masukkan totalnya — berlaku otomatis mulai gajian tgl {{ paydayDay }}.</p>

        <div class="flex gap-2">
          <div class="flex-1 relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rp</span>
            <input
              v-model="nextSalaryDisplay"
              @input="formatNextSalaryInput"
              type="text"
              inputmode="numeric"
              placeholder="0"
              class="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500/50 placeholder:text-slate-600"
            />
          </div>
          <AppButton
            variant="primary"
            size="sm"
            :loading="savingNextSalary"
            @click="saveNextSalary"
            :disabled="nextSalaryNumeric <= 0 || nextSalaryNumeric === personalFormData.salary"
          >
            Simpan
          </AppButton>
          <AppButton
            v-if="nextSalary && nextSalary > 0"
            variant="danger"
            size="sm"
            :loading="clearingNextSalary"
            @click="clearNextSalary"
          >
            Hapus
          </AppButton>
        </div>
        <p v-if="nextSalaryError" class="text-red-400 text-xs mt-2">{{ nextSalaryError }}</p>

        <!-- Preview budget bulan depan -->
        <template v-if="nextSalaryNumeric > totalMandatory">
          <div class="mt-4 border-t border-white/10 pt-4">
            <p class="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Preview Budget Bulan Depan
              <span v-if="nextSalaryNumeric > personalFormData.salary" class="text-emerald-400 normal-case ml-1">↑ Naik gaji</span>
              <span v-else-if="nextSalaryNumeric < personalFormData.salary" class="text-orange-400 normal-case ml-1">↓ Turun gaji</span>
            </p>
            <div class="grid grid-cols-2 gap-2 text-center">
              <div class="bg-white/5 rounded-xl p-3">
                <p class="text-slate-500 text-[10px] mb-1">Budget/hari</p>
                <p class="text-white font-black text-base">{{ fmtShort(nextBudgetPreview!.dailyBudget) }}</p>
              </div>
              <div class="bg-white/5 rounded-xl p-3">
                <p class="text-slate-500 text-[10px] mb-1">Tabungan/hari</p>
                <p class="text-emerald-300 font-black text-base">{{ fmtShort(nextBudgetPreview!.dailySavings) }}</p>
              </div>
              <div class="bg-white/5 rounded-xl p-3">
                <p class="text-slate-500 text-[10px] mb-1">Makan/bulan</p>
                <p class="text-white font-bold text-sm">{{ fmtShort(nextBudgetPreview!.foodAmount) }}</p>
              </div>
              <div class="bg-white/5 rounded-xl p-3">
                <p class="text-slate-500 text-[10px] mb-1">Lifestyle/bulan</p>
                <p class="text-white font-bold text-sm">{{ fmtShort(nextBudgetPreview!.lifestyleAmount) }}</p>
              </div>
            </div>
            <div class="flex justify-between text-xs text-slate-500 mt-2 px-1">
              <span>Tabungan/bulan: {{ fmtShort(nextBudgetPreview!.savingsAmount) }}</span>
              <span>Wajib/bulan: {{ fmtShort(totalMandatory) }}</span>
            </div>
          </div>
        </template>
        <div v-else-if="nextSalaryNumeric > 0 && nextSalaryNumeric <= totalMandatory"
          class="mt-3 flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <span>🚫</span>
          <p class="text-red-300 text-xs">Gaji lebih kecil dari pengeluaran wajib ({{ fmtCur(totalMandatory) }})</p>
        </div>
      </section>

      <!-- ─── Data Keuangan ─────────────────────────────── -->
      <section class="glass-card p-5 mb-4">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <span class="text-lg">💼</span>
            <h2 class="font-bold text-white">Data Keuangan</h2>
          </div>
          <AppButton
            v-if="canEditFinancials"
            :variant="editingPersonal ? 'danger' : 'outline'"
            size="sm"
            @click="toggleEdit"
          >
            {{ editingPersonal ? '✕ Batal' : '✏️ Edit' }}
          </AppButton>
        </div>

        <PersonalDataForm
          v-model="personalFormData"
          :editing="editingPersonal"
          :saving="savingPersonal"
          v-model:salaryDisplay="salaryDisplay"
          :validationError="personalError"
          @save="savePersonal"
        />

        <!-- Live preview (edit mode only) -->
        <BudgetPreviewCard
          v-if="editingPersonal && salaryNumeric > 0 && salaryNumeric > totalMandatory"
          class="mt-4"
          :salary="salaryNumeric"
          :mandatory="totalMandatory"
          :savingType="personalFormData.savingType"
          :daysInMonth="daysInMonth"
          :originalSalary="originalPersonal.salary"
          :originalSavingType="originalPersonal.savingType"
        />

        <!-- Salary too low warning -->
        <div
          v-if="editingPersonal && salaryNumeric > 0 && salaryNumeric <= totalMandatory"
          class="mt-4 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/25"
        >
          <span class="text-base flex-shrink-0">🚫</span>
          <p class="text-red-300 text-xs">Gaji lebih kecil dari total pengeluaran wajib ({{ fmtCur(totalMandatory) }}). Budget tidak bisa dihitung — kurangi pengeluaran wajib atau naikkan gaji.</p>
        </div>
      </section>

      <!-- ─── Pengeluaran Wajib ──────────────────────────── -->
      <section class="glass-card p-5 mb-4">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <span class="text-lg">🏠</span>
            <h2 class="font-bold text-white">Pengeluaran Wajib</h2>
          </div>
          <AppButton variant="outline" size="sm" @click="showAddExpense = !showAddExpense">
            ＋ Tambah
          </AppButton>
        </div>

        <MandatoryExpenseList
          :items="allExpenses"
          :loading="mandatoryLoading"
          :adding="addingExpense"
          :salary="personalFormData.salary"
          :next-month="nextMonthNum"
          :next-year="nextYearNum"
          v-model:showAdd="showAddExpense"
          @add="addMandatory"
          @delete="deleteMandatory"
        />
      </section>

      <!-- ─── Recalculate button ─────────────────────────── -->
      <Transition name="slide-up">
        <div v-if="isDirty" class="glass-card p-5 mb-4 border-amber-500/20">
          <div class="flex items-start gap-3 mb-4">
            <span class="text-2xl">⚡</span>
            <div>
              <p class="font-bold text-white">Budget perlu dihitung ulang</p>
              <p class="text-slate-400 text-sm mt-0.5">Perubahan data keuanganmu mempengaruhi alokasi budget harian.</p>
            </div>
          </div>
          <AppButton variant="primary" size="lg" class="w-full" :loading="recalculating" @click="recalculate">
            {{ recalculating ? '⏳ Menghitung ulang...' : '🔄 Hitung Ulang Budget' }}
          </AppButton>
        </div>
      </Transition>

      <!-- ─── Current budget preview ──────────────────────── -->
      <section v-if="budgetPlan && !isDirty" class="glass-card p-5">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-lg">📊</span>
          <h2 class="font-bold text-white">Budget Aktif {{ (budgetPlan.mid_cycle_days ?? 0) > 0 ? 'Periode Ini' : 'Bulan Ini' }}</h2>
          <span class="ml-auto text-xs text-slate-500">{{ monthLabel }}</span>
        </div>

        <template v-if="budgetRefreshing">
          <div class="grid grid-cols-2 gap-2 mb-3">
            <div class="h-16 rounded-2xl bg-white/5 animate-pulse" />
            <div class="h-16 rounded-2xl bg-white/5 animate-pulse" />
          </div>
          <div class="space-y-2">
            <div v-for="i in 3" :key="i" class="h-8 rounded-xl bg-white/5 animate-pulse" />
          </div>
        </template>

        <template v-else>
          <div class="grid grid-cols-2 gap-2 mb-3">
            <div class="bg-red-500/5 border border-red-500/15 rounded-2xl p-3 text-center">
              <p class="text-red-300 text-xs mb-1">📕 Tabungan/hari</p>
              <p class="font-black text-white text-lg">{{ fmtShort(budgetPlan.daily_savings ?? 0) }}</p>
            </div>
            <div class="bg-cyan-500/5 border border-cyan-500/15 rounded-2xl p-3 text-center">
              <p class="text-cyan-300 text-xs mb-1">🟦 Budget/hari</p>
              <p class="font-black text-white text-lg">{{ fmtShort(budgetPlan.daily_budget ?? 0) }}</p>
            </div>
          </div>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between py-1.5 border-b border-white/5">
              <span class="text-slate-400">🍜 Makan/hari</span>
              <span class="font-semibold text-white">{{ fmtShort((budgetPlan.food_amount ?? 0) / ((budgetPlan.mid_cycle_days ?? 0) > 0 ? (budgetPlan.mid_cycle_days ?? daysInMonth) : daysInMonth)) }}</span>
            </div>
            <div class="flex justify-between py-1.5 border-b border-white/5">
              <span class="text-slate-400">💰 Tabungan/{{ (budgetPlan.mid_cycle_days ?? 0) > 0 ? 'periode' : 'bulan' }}</span>
              <span class="font-bold text-emerald-400">{{ fmtCur(budgetPlan.savings_amount ?? 0) }}</span>
            </div>
            <div class="flex justify-between py-1.5">
              <span class="text-slate-400">⚙️ Wajib/{{ (budgetPlan.mid_cycle_days ?? 0) > 0 ? 'periode' : 'bulan' }}</span>
              <span class="font-semibold text-slate-300">{{ fmtCur(budgetPlan.total_mandatory ?? 0) }}</span>
            </div>
          </div>
        </template>
      </section>

    </template>

    <!-- Toast notification -->
    <Transition name="toast">
      <div v-if="toast"
        class="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-2xl text-sm font-semibold shadow-xl flex items-center gap-2 whitespace-nowrap"
        :class="toast.type === 'success'
          ? 'bg-emerald-500/90 text-white backdrop-blur-md'
          : 'bg-red-500/90 text-white backdrop-blur-md'"
      >
        <span>{{ toast.type === 'success' ? '✓' : '✕' }}</span>
        {{ toast.message }}
      </div>
    </Transition>

    <!-- Recalculate overlay -->
    <Transition name="fade">
      <div v-if="recalculating"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl"
      >
        <div class="text-center">
          <div class="relative w-20 h-20 mx-auto mb-6">
            <div class="absolute inset-0 rounded-full border-4 border-emerald-500/20" />
            <div class="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin" />
            <div class="absolute inset-0 flex items-center justify-center text-2xl">🔄</div>
          </div>
          <p class="text-white font-black text-xl mb-1">{{ recalcPhase }}</p>
          <p class="text-slate-400 text-sm">Sabar sebentar...</p>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/api'
import AppButton from '@/components/ui/AppButton.vue'
import PersonalDataForm, { type PersonalDataFormData } from '@/components/settings/PersonalDataForm.vue'
import MandatoryExpenseList, { type MandatoryExpenditure } from '@/components/settings/MandatoryExpenseList.vue'
import BudgetPreviewCard from '@/components/settings/BudgetPreviewCard.vue'
import type { BudgetPlan } from '@/types'
import { calcBudgetPreview } from '@/constants/budgetConfig'
import { formatCurrency, formatCurrencyShort } from '@/utils/formatting'
import { usePersonalDataStore } from '@/stores/personalData'

// ── State ─────────────────────────────────────────────────────────────────────

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

// ── Data ──────────────────────────────────────────────────────────────────────

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

const now = new Date()
const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

// next month info — dideklarasikan setelah `now`
const _nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
const nextMonthNum = _nextMonthDate.getMonth() + 1
const nextYearNum = _nextMonthDate.getFullYear()

const nextMonthDays = computed(() => {
  const d = new Date(now.getFullYear(), now.getMonth() + 2, 0)
  return d.getDate()
})

const nextBudgetPreview = computed(() => {
  if (nextSalaryNumeric.value <= 0) return null
  const st = personalFormData.value.savingType
  const allMandatory = [...(expenses.value ?? []), ...(nextCycleExpenses.value ?? [])].reduce((s, e) => s + (e.amount ?? 0), 0)
  return calcBudgetPreview(nextSalaryNumeric.value, allMandatory, st, nextMonthDays.value)
})

// Edit finansial hanya boleh saat: belum ada budget plan (onboarding) ATAU hari ini = hari gajian
const canEditFinancials = computed(() => {
  if (!budgetPlan.value) return true        // belum ada plan = masih setup awal
  return now.getDate() === paydayDay.value  // hari gajian
})

// ── Computed ──────────────────────────────────────────────────────────────────

const totalMandatory = computed(() => expenses.value.reduce((s, e) => s + (e.amount ?? 0), 0))
const allExpenses = computed(() => [...(expenses.value ?? []), ...(nextCycleExpenses.value ?? [])])

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

// ── Helpers ───────────────────────────────────────────────────────────────────

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

async function saveNextSalary() {
  nextSalaryError.value = ''
  if (nextSalaryNumeric.value <= 0) return
  if (nextSalaryNumeric.value === personalFormData.value.salary) {
    nextSalaryError.value = `Gaji yang dimasukkan (${fmtCur(nextSalaryNumeric.value)}) sama dengan gaji sekarang — tidak ada perubahan.`
    return
  }
  savingNextSalary.value = true
  try {
    await api.patch('/personal-data/next-salary', { next_salary: nextSalaryNumeric.value })
    nextSalary.value = nextSalaryNumeric.value
    showToast(`Gaji baru ${fmtCur(nextSalaryNumeric.value)} akan aktif mulai gajian tgl ${paydayDay.value}`)
  } catch (e: unknown) {
    const err = e as { response?: { data?: { errors?: string; message?: string } } }
    nextSalaryError.value = err.response?.data?.errors ?? err.response?.data?.message ?? 'Gagal menyimpan'
  } finally {
    savingNextSalary.value = false
  }
}

async function clearNextSalary() {
  clearingNextSalary.value = true
  try {
    await api.delete('/personal-data/next-salary')
    nextSalary.value = null
    nextSalaryDisplay.value = ''
    showToast('Gaji bulan depan dihapus')
  } catch (e: unknown) {
    const err = e as { response?: { data?: { errors?: string; message?: string } } }
    nextSalaryError.value = err.response?.data?.errors ?? err.response?.data?.message ?? 'Gagal menghapus'
  } finally {
    clearingNextSalary.value = false
  }
}

// ── API Calls ─────────────────────────────────────────────────────────────────

async function loadAll() {
  loading.value = true
  try {
    const [pdRes, bpRes, summaryRes] = await Promise.allSettled([
      api.get('/personal-data/'),
      api.get(`/budget-plan/${now.getMonth() + 1}/${now.getFullYear()}`),
      api.get(`/summary/month/${now.getMonth() + 1}/${now.getFullYear()}`),
    ])

    if (pdRes.status === 'fulfilled') {
      const pd = pdRes.value.data.data
      paydayDay.value = pd.payday_day ?? 1
      personalFormData.value = {
        salary: pd.salary ?? 0,
        savingType: pd.saving_type ?? '',
        purpose: pd.purpose_of_join_here ?? '',
      }
      if (pd.salary > 0) {
        salaryDisplay.value = String(Math.round(pd.salary)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      }
      nextSalary.value = pd.next_salary ?? null
      if (nextSalary.value && nextSalary.value > 0) {
        nextSalaryDisplay.value = String(Math.round(nextSalary.value)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      }
    }

    if (bpRes.status === 'fulfilled') {
      budgetPlan.value = bpRes.value.data.data
    }

    if (summaryRes.status === 'fulfilled') {
      const s = summaryRes.value.data.data
      if (((s?.total_food_spent ?? 0) + (s?.total_lifestyle_spent ?? 0)) > 0) {
        hasTransactions.value = true
      }
    }
    if (!hasTransactions.value) {
      try {
        const expRes = await api.get('/daily-expense/')
        const list = expRes.data.data
        if ((Array.isArray(list) ? list : list ? [list] : []).length > 0) {
          hasTransactions.value = true
        }
      } catch {}
    }

    await loadExpenses()
  } finally {
    loading.value = false
  }
}

async function loadExpenses() {
  mandatoryLoading.value = true
  try {
    const res = await api.get(`/mandatory-expenditure/month/${now.getMonth() + 1}/${now.getFullYear()}`)
    const raw = res.data.data
    const list = raw?.data ?? raw
    expenses.value = Array.isArray(list) ? list as MandatoryExpenditure[] : []
  } catch {
    expenses.value = []
  } finally {
    mandatoryLoading.value = false
  }
  try {
    const res = await api.get(`/mandatory-expenditure/month/${nextMonthNum}/${nextYearNum}`)
    const raw = res.data.data
    const list = raw?.data ?? raw
    nextCycleExpenses.value = Array.isArray(list) ? list as MandatoryExpenditure[] : []
  } catch {
    nextCycleExpenses.value = []
  }
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
    await api.put('/personal-data/', {
      salary: personalFormData.value.salary,
      saving_type: personalFormData.value.savingType,
      purpose_of_join_here: personalFormData.value.purpose,
    })
    editingPersonal.value = false
    await recalculate()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { errors?: string; message?: string } } }
    personalError.value = err.response?.data?.errors ?? err.response?.data?.message ?? 'Gagal menyimpan'
    savingPersonal.value = false
  }
}

async function silentRecalculate() {
  if (!budgetPlan.value) return
  budgetRefreshing.value = true
  try {
    const region = (budgetPlan.value.region as string) ?? ''
    const savingType = (budgetPlan.value.saving_type as string) || personalFormData.value.savingType || 'recommendation'
    await api.post('/budget-plan/', {
      for_month: now.getMonth() + 1,
      for_year: now.getFullYear(),
      saving_type: savingType,
      region,
    })
    const res = await api.get(`/budget-plan/${now.getMonth() + 1}/${now.getFullYear()}`)
    budgetPlan.value = res.data.data
    isDirty.value = false
    api.post('/daily-budget/sync-today').catch(() => {})
    showToast('Budget plan bulan ini diperbarui otomatis')
  } catch (e: unknown) {
    const err = e as { response?: { data?: { errors?: string; message?: string } } }
    const msg = err?.response?.data?.errors ?? err?.response?.data?.message ?? 'error'
    showToast(`Gagal memperbarui budget: ${msg}`, 'error')
  } finally {
    budgetRefreshing.value = false
  }
}

async function addMandatory(item: { category: string; description: string; amount: number; forMonth: number; forYear: number }) {
  addingExpense.value = true
  const isCurrentCycle = item.forMonth === (now.getMonth() + 1) && item.forYear === now.getFullYear()
  try {
    await api.post('/mandatory-expenditure/', {
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
      // Refresh budget plan (backend sudah potong tabungan)
      const res = await api.get(`/budget-plan/${now.getMonth() + 1}/${now.getFullYear()}`)
      budgetPlan.value = res.data.data
      showToast('Pengeluaran wajib ditambahkan, tabungan dipotong otomatis')
    } else {
      showToast('Dicatat — berlaku mulai gajian berikutnya')
    }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { errors?: string; message?: string } } }
    const msg = err?.response?.data?.errors ?? err?.response?.data?.message ?? 'Gagal menambah pengeluaran wajib'
    showToast(msg, 'error')
  } finally {
    addingExpense.value = false
  }
}

async function deleteMandatory(id: string) {
  try {
    await api.delete(`/mandatory-expenditure/${id}`)
    await loadExpenses()
    await silentRecalculate()
  } catch {
    showToast('Gagal menghapus pengeluaran wajib', 'error')
  }
}

const recalcPhases = ['Membaca data terbaru...', 'Menghitung ulang alokasi...', 'Memperbarui budget harian...']

async function recalculate() {
  recalculating.value = true
  recalcPhase.value = recalcPhases[0]

  try {
    const region = budgetPlan.value?.region ?? 'Jakarta'
    recalcPhase.value = recalcPhases[1]
    await api.post('/budget-plan/', {
      for_month: now.getMonth() + 1,
      for_year: now.getFullYear(),
      saving_type: personalFormData.value.savingType,
      region,
    })
    recalcPhase.value = recalcPhases[2]
    const res = await api.get(`/budget-plan/${now.getMonth() + 1}/${now.getFullYear()}`)
    budgetPlan.value = res.data.data
    isDirty.value = false
    api.post('/daily-budget/sync-today').catch(() => {})
    showToast('Budget berhasil dihitung ulang')
  } catch (e: unknown) {
    const err = e as { response?: { data?: { errors?: string; message?: string } } }
    const msg = err?.response?.data?.errors ?? err?.response?.data?.message ?? 'Gagal menghitung ulang budget'
    showToast(msg, 'error')
  } finally {
    recalculating.value = false
    savingPersonal.value = false
  }
}

onMounted(loadAll)
</script>

<style scoped>
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s ease; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(12px); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(10px); }
</style>
