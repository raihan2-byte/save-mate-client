<template>
  <div class="p-4 md:p-8 max-w-3xl mx-auto">

    <!-- Header -->
    <div class="mb-8">
      <p class="text-slate-500 text-sm">{{ todayDate }}</p>
      <h1 class="text-2xl md:text-3xl font-black text-white mt-1">
        Halo, {{ firstName }} 👋
      </h1>
      <p class="text-slate-400 text-sm mt-1">Ini ringkasan keuanganmu hari ini</p>
    </div>

    <!-- Budget hero card -->
    <div class="relative overflow-hidden rounded-3xl p-6 mb-6"
      style="background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%); border: 1px solid rgba(16,185,129,0.3)">
      <!-- Glow -->
      <div class="pointer-events-none absolute -top-10 -right-10 w-48 h-48 bg-emerald-400/20 blur-3xl rounded-full" />
      <div class="pointer-events-none absolute -bottom-10 -left-10 w-48 h-48 bg-cyan-400/10 blur-3xl rounded-full" />

      <div class="relative z-10">
        <div class="flex items-center justify-between mb-4">
          <div>
            <p class="text-emerald-300 text-xs font-semibold uppercase tracking-widest">Sisa Budget Hari Ini</p>
            <p class="text-4xl font-black text-white mt-1">
              {{ formatCurrency(displayRemaining) }}
            </p>
          </div>
          <div class="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center text-3xl border border-white/20">
            💰
          </div>
        </div>

        <!-- Bar -->
        <div class="bg-white/10 rounded-full h-2 mb-3 overflow-hidden">
          <div class="h-full rounded-full transition-all duration-700"
            :class="budgetUsedPercent > 80 ? 'bg-red-400' : budgetUsedPercent > 60 ? 'bg-yellow-400' : 'bg-emerald-400'"
            :style="{ width: budgetUsedPercent + '%' }" />
        </div>

        <div class="text-xs text-emerald-200/70">
          <span>Digunakan: {{ formatCurrency(displaySpent) }}</span>
        </div>
      </div>
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-3 gap-3 mb-6">
      <div v-for="stat in summaryStats" :key="stat.label"
        class="glass-card p-4 text-center">
        <p class="text-xl mb-1">{{ stat.icon }}</p>
        <p class="font-black text-white text-sm md:text-base">{{ stat.value }}</p>
        <p class="text-slate-500 text-[10px] md:text-xs mt-0.5">{{ stat.label }}</p>
      </div>
    </div>

    <!-- Food budget card -->
    <div class="glass-card p-5 mb-6">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-lg">🍜</span>
          <p class="font-bold text-white text-sm">Budget Makan Hari Ini</p>
        </div>
        <span class="text-xs font-semibold px-2.5 py-1 rounded-full"
          :class="foodRemaining < 0 ? 'bg-red-500/15 text-red-400' : foodRemaining < foodAllocated * 0.2 ? 'bg-yellow-500/15 text-yellow-400' : 'bg-emerald-500/15 text-emerald-400'">
          {{ foodRemaining < 0 ? 'Over budget' : 'Sisa ' + formatCurrencyShort(foodRemaining) }}
        </span>
      </div>
      <div class="bg-white/5 rounded-full h-2 mb-3 overflow-hidden">
        <div class="h-full rounded-full transition-all duration-700"
          :class="foodUsedPct > 80 ? 'bg-red-400' : foodUsedPct > 60 ? 'bg-yellow-400' : 'bg-emerald-400'"
          :style="{ width: Math.min(foodUsedPct, 100) + '%' }" />
      </div>
      <div class="flex justify-between text-xs text-slate-500">
        <span>Terpakai: <span class="text-white font-medium">{{ formatCurrency(foodSpent) }}</span></span>
        <span>Alokasi: <span class="text-white font-medium">{{ formatCurrency(foodAllocated) }}</span></span>
      </div>
    </div>

    <!-- Tomorrow budget preview -->
    <div v-if="tomorrowSummary?.hasAdjustment" class="mb-6 rounded-3xl border overflow-hidden"
      :class="tomorrowSummary.totalCut < 0 ? 'border-red-500/20' : 'border-emerald-500/20'">

      <!-- Header -->
      <div class="px-5 pt-5 pb-4 flex items-center justify-between"
        :style="tomorrowSummary.totalCut < 0
          ? 'background: linear-gradient(135deg, #2d0a0a, #3b0f0f)'
          : 'background: linear-gradient(135deg, #052e16, #064e3b)'">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            :class="tomorrowSummary.totalCut < 0 ? 'bg-red-500/20' : 'bg-emerald-500/20'">
            {{ tomorrowSummary.totalCut < 0 ? '✂️' : '🎁' }}
          </div>
          <div>
            <p class="font-black text-white text-sm">Budget Besok</p>
            <p class="text-xs mt-0.5" :class="tomorrowSummary.totalCut < 0 ? 'text-red-300' : 'text-emerald-300'">
              {{ tomorrowSummary.totalCut < 0 ? 'Ada potongan dari hari ini' : 'Ada bonus dari hari ini' }}
            </p>
          </div>
        </div>
        <span class="text-[10px] text-white/40">{{ tomorrowLabel }}</span>
      </div>

      <!-- Hero: Normal → Besok -->
      <div class="bg-slate-900 px-5 py-4">
        <div class="flex items-center gap-3 mb-4">
          <div class="flex-1 text-center bg-white/5 rounded-2xl p-3">
            <p class="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Budget Normal</p>
            <p class="text-white font-bold text-base">{{ formatCurrency(tomorrowSummary.totalAllocated) }}</p>
          </div>
          <div class="flex flex-col items-center gap-0.5">
            <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs"
              :class="tomorrowSummary.totalCut < 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'">
              {{ tomorrowSummary.totalCut < 0 ? '▼' : '▲' }}
            </div>
            <p class="text-[10px] font-bold" :class="tomorrowSummary.totalCut < 0 ? 'text-red-400' : 'text-emerald-400'">
              {{ formatCurrencyShort(Math.abs(tomorrowSummary.totalCut)) }}
            </p>
          </div>
          <div class="flex-1 text-center rounded-2xl p-3"
            :class="tomorrowSummary.totalCut < 0 ? 'bg-red-500/10' : 'bg-emerald-500/10'">
            <p class="text-[10px] uppercase tracking-wider mb-1" :class="tomorrowSummary.totalCut < 0 ? 'text-red-400/70' : 'text-emerald-400/70'">Budget Besok</p>
            <p class="font-black text-base" :class="tomorrowSummary.totalEffective < 0 ? 'text-red-400' : tomorrowSummary.totalCut < 0 ? 'text-orange-300' : 'text-emerald-300'">
              {{ formatCurrency(tomorrowSummary.totalEffective) }}
            </p>
          </div>
        </div>

        <!-- Divider -->
        <div class="flex items-center gap-2 mb-3">
          <div class="h-px flex-1 bg-white/8" />
          <p class="text-[10px] text-slate-600 uppercase tracking-wider">Rincian</p>
          <div class="h-px flex-1 bg-white/8" />
        </div>

        <!-- Row: Makanan -->
        <div class="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/3 mb-2">
          <div class="flex items-center gap-2.5">
            <span class="text-base">🍜</span>
            <div>
              <p class="text-white text-xs font-semibold">Budget Makanan</p>
              <p class="text-[10px]" :class="tomorrowSummary.foodCarryover < 0 ? 'text-orange-400' : 'text-emerald-400'">
                {{ tomorrowSummary.foodCarryover < 0
                  ? `Dipotong ${formatCurrencyShort(Math.abs(tomorrowSummary.foodCarryover))}`
                  : 'Terlindungi ✓' }}
              </p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-black text-sm" :class="tomorrowSummary.foodCarryover < 0 ? 'text-orange-300' : 'text-white'">
              {{ formatCurrency(tomorrowSummary.foodEffective) }}
            </p>
            <p class="text-slate-600 text-[10px]">dari {{ formatCurrencyShort(tomorrowSummary.foodAllocated) }}</p>
          </div>
        </div>

        <!-- Row: Lainnya -->
        <div class="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/3">
          <div class="flex items-center gap-2.5">
            <span class="text-base">📦</span>
            <div>
              <p class="text-white text-xs font-semibold">Lainnya</p>
              <p class="text-[10px]" :class="tomorrowSummary.othersCarryover < 0 ? 'text-red-400' : tomorrowSummary.othersCarryover > 0 ? 'text-emerald-400' : 'text-slate-500'">
                {{ tomorrowSummary.othersCarryover < 0
                  ? `Dipotong ${formatCurrencyShort(Math.abs(tomorrowSummary.othersCarryover))}`
                  : tomorrowSummary.othersCarryover > 0
                    ? `+${formatCurrencyShort(tomorrowSummary.othersCarryover)} bonus`
                    : 'Normal' }}
              </p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-black text-sm" :class="tomorrowSummary.othersEffective < tomorrowSummary.othersAllocated ? 'text-orange-300' : 'text-white'">
              {{ formatCurrency(tomorrowSummary.othersEffective) }}
            </p>
            <p class="text-slate-600 text-[10px]">dari {{ formatCurrencyShort(tomorrowSummary.othersAllocated) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="mb-6">
      <h2 class="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Aksi Cepat</h2>
      <div class="grid grid-cols-2 gap-3">
        <RouterLink v-for="action in quickActions" :key="action.label" :to="action.to"
          class="glass-card p-4 flex items-center gap-3 hover:border-emerald-500/30 hover:-translate-y-0.5 transition-all group">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            :class="action.bg">
            {{ action.icon }}
          </div>
          <div>
            <p class="font-semibold text-white text-sm group-hover:text-emerald-300 transition-colors">{{ action.label }}</p>
            <p class="text-slate-500 text-xs mt-0.5">{{ action.sub }}</p>
          </div>
        </RouterLink>
      </div>
    </div>

    <!-- Carryover modal -->
    <Transition name="modal">
      <div v-if="carryoverItems.length > 0" class="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div class="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 z-10">
          <div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5 md:hidden" />
          <div class="flex items-center gap-3 mb-5">
            <div class="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-xl">💸</div>
            <div>
              <p class="font-black text-white">Sisa Budget Kemarin</p>
              <p class="text-slate-400 text-xs mt-0.5">{{ yesterdayLabel }} — pilih apa yang mau dilakukan</p>
            </div>
          </div>

          <div class="space-y-3 mb-5">
            <div v-for="item in carryoverItems" :key="item.category"
              class="rounded-2xl border border-white/10 bg-white/3 p-4">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <span class="text-lg">{{ catIcons[item.category] ?? '📦' }}</span>
                  <span class="font-semibold text-white capitalize text-sm">{{ catLabels[item.category] ?? item.category }}</span>
                </div>
                <span class="font-black text-emerald-400">+{{ formatCurrency(item.remaining) }}</span>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <button v-for="opt in carryoverOptions" :key="opt.action"
                  @click="setChoice(item.category, opt.action)"
                  class="py-2 px-1 rounded-xl border text-[11px] font-semibold text-center transition-all"
                  :class="item.choice === opt.action
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'">
                  {{ opt.icon }}<br>{{ opt.label }}
                </button>
              </div>
            </div>
          </div>

          <!-- Info note -->
          <div class="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-3 mb-4">
            <p class="text-emerald-400 text-[11px] font-bold mb-1">💡 Tau nggak?</p>
            <p class="text-slate-400 text-[11px] leading-relaxed"><span class="text-white font-medium">Budget besok</span> = budget harianmu besok jadi lebih banyak. <span class="text-white font-medium">Tabungin</span> = budget besok tetap sama, tapi sisa hari ini langsung masuk tabunganmu dan terakumulasi setiap bulan. Kalau lewat jam 6 pagi dan belum dipilih, otomatis <span class="text-emerald-300 font-medium">masuk tabungan</span>.</p>
          </div>

          <button @click="submitCarryover" :disabled="!allChoicesMade || submittingCarryover"
            class="w-full py-3 rounded-2xl font-bold text-white text-sm transition-all disabled:opacity-40"
            style="background: linear-gradient(135deg, #10b981, #059669)">
            {{ submittingCarryover ? 'Memproses...' : '✓ Konfirmasi Pilihan' }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- Today's transactions -->
    <div class="glass-card p-5">
      <div class="flex items-center justify-between mb-5">
        <div>
          <h2 class="font-bold text-white">Transaksi Hari Ini</h2>
          <p class="text-slate-500 text-xs mt-0.5">{{ todayTx.length }} transaksi</p>
        </div>
        <RouterLink to="/app/transactions"
          class="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 rounded-lg transition-colors">
          Lihat semua
        </RouterLink>
      </div>

      <!-- Loading -->
      <div v-if="loadingTx" class="space-y-3">
        <div v-for="i in 3" :key="i" class="h-14 rounded-xl bg-white/5 animate-pulse" />
      </div>

      <!-- Empty -->
      <div v-else-if="todayTx.length === 0" class="text-center py-10">
        <p class="text-4xl mb-3">📭</p>
        <p class="text-slate-400 text-sm font-medium">Belum ada transaksi hari ini</p>
        <RouterLink to="/app/transactions"
          class="inline-block mt-4 text-xs text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 rounded-lg hover:bg-emerald-500/20 transition-colors">
          + Tambah Transaksi
        </RouterLink>
      </div>

      <!-- List -->
      <div v-else class="space-y-2">
        <div v-for="tx in todayTx" :key="tx.id"
          class="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              :class="tx.type === 'income' ? 'bg-emerald-500/15' : 'bg-red-500/10'">
              {{ tx.type === 'income' ? '⬆️' : '⬇️' }}
            </div>
            <div>
              <p class="text-sm font-medium text-white">{{ tx.description }}</p>
              <p class="text-xs text-slate-500">{{ tx.category || 'Tanpa kategori' }}</p>
            </div>
          </div>
          <span class="font-bold text-sm tabular-nums"
            :class="tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'">
            {{ tx.type === 'income' ? '+' : '-' }}{{ formatCurrency(tx.amount) }}
          </span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/api'

const auth = useAuthStore()

const dailyStatus = ref<any>(null)
const budgetPlan = ref<any>(null)
const todayTx = ref<any[]>([])
const tomorrowStatus = ref<any>(null)
const loadingTx = ref(true)

// Food budget
const foodTracker = computed(() => dailyStatus.value?.budgets?.find((b: any) => b.category === 'food'))
const foodAllocated = computed(() => {
  if (foodTracker.value) return foodTracker.value.allocated_amount + (foodTracker.value.carryover_in ?? 0)
  const now = new Date()
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return (budgetPlan.value?.food_amount ?? 0) / days
})
const foodSpent = computed(() => foodTracker.value?.actual_spent ?? 0)
const foodRemaining = computed(() => foodAllocated.value - foodSpent.value)
const foodUsedPct = computed(() => foodAllocated.value > 0 ? (foodSpent.value / foodAllocated.value) * 100 : 0)

function formatCurrencyShort(val: number) {
  if (val >= 1_000_000) return 'Rp ' + (val / 1_000_000).toFixed(1).replace('.0', '') + 'jt'
  if (val >= 1_000) return 'Rp ' + Math.round(val / 1_000) + 'rb'
  return 'Rp ' + Math.round(val)
}

// Selalu pakai daily_budget dari plan sebagai acuan total, spent dari tracker
const displayAllocated = computed(() => budgetPlan.value?.daily_budget ?? dailyStatus.value?.total_allocated ?? 0)
const displaySpent = computed(() => dailyStatus.value?.total_spent ?? 0)
const displayRemaining = computed(() => displayAllocated.value - displaySpent.value)

// ── Carryover ────────────────────────────────────────────────────
interface CarryoverItem { category: string; remaining: number; choice: string }
const carryoverItems = ref<CarryoverItem[]>([])
const submittingCarryover = ref(false)

const carryoverOptions = [
  { action: 'carryover', icon: '📈', label: 'Budget besok' },
  { action: 'save',      icon: '🏦', label: 'Tabungin' },
]
const catIcons: Record<string, string> = {
  food: '🍜', entertainment: '🎮', shopping: '🛍️', misc: '📦'
}
const catLabels: Record<string, string> = {
  food: 'Makanan', entertainment: 'Entertainment', shopping: 'Belanja', misc: 'Lainnya'
}
const yesterday = new Date(Date.now() - 86400000)
const yesterdayStr = yesterday.toISOString().split('T')[0]
const yesterdayLabel = yesterday.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })

const allChoicesMade = computed(() => carryoverItems.value.every(i => i.choice !== ''))

function setChoice(category: string, action: string) {
  const item = carryoverItems.value.find(i => i.category === category)
  if (item) item.choice = action
}

async function checkYesterdayCarryover() {
  try {
    const res = await api.get(`/daily-budget/${yesterdayStr}`)
    const budgets: any[] = res.data.data?.budgets ?? []
    const pending = budgets.filter(b => !b.is_finalized && b.remaining > 0)
    if (pending.length === 0) return

    const hour = new Date().getHours()
    const inWindow = hour >= 22 || hour < 6

    if (inWindow) {
      // Tampilkan modal — user pilih sendiri
      carryoverItems.value = pending.map(b => ({ category: b.category, remaining: b.remaining, choice: '' }))
    } else {
      // Lewat jam 6 pagi → auto-submit semua dengan "save"
      await Promise.all(
        pending.map(b =>
          api.post(`/daily-budget/${yesterdayStr}/carryover`, {
            category: b.category,
            remaining_amount: b.remaining,
            action: 'save',
          })
        )
      )
      await loadDashboard()
    }
  } catch {}
}

async function submitCarryover() {
  submittingCarryover.value = true
  try {
    await Promise.all(
      carryoverItems.value.map(item =>
        api.post(`/daily-budget/${yesterdayStr}/carryover`, {
          category: item.category,
          remaining_amount: item.remaining,
          action: item.choice,
        })
      )
    )
    carryoverItems.value = []
    await loadDashboard()
  } catch {} finally {
    submittingCarryover.value = false
  }
}

const todayDate = new Date().toLocaleDateString('id-ID', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
})

