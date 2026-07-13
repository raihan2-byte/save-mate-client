<template>
  <div class="p-4 md:p-8 max-w-3xl mx-auto">

    <h1 class="text-2xl font-black text-white mb-6">Profil</h1>

    <!-- Avatar card -->
    <div class="glass-card p-6 flex items-center gap-5 mb-5">
      <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-3xl font-black text-white flex-shrink-0 shadow-glow-emerald">
        {{ initial }}
      </div>
      <div>
        <p class="font-black text-white text-xl">{{ auth.user?.username ?? '—' }}</p>
        <p class="text-slate-400 text-sm mt-0.5">{{ auth.user?.email ?? '—' }}</p>
        <span class="inline-flex items-center mt-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
          ✓ Akun Aktif
        </span>
      </div>
    </div>

    <!-- Budget harian card -->
    <div v-if="budget" class="rounded-2xl border border-emerald-500/20 mb-5 overflow-hidden bg-emerald-gradient">
      <div class="p-5">
        <p class="text-emerald-300 text-[10px] font-bold uppercase tracking-widest mb-3">Budget Aktif {{ (budget.mid_cycle_days ?? 0) > 0 ? 'Periode Ini' : 'Bulan Ini' }}</p>
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="bg-white/10 rounded-2xl p-3 text-center backdrop-blur">
            <p class="text-emerald-200/70 text-[10px] mb-1">🟦 Budget/hari</p>
            <p class="font-black text-white text-xl">{{ fmtShort(budget.daily_budget ?? 0) }}</p>
          </div>
          <div class="bg-white/10 rounded-2xl p-3 text-center backdrop-blur">
            <p class="text-emerald-200/70 text-[10px] mb-1">📕 Tabungan/hari</p>
            <p class="font-black text-white text-xl">{{ fmtShort(budget.daily_savings ?? 0) }}</p>
          </div>
        </div>
        <div class="flex justify-between text-xs text-emerald-200/60 px-1">
          <span>Wajib/{{ (budget.mid_cycle_days ?? 0) > 0 ? 'periode' : 'bulan' }}: {{ fmtShort(budget.total_mandatory ?? 0) }}</span>
          <span>Tabungan/{{ (budget.mid_cycle_days ?? 0) > 0 ? 'periode' : 'bulan' }}: {{ fmtShort(budget.savings_amount ?? 0) }}</span>
        </div>
      </div>
      <div class="px-5 pb-4">
        <div class="rounded-xl border border-emerald-400/15 bg-black/20 p-3">
          <p class="text-emerald-300 text-[10px] font-bold mb-1">💡 Kalau ada sisa budget hari ini</p>
          <p class="text-emerald-100/60 text-[11px] leading-relaxed">Sisa bisa dibawa ke besok atau masuk tabungan. Kalau tiap hari konsisten sisa, total tabunganmu bisa <span class="text-white font-semibold">melebihi target</span> yang sudah dihitung.</p>
        </div>
      </div>
    </div>

    <!-- Next month preview card -->
    <div v-if="nextBudgetPreview" class="rounded-2xl border border-violet-500/20 mb-5 overflow-hidden bg-gradient-to-br from-violet-900/40 to-slate-900/60">
      <div class="p-5">
        <p class="text-violet-300 text-[10px] font-bold uppercase tracking-widest mb-1">Bulan Depan · {{ nextMonthLabel }}</p>
        <div class="flex items-center gap-2 mb-3">
          <span class="text-sm">{{ nextBudgetPreview.salary > currentSalary ? '📈' : '📉' }}</span>
          <span class="text-slate-300 text-xs">
            Gaji {{ nextBudgetPreview.salary > currentSalary ? 'naik' : 'turun' }} ke
            <span :class="nextBudgetPreview.salary > currentSalary ? 'text-emerald-400' : 'text-orange-400'" class="font-bold">
              {{ fmtShort(nextBudgetPreview.salary) }}
            </span>
            mulai gajian tgl {{ paydayDay }}
            <span class="text-slate-500 ml-1">(dari {{ fmtShort(currentSalary) }})</span>
          </span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-center">
          <div class="bg-white/5 rounded-xl p-3">
            <p class="text-slate-500 text-[10px] mb-1">🟦 Budget/hari</p>
            <p class="font-black text-white text-lg">{{ fmtShort(nextBudgetPreview.dailyBudget) }}</p>
          </div>
          <div class="bg-white/5 rounded-xl p-3">
            <p class="text-slate-500 text-[10px] mb-1">📕 Tabungan/hari</p>
            <p class="font-black text-emerald-300 text-lg">{{ fmtShort(nextBudgetPreview.dailySavings) }}</p>
          </div>
        </div>
        <div class="flex justify-between text-xs text-slate-500 mt-2 px-1">
          <span>Makan: {{ fmtShort(nextBudgetPreview.foodAmount) }}</span>
          <span>Lifestyle: {{ fmtShort(nextBudgetPreview.lifestyleAmount) }}</span>
          <span>Tabungan: {{ fmtShort(nextBudgetPreview.savingsAmount) }}</span>
        </div>
      </div>
      <div class="px-5 pb-4">
        <div class="rounded-xl border border-violet-400/15 bg-black/20 p-3 flex items-start gap-2">
          <span class="text-xs">🔔</span>
          <p class="text-violet-200/60 text-[11px] leading-relaxed">Budget ini akan aktif otomatis saat siklus gajian tgl {{ paydayDay }} dimulai. Kamu bisa ubah di <RouterLink to="/app/settings" class="text-violet-300 underline">Pengaturan Keuangan</RouterLink>.</p>
        </div>
      </div>
    </div>

    <!-- Menu -->
    <div class="glass-card mb-5 overflow-hidden">
      <RouterLink v-for="item in menuItems" :key="item.label" :to="item.to"
        class="flex items-center gap-4 px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group">
        <div class="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" :class="item.bg">
          {{ item.icon }}
        </div>
        <div class="flex-1">
          <p class="text-sm font-medium text-white group-hover:text-emerald-300 transition-colors">{{ item.label }}</p>
          <p class="text-xs text-slate-500">{{ item.sub }}</p>
        </div>
        <span class="text-slate-600">›</span>
      </RouterLink>
    </div>

    <!-- Logout -->
    <button @click="handleLogout"
      class="w-full py-3.5 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400 font-semibold hover:bg-red-500/10 transition-colors text-sm">
      🚪 Keluar dari Akun
    </button>

    <p class="text-center text-slate-600 text-xs mt-6">CipuyWallet v0.1.0 · Smart Budget Manager</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/api'
