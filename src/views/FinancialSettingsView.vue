<template>
  <div class="p-4 md:p-8 max-w-2xl mx-auto pb-20">

    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-black text-white">Pengaturan Keuangan</h1>
        <p class="text-slate-500 text-sm mt-0.5">Edit data & hitung ulang budget kapan saja</p>
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

      <!-- ─── Soft warning (ada transaksi) ────────────────── -->
      <div v-if="hasTransactions && !editingPersonal"
        class="flex items-start gap-3 p-4 mb-4 rounded-2xl border border-blue-500/20 bg-blue-500/5">
        <span class="text-lg flex-shrink-0">ℹ️</span>
        <div>
          <p class="font-semibold text-blue-300 text-sm">Kamu sudah punya transaksi bulan ini</p>
          <p class="text-slate-400 text-xs mt-0.5">Edit tetap bisa dilakukan. Setelah simpan, budget akan dihitung ulang otomatis. Transaksi yang sudah dicatat <span class="text-white font-medium">tidak akan terhapus</span> — hanya alokasi ke depan yang menyesuaikan.</p>
        </div>
      </div>

      <!-- ─── Data Keuangan ─────────────────────────────── -->
      <section class="glass-card p-5 mb-4">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <span class="text-lg">💼</span>
            <h2 class="font-bold text-white">Data Keuangan</h2>
          </div>
          <button @click="toggleEdit"
            class="text-xs px-3 py-1.5 rounded-lg border transition-all"
            :class="editingPersonal
              ? 'border-red-500/30 bg-red-500/10 text-red-400'
              : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'">
            {{ editingPersonal ? '✕ Batal' : '✏️ Edit' }}
          </button>
        </div>

        <!-- View mode -->
        <div v-if="!editingPersonal" class="space-y-3">
          <div class="flex justify-between items-center py-2 border-b border-white/5">
            <span class="text-slate-400 text-sm">Penghasilan Bulanan</span>
            <span class="font-bold text-emerald-400">{{ fmtCur(personalForm.salary) }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-white/5">
            <span class="text-slate-400 text-sm">Gaya Menabung</span>
            <span class="font-semibold text-white">{{ savingLabels[personalForm.saving_type] ?? personalForm.saving_type }}</span>
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="text-slate-400 text-sm">Tujuan</span>
            <span class="font-medium text-white text-sm text-right max-w-[60%]">{{ personalForm.purpose_of_join_here }}</span>
          </div>
        </div>

        <!-- Edit mode -->
        <div v-else class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1.5">Penghasilan Bulanan (Rp)</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">Rp</span>
              <input v-model="salaryDisplay" type="text" inputmode="numeric" class="input-dark pl-10" placeholder="5.000.000" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Gaya Menabung</label>
            <div class="grid grid-cols-3 gap-2">
              <button v-for="opt in savingOptions" :key="opt.value" type="button"
                @click="personalForm.saving_type = opt.value"
                class="py-2 px-2 rounded-xl border text-xs font-semibold transition-all"
                :class="personalForm.saving_type === opt.value
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'">
                {{ opt.icon }} {{ opt.label }}
              </button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1.5">Tujuan</label>
            <input v-model="personalForm.purpose_of_join_here" type="text" maxlength="50" class="input-dark" />
          </div>

          <!-- Negative salary warning -->
          <div v-if="salaryNumeric > 0 && salaryNumeric <= totalMandatory"
            class="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/25">
            <span class="text-base flex-shrink-0">🚫</span>
            <p class="text-red-300 text-xs">Gaji lebih kecil dari total pengeluaran wajib ({{ fmtCur(totalMandatory) }}). Budget tidak bisa dihitung — kurangi pengeluaran wajib atau naikkan gaji.</p>
          </div>

          <!-- Live preview -->
          <div v-if="preview" class="rounded-2xl border p-4 space-y-3"
            :class="preview.dailyBudgetDiff >= 0 ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm">🔮</span>
              <p class="text-xs font-bold uppercase tracking-widest"
                :class="preview.dailyBudgetDiff >= 0 ? 'text-emerald-400' : 'text-red-400'">
                Preview Budget Baru
              </p>
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="bg-white/5 rounded-xl p-2.5 text-center">
                <p class="text-slate-400 mb-1">Budget/hari</p>
                <p class="font-black text-white text-base">{{ fmtShort(preview.dailyBudget) }}</p>
                <p class="mt-0.5 font-semibold"
                  :class="preview.dailyBudgetDiff >= 0 ? 'text-emerald-400' : 'text-red-400'">
                  {{ preview.dailyBudgetDiff >= 0 ? '▲' : '▼' }} {{ fmtShort(Math.abs(preview.dailyBudgetDiff)) }}
                </p>
              </div>
              <div class="bg-white/5 rounded-xl p-2.5 text-center">
                <p class="text-slate-400 mb-1">Tabungan/bulan</p>
                <p class="font-black text-white text-base">{{ fmtShort(preview.savings) }}</p>
                <p class="mt-0.5 font-semibold"
                  :class="preview.savingsDiff >= 0 ? 'text-emerald-400' : 'text-red-400'">
                  {{ preview.savingsDiff >= 0 ? '▲' : '▼' }} {{ fmtShort(Math.abs(preview.savingsDiff)) }}
                </p>
              </div>
            </div>
            <p v-if="preview.dailyBudgetDiff < 0" class="text-xs text-amber-300">
              ⚠️ Budget harian turun karena persentase tabungan lebih tinggi di mode {{ savingLabels[personalForm.saving_type] }}.
            </p>
          </div>

          <button @click="savePersonal" :disabled="savingPersonal"
            class="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-all disabled:opacity-50">
            {{ savingPersonal ? 'Menyimpan & menghitung ulang...' : '💾 Simpan & Hitung Ulang Budget' }}
          </button>
          <p v-if="personalError" class="text-red-400 text-xs">{{ personalError }}</p>
        </div>
      </section>

      <!-- ─── Pengeluaran Wajib ──────────────────────────── -->
      <section class="glass-card p-5 mb-4">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <span class="text-lg">🏠</span>
            <h2 class="font-bold text-white">Pengeluaran Wajib</h2>
          </div>
          <button @click="showAddExpense = !showAddExpense"
            class="text-xs px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all">
            ＋ Tambah
          </button>
        </div>

        <!-- Add form -->
        <div v-if="showAddExpense" class="bg-white/3 border border-white/10 rounded-2xl p-4 mb-4 space-y-3">
          <div class="grid grid-cols-3 gap-1.5">
            <button v-for="cat in mandatoryCategories" :key="cat.value" type="button"
              @click="addForm.category = cat.value"
              class="py-2 px-1 rounded-xl border text-center text-xs transition-all"
              :class="addForm.category === cat.value
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'">
              {{ cat.icon }} {{ cat.label }}
            </button>
          </div>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">Rp</span>
            <input v-model="addAmountDisplay" type="text" inputmode="numeric" class="input-dark pl-10" placeholder="0" />
          </div>
          <input v-model="addForm.description" type="text" class="input-dark" placeholder="Kost, ojek, WiFi..." maxlength="100" />
          <p v-if="addWouldExceed" class="text-red-400 text-xs">
            🚫 Akan melebihi gaji. Sisa yang bisa dialokasikan: {{ fmtCur(personalForm.salary - totalMandatory) }}
          </p>
          <div class="flex gap-2">
            <button @click="showAddExpense = false" class="btn-secondary flex-1 text-sm">Batal</button>
            <button @click="addMandatory" :disabled="!addFormValid || addingExpense"
              class="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-all disabled:opacity-50">
              {{ addingExpense ? '...' : 'Tambah' }}
            </button>
          </div>
        </div>

        <!-- List -->
        <div v-if="mandatoryLoading" class="space-y-2">
          <div v-for="i in 3" :key="i" class="h-12 rounded-xl bg-white/5 animate-pulse" />
        </div>
        <div v-else-if="expenses.length === 0" class="text-center py-6 text-slate-500 text-sm">
          Belum ada pengeluaran wajib
        </div>
        <div v-else class="space-y-2">
          <div v-for="item in expenses" :key="item.mandatory_expenditure_id"
            class="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group">
            <span class="text-xl flex-shrink-0">{{ catMeta[item.category]?.icon ?? '📦' }}</span>
            <div class="flex-1 min-w-0">
              <p class="text-white text-sm font-medium truncate">{{ item.description }}</p>
              <p class="text-slate-500 text-xs">{{ catMeta[item.category]?.label }}</p>
            </div>
            <span class="font-bold text-sm tabular-nums text-red-400 flex-shrink-0">{{ fmtCur(item.amount) }}</span>
            <button @click="deleteMandatory(item.mandatory_expenditure_id)"
              class="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-slate-600 hover:text-red-400">
              🗑️
            </button>
          </div>
          <div class="flex justify-between items-center pt-3 mt-2 border-t border-white/10">
            <span class="text-slate-400 text-sm font-medium">Total Wajib</span>
            <span class="font-black text-white">{{ fmtCur(totalMandatory) }}</span>
          </div>
        </div>
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
          <button @click="recalculate" :disabled="recalculating"
            class="w-full py-3.5 rounded-2xl font-black text-white transition-all disabled:opacity-50"
            style="background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 0 30px rgba(16,185,129,0.3)">
            {{ recalculating ? '⏳ Menghitung ulang...' : '🔄 Hitung Ulang Budget' }}
          </button>
        </div>
      </Transition>

      <!-- ─── Current budget preview ──────────────────────── -->
      <section v-if="budgetPlan && !isDirty" class="glass-card p-5">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-lg">📊</span>
          <h2 class="font-bold text-white">Budget Aktif Bulan Ini</h2>
          <span class="ml-auto text-xs text-slate-500">{{ monthLabel }}</span>
        </div>

        <!-- Skeleton saat recalculate -->
        <template v-if="budgetRefreshing">
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div class="h-16 rounded-2xl bg-white/5 animate-pulse" />
            <div class="h-16 rounded-2xl bg-white/5 animate-pulse" />
          </div>
          <div class="space-y-2">
            <div v-for="i in 3" :key="i" class="h-8 rounded-xl bg-white/5 animate-pulse" />
          </div>
        </template>

        <template v-else>
          <div class="grid grid-cols-2 gap-3 mb-3">
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
              <span class="font-semibold text-white">{{ fmtShort((budgetPlan.food_amount ?? 0) / new Date(now.getFullYear(), now.getMonth()+1, 0).getDate()) }}</span>
            </div>
            <div class="flex justify-between py-1.5 border-b border-white/5">
              <span class="text-slate-400">💰 Tabungan/bulan</span>
              <span class="font-bold text-emerald-400">{{ fmtCur(budgetPlan.savings_amount ?? 0) }}</span>
            </div>
            <div class="flex justify-between py-1.5">
              <span class="text-slate-400">⚙️ Wajib/bulan</span>
              <span class="font-semibold text-slate-300">{{ fmtCur(budgetPlan.total_mandatory ?? 0) }}</span>
            </div>
          </div>
        </template>
      </section>

    </template>

    <!-- Toast notification -->
    <Transition name="toast">
      <div v-if="toast" class="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-2xl text-sm font-semibold shadow-xl flex items-center gap-2 whitespace-nowrap"
        :class="toast.type === 'success'
          ? 'bg-emerald-500/90 text-white backdrop-blur-md'
          : 'bg-red-500/90 text-white backdrop-blur-md'">
        <span>{{ toast.type === 'success' ? '✓' : '✕' }}</span>
        {{ toast.message }}
      </div>
    </Transition>

    <!-- Recalculate overlay -->
    <Transition name="fade">
      <div v-if="recalculating" class="fixed inset-0 z-50 flex items-center justify-center"
        style="background: rgba(2,6,23,0.85); backdrop-filter: blur(12px)">
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
import { ref, computed, onMounted, watch } from 'vue'
import api from '@/api'
import { useCurrencyInput } from '@/composables/useCurrencyInput'

const { displayValue: salaryDisplay, numericValue: salaryNumeric } = useCurrencyInput()
const { displayValue: addAmountDisplay, numericValue: addAmountValue, reset: resetAddAmount } = useCurrencyInput()

const loading = ref(true)
const mandatoryLoading = ref(false)
const isDirty = ref(false)
const editingPersonal = ref(false)
const hasTransactions = ref(false)
const savingPersonal = ref(false)
const personalError = ref('')
const showAddExpense = ref(false)
const addingExpense = ref(false)
const recalculating = ref(false)
const recalcPhase = ref('')
const budgetRefreshing = ref(false)
const toast = ref<{ message: string; type: 'success' | 'error' } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(message: string, type: 'success' | 'error' = 'success') {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { message, type }
  toastTimer = setTimeout(() => { toast.value = null }, 3500)
}

const personalForm = ref({ salary: 0, saving_type: '', purpose_of_join_here: '', region: '' })
const addForm = ref({ category: '', description: '' })
const expenses = ref<any[]>([])
const budgetPlan = ref<any>(null)

const now = new Date()
const monthLabel = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

const savingOptions = [
  { value: 'frugal',         icon: '🧊', label: 'Frugal' },
  { value: 'recommendation', icon: '✅', label: 'Rekomendasi' },
  { value: 'normal',         icon: '😊', label: 'Normal' },
]
const savingLabels: Record<string, string> = {
  frugal: '🧊 Frugal',
  recommendation: '✅ Rekomendasi',
  normal: '😊 Normal',
}
const spendPct: Record<string, number> = { frugal: 0.35, recommendation: 0.55, normal: 0.75 }

const mandatoryCategories = [
  { value: 'housing',      icon: '🏠', label: 'Kost/Sewa' },
  { value: 'transport',    icon: '🚗', label: 'Transport' },
  { value: 'utilities',    icon: '📱', label: 'Utilitas' },
  { value: 'subscription', icon: '💳', label: 'Langganan' },
  { value: 'other',        icon: '📦', label: 'Lainnya' },
]
const catMeta: Record<string, { icon: string; label: string }> = Object.fromEntries(
  mandatoryCategories.map(c => [c.value, { icon: c.icon, label: c.label }])
)

const totalMandatory = computed(() => expenses.value.reduce((s, e) => s + (e.amount ?? 0), 0))
const addFormValid = computed(() =>
  addForm.value.category &&
  addAmountValue.value > 0 &&
  addForm.value.description.trim().length >= 3 &&
  (totalMandatory.value + addAmountValue.value) < personalForm.value.salary
)
const addWouldExceed = computed(() =>
  addAmountValue.value > 0 && (totalMandatory.value + addAmountValue.value) >= personalForm.value.salary
)

// Live preview when editing
const preview = computed(() => {
  if (!editingPersonal.value) return null
  const newSalary = salaryNumeric.value
  const type = personalForm.value.saving_type
  if (!newSalary || !type) return null

  const available = newSalary - totalMandatory.value
  if (available <= 0) return null
  const spend = spendPct[type] ?? 0.55
  const newDailyBudget = (available * spend) / daysInMonth
  const newSavings = available * (1 - spend)

  const oldDailyBudget = budgetPlan.value?.daily_budget ?? 0
  const oldSavings = budgetPlan.value?.savings_amount ?? 0

  return {
    dailyBudget: newDailyBudget,
    savings: newSavings,
    dailyBudgetDiff: newDailyBudget - oldDailyBudget,
    savingsDiff: newSavings - oldSavings,
  }
})

function fmtCur(val: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}
function fmtShort(val: number) {
  if (val >= 1_000_000) return 'Rp ' + (val / 1_000_000).toFixed(1).replace('.0', '') + 'jt'
  if (val >= 1_000) return 'Rp ' + Math.round(val / 1_000) + 'rb'
  return 'Rp ' + Math.round(val)
}

watch(salaryNumeric, v => { personalForm.value.salary = v })

function toggleEdit() {
  editingPersonal.value = !editingPersonal.value
  if (editingPersonal.value && personalForm.value.salary > 0) {
    salaryDisplay.value = String(Math.round(personalForm.value.salary)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }
}

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
      personalForm.value = {
        salary: pd.salary ?? 0,
        saving_type: pd.saving_type ?? '',
        purpose_of_join_here: pd.purpose_of_join_here ?? '',
        region: '',
      }
      if (pd.salary > 0) {
        salaryDisplay.value = String(Math.round(pd.salary)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      }
    }

    if (bpRes.status === 'fulfilled') {
      budgetPlan.value = bpRes.value.data.data
    }

    // Check if there are transactions this month
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
    expenses.value = (raw?.data ?? raw ?? [])
  } catch {
    expenses.value = []
  } finally {
    mandatoryLoading.value = false
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
    personalForm.value.salary = newSalary
    await api.put('/personal-data/', {
      salary: personalForm.value.salary,
      saving_type: personalForm.value.saving_type,
      purpose_of_join_here: personalForm.value.purpose_of_join_here,
    })
    editingPersonal.value = false
    // Auto-trigger recalculate after saving
    await recalculate()
  } catch (e: any) {
    personalError.value = e.response?.data?.errors ?? e.response?.data?.message ?? 'Gagal menyimpan'
    savingPersonal.value = false
  }
}