const firstName = computed(() => auth.user?.username?.split(' ')[0] ?? 'Pengguna')

const budgetUsedPercent = computed(() => {
  if (!displayAllocated.value) return 0
  return Math.min((displaySpent.value / displayAllocated.value) * 100, 100)
})

const summaryStats = computed(() => [
  {
    icon: '⬇️',
    value: formatCurrency(displaySpent.value),
    label: 'Terpakai',
  },
  {
    icon: '📅',
    value: formatCurrency(displayAllocated.value),
    label: 'Budget/Hari',
  },
  {
    icon: '💳',
    value: todayTx.value.length + 'x',
    label: 'Transaksi',
  },
])

const quickActions = [
  { to: '/app/transactions', icon: '➕', label: 'Tambah Transaksi', sub: 'Catat pengeluaran', bg: 'bg-emerald-500/15' },
  { to: '/app/budget',       icon: '📊', label: 'Budget Plan',      sub: 'Lihat rencana',    bg: 'bg-cyan-500/15' },
  { to: '/app/income',       icon: '💰', label: 'Pemasukan',        sub: 'Kelola income',    bg: 'bg-violet-500/15' },
  { to: '/app/summary',      icon: '📈', label: 'Ringkasan',        sub: 'Laporan bulanan',  bg: 'bg-orange-500/15' },
]

