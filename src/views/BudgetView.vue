<template>
  <div class="p-4 md:p-8 max-w-3xl mx-auto">

    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-2 mb-6">
      <div>
        <h1 class="text-2xl font-black text-white">Budget Plan</h1>
        <p class="text-slate-500 text-sm mt-0.5">Rencana keuangan per periode gajian</p>
      </div>
      <div class="flex items-center gap-1 glass-card px-2 py-2 min-w-0">
        <button @click="prevMonth" class="text-slate-400 hover:text-white transition-colors px-1 flex-shrink-0">◀</button>
        <span class="font-semibold text-white text-[11px] min-w-0 flex-1 text-center truncate max-w-[160px]">{{ monthLabel }}</span>
        <button @click="nextMonth" class="text-slate-400 hover:text-white transition-colors px-1 flex-shrink-0">▶</button>
      </div>
    </div>

    <LoadingSkeleton v-if="loading" :rows="3" height="h-32" />

    <!-- Empty state -->
    <SectionCard v-else-if="!budget" class="text-center">
      <EmptyState
        icon="📊"
        title="Budget bulan ini belum dibuat"
        subtitle="Buat budget berdasarkan data keuanganmu"
      />
      <AppButton
        variant="primary"
        class="mx-auto mt-2 shadow-glow-emerald"
        @click="showGenModal = true"
      >
        ✨ Buat Budget Otomatis
      </AppButton>
    </SectionCard>

    <div v-else class="space-y-5">
      <!-- Hero card -->
      <div class="relative overflow-hidden rounded-3xl p-4 md:p-6 border border-emerald-500/20 bg-emerald-gradient">
        <div class="pointer-events-none absolute -top-10 -right-10 w-52 h-52 bg-emerald-400/15 blur-3xl rounded-full" />
        <div class="relative z-10">
          <p class="text-emerald-300 text-xs font-semibold uppercase tracking-widest">
            {{ budget.mid_cycle_days && budget.mid_cycle_days > 0 ? `Budget s/d Gajian (${budget.mid_cycle_days} hari)` : 'Total Budget Bulanan' }}
          </p>
          <p class="text-3xl font-black text-white mt-2">{{ formatCurrencyShort((budget.food_amount ?? 0) + (budget.lifestyle_amount ?? 0) + (budget.savings_amount ?? 0)) }}</p>
          <div class="grid grid-cols-3 gap-1.5 mt-5">
            <div v-for="stat in budgetStats" :key="stat.label" class="bg-white/10 rounded-xl p-2 text-center backdrop-blur">
              <p class="font-black text-white text-xs">{{ formatCurrencyShort(stat.value) }}</p>
              <p class="text-emerald-200/60 text-[10px] mt-0.5">{{ stat.label }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Breakdown -->
      <SectionCard>
        <h2 class="font-bold text-white mb-4">Rincian Alokasi</h2>
        <div class="space-y-4">
          <div v-for="item in breakdown" :key="item.label">
            <div class="flex justify-between mb-1.5 text-sm">
              <span class="text-slate-300 flex items-center gap-2"><span>{{ item.icon }}</span>{{ item.label }}</span>
              <span class="font-semibold text-white tabular-nums">{{ formatCurrency(item.value) }}</span>
            </div>
            <div class="h-2 rounded-full bg-white/5 overflow-hidden">
              <div class="h-full rounded-full transition-all duration-700" :class="item.color"
                :style="{ width: pct(item.value) + '%' }" />
            </div>
          </div>
        </div>
      </SectionCard>

      <!-- Daily budget highlight -->
      <SectionCard class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-2xl flex-shrink-0">📅</div>
        <div>
          <p class="text-slate-400 text-xs">Budget harian yang tersedia</p>
          <p class="text-2xl font-black text-emerald-400">{{ formatCurrencyShort(budget.daily_budget ?? 0) }}</p>
          <p class="text-slate-500 text-xs mt-0.5">
            {{ budget.mid_cycle_days && budget.mid_cycle_days > 0
              ? `per hari selama ${budget.mid_cycle_days} hari ke gajian`
              : 'per hari sepanjang bulan ini' }}
          </p>
        </div>
      </SectionCard>
    </div>

    <BudgetGenerateModal
      v-model="showGenModal"
      :current-plan="budget"
      @generated="loadAllPlans"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/api'
import type { BudgetPlan } from '@/types/index'
import AppButton from '@/components/ui/AppButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import SectionCard from '@/components/ui/SectionCard.vue'
import BudgetGenerateModal from '@/components/budget/BudgetGenerateModal.vue'
import { formatCurrency, formatCurrencyShort } from '@/utils/formatting'
import { usePersonalDataStore } from '@/stores/personalData'

const pdStore = usePersonalDataStore()
const plans = ref<BudgetPlan[]>([])
const loading = ref(true)
const showGenModal = ref(false)
const paydayDay = ref(1)

const now = new Date()
const viewIndex = ref(-1)

const budget = computed(() => plans.value[viewIndex.value] ?? null)

function prevMonth() {
  if (viewIndex.value > 0) viewIndex.value--
}
async function nextMonth() {
  if (viewIndex.value < plans.value.length - 1) {
    viewIndex.value++
    return
  }
  const last = plans.value[plans.value.length - 1]
  if (!last) return
  const nextM = last.for_month === 12 ? 1 : last.for_month + 1
  const nextY = last.for_month === 12 ? last.for_year + 1 : last.for_year
  const todayM = now.getMonth() + 1
  const todayY = now.getFullYear()
  if (nextY > todayY || (nextY === todayY && nextM > todayM + 1)) return
  try {
    const res = await api.get(`/budget-plan/${nextM}/${nextY}`)
    if (res.data?.data) {
      plans.value.push(res.data.data)
    }
    // no plan for that month — don't push an empty stub
  } catch {}
  viewIndex.value = plans.value.length - 1
}

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

function pct(val: number) {
  const b = budget.value
  if (!b) return '0'
  const total = (b.food_amount ?? 0) + (b.lifestyle_amount ?? 0) + (b.savings_amount ?? 0) + (b.total_mandatory ?? 0)
  if (total <= 0) return '0'
  return Math.min((val / total) * 100, 100).toFixed(1)
}

async function loadAllPlans() {
  loading.value = true
  try {
    await api.post('/budget-plan/check-reset').catch(() => {})
    const [plansRes] = await Promise.all([
      api.get('/budget-plan/'),
      pdStore.fetch(),
    ])
    paydayDay.value = pdStore.data?.payday_day ?? 1
    plans.value = plansRes.data.data ?? []

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

onMounted(loadAllPlans)
</script>

<style scoped>
.bg-emerald-gradient {
  background: linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%);
}
</style>