import type { BudgetPlan } from '@/types/index'
import { calcBudgetPreview } from '@/constants/budgetConfig'

const auth = useAuthStore()
const router = useRouter()

const initial = computed(() => (auth.user?.username?.[0] ?? '?').toUpperCase())

const budget = ref<BudgetPlan | null>(null)
const nextSalary = ref<number | null>(null)
const currentSalary = ref(0)
const paydayDay = ref(1)
const savingType = ref('recommendation')
const now = new Date()

const nextMonthDays = computed(() => new Date(now.getFullYear(), now.getMonth() + 2, 0).getDate())
const nextMonthLabel = computed(() => {
  const d = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
})

const nextBudgetPreview = computed(() => {
  if (!nextSalary.value || nextSalary.value <= 0) return null
  const mandatory = budget.value?.total_mandatory ?? 0
  return calcBudgetPreview(nextSalary.value, mandatory, savingType.value, nextMonthDays.value)
})

function fmtShort(val: number) {
  if (val >= 1_000_000) return 'Rp ' + (val / 1_000_000).toFixed(1).replace('.0', '') + 'jt'
  if (val >= 1_000) return 'Rp ' + Math.round(val / 1_000) + 'rb'
  return 'Rp ' + Math.round(val)
}

onMounted(async () => {
  try {
    const [bpRes, pdRes] = await Promise.allSettled([
      api.get(`/budget-plan/${now.getMonth() + 1}/${now.getFullYear()}`),
      api.get('/personal-data/'),
    ])
    if (bpRes.status === 'fulfilled') budget.value = bpRes.value.data.data
    if (pdRes.status === 'fulfilled') {
      const pd = pdRes.value.data.data
      paydayDay.value = pd.payday_day ?? 1
      savingType.value = pd.saving_type ?? 'recommendation'
      currentSalary.value = pd.salary ?? 0
      nextSalary.value = pd.next_salary ?? null
    }
  } catch {}
})

const menuItems = [
  { to: '/app/settings',  icon: '⚙️', label: 'Pengaturan Keuangan', sub: 'Edit gaji, wajib & hitung ulang budget', bg: 'bg-amber-500/15' },
  { to: '/app/budget',    icon: '📊', label: 'Budget Plan',          sub: 'Rencana keuangan bulanan',               bg: 'bg-cyan-500/15' },
  { to: '/app/income',    icon: '💰', label: 'Data Pemasukan',       sub: 'Kelola sumber penghasilan',              bg: 'bg-emerald-500/15' },
  { to: '/app/expenses',  icon: '🛍️', label: 'Data Pengeluaran',   sub: 'Riwayat pengeluaran',                    bg: 'bg-red-500/10' },
  { to: '/app/summary',   icon: '📈', label: 'Ringkasan Bulanan',    sub: 'Laporan keuangan lengkap',               bg: 'bg-violet-500/15' },
]

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>