function formatCurrency(val: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0
  }).format(val)
}

// ── Tomorrow budget preview ───────────────────────────────────────
const tomorrowDate = new Date()
tomorrowDate.setDate(tomorrowDate.getDate() + 1)
const tomorrowStr = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth()+1).padStart(2,'0')}-${String(tomorrowDate.getDate()).padStart(2,'0')}`
const tomorrowLabel = tomorrowDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })

const tomorrowSummary = computed(() => {
  const dailyBudget = budgetPlan.value?.daily_budget ?? 0
  if (!dailyBudget) return null

  // Alokasi food dari plan (bukan dari tracker yang bisa kosong/salah)
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  const foodAllocated = budgetPlan.value?.food_amount
    ? budgetPlan.value.food_amount / daysInMonth
    : (dailyStatus.value?.budgets?.find((b: any) => b.category === 'food')?.allocated_amount ?? 0)
  const othersAllocated = dailyBudget - foodAllocated

  // Carryover dari tracker besok (apa yang sudah tersimpan)
  const tomorrowBudgets: any[] = tomorrowStatus.value?.budgets ?? []
  const tomorrowFood = tomorrowBudgets.find((b: any) => b.category === 'food')
  const foodCarryover = tomorrowFood?.carryover_in ?? 0
  const othersCarryover = tomorrowBudgets
    .filter((b: any) => b.category !== 'food')
    .reduce((s: number, b: any) => s + (b.carryover_in ?? 0), 0)

  const totalCut = foodCarryover + othersCarryover
  if (totalCut === 0) return null

  const foodEffective = foodAllocated + foodCarryover
  // Lainnya tidak boleh minus — floor di 0
  const othersEffectiveRaw = othersAllocated + othersCarryover
  const othersEffective = Math.max(othersEffectiveRaw, 0)
  const totalEffective = foodEffective + othersEffective

  return {
    foodAllocated,
    foodCarryover,
    foodEffective,
    othersAllocated,
    othersCarryover,
    othersEffective,
    totalAllocated: dailyBudget,
    totalCut: totalEffective - dailyBudget, // selisih aktual setelah floor
    totalEffective,
    hasAdjustment: true,
  }
})

async function loadDashboard() {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
  try {
    const [statusRes, txRes, planRes, tomorrowRes] = await Promise.all([
      api.get(`/daily-budget/${today}`).catch(() => null),
      api.get('/transactions/today').catch(() => null),
      api.get(`/budget-plan/${now.getMonth()+1}/${now.getFullYear()}`).catch(() => null),
      api.get(`/daily-budget/${tomorrowStr}`).catch(() => null),
    ])
    dailyStatus.value = statusRes?.data?.data ?? null
    todayTx.value = txRes?.data?.data ?? []
    budgetPlan.value = planRes?.data?.data ?? null
    tomorrowStatus.value = tomorrowRes?.data?.data ?? null
  } finally {
    loadingTx.value = false
  }
}

onMounted(async () => {
  await loadDashboard()
  await checkYesterdayCarryover()
})
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.25s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