async function silentRecalculate() {
  if (!budgetPlan.value) return

  budgetRefreshing.value = true
  try {
    const region = budgetPlan.value.region ?? ''
    const savingType = budgetPlan.value.saving_type || personalForm.value.saving_type || 'recommendation'
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
  } catch (e: any) {
    const msg = e?.response?.data?.errors ?? e?.response?.data?.message ?? 'error'
    showToast(`Gagal memperbarui budget: ${msg}`, 'error')
  } finally {
    budgetRefreshing.value = false
  }
}

async function addMandatory() {
  addingExpense.value = true
  try {
    await api.post('/mandatory-expenditure/', {
      category: addForm.value.category,
      amount: addAmountValue.value,
      description: addForm.value.description,
      transaction_date: new Date().toISOString(),
      for_month: now.getMonth() + 1,
      for_year: now.getFullYear(),
    })
    addForm.value = { category: '', description: '' }
    resetAddAmount()
    showAddExpense.value = false
    await loadExpenses()
    await silentRecalculate()
  } catch {
    showToast('Gagal menambah pengeluaran wajib', 'error')
  } finally { addingExpense.value = false }
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
  const phaseTimer = setInterval(() => {
    const idx = recalcPhases.indexOf(recalcPhase.value)
    if (idx < recalcPhases.length - 1) recalcPhase.value = recalcPhases[idx + 1]
  }, 800)

  try {
    await new Promise(r => setTimeout(r, 600))
    const region = budgetPlan.value?.region ?? 'Jakarta'
    await api.post('/budget-plan/', {
      for_month: now.getMonth() + 1,
      for_year: now.getFullYear(),
      saving_type: personalForm.value.saving_type,
      region,
    })
    await new Promise(r => setTimeout(r, 1000))
    const res = await api.get(`/budget-plan/${now.getMonth() + 1}/${now.getFullYear()}`)
    budgetPlan.value = res.data.data
    isDirty.value = false
    // Sync allocated_amount tracker hari ini ke budget plan terbaru
    api.post('/daily-budget/sync-today').catch(() => {})
  } catch {} finally {
    clearInterval(phaseTimer)
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
