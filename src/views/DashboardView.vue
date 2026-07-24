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

    <!-- Error state -->
    <p v-if="loadError" class="text-red-400 text-sm text-center mb-6">Gagal memuat data</p>

    <!-- End-day banner (already finalized) -->
    <div v-if="endDayChoice" class="rounded-2xl border mb-6 p-4 flex items-center justify-between gap-3"
      :class="endDayChoice.Action === 'save'
        ? 'border-emerald-500/30 bg-emerald-500/8'
        : 'border-cyan-500/30 bg-cyan-500/8'">
      <div class="flex items-center gap-3">
        <span class="text-xl">{{ endDayChoice.Action === 'save' ? '🏦' : '📈' }}</span>
        <div>
          <p class="text-sm font-bold text-white">
            {{ endDayChoice.Action === 'save' ? 'Sisa masuk tabungan' : 'Sisa ke budget besok' }}
          </p>
          <p class="text-xs text-slate-400 mt-0.5">
            {{ formatCurrency(endDayChoice.TotalAmount) }} • Hari ini sudah diselesaikan
          </p>
          <p v-if="undoError" class="text-xs text-red-400 mt-1">{{ undoError }}</p>
        </div>
      </div>
      <button v-if="canUndoEndDay"
        @click="undoEndDay"
        :disabled="undoing"
        class="text-xs font-semibold text-slate-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-all flex-shrink-0">
        {{ undoing ? '...' : 'Batalkan' }}
      </button>
    </div>

    <!-- Budget hero card -->
    <DailyBudgetCard
      :budget="budgetPlan"
      :food-tracker="foodTracker"
      :lifestyle-tracker="lifestyleTracker"
      :loading="loadingTx"
      :display-allocated="displayAllocated"
      :display-spent="displaySpent"
    />

    <!-- Stats row -->
    <div class="grid grid-cols-3 gap-1.5 mb-6">
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
        <span class="text-xs font-semibold px-2.5 py-1 rounded-full" :class="foodBadgeClass">
          {{ foodBadgeText }}
        </span>
      </div>
      <div class="bg-white/5 rounded-full h-2 mb-3 overflow-hidden">
        <div class="h-full rounded-full transition-all duration-700"
          :class="foodBarClass"
          :style="{ width: Math.min(foodUsedPct, 100) + '%' }" />
      </div>
      <div class="flex justify-between text-xs text-slate-500">
        <span>Terpakai: <span class="text-white font-medium">{{ formatCurrency(foodSpent) }}</span></span>
        <span>Alokasi: <span class="text-white font-medium">{{ formatCurrencyShort(foodAllocated) }}</span></span>
      </div>
    </div>

    <!-- Tomorrow preview -->
    <TomorrowPreview
      :tomorrow-summary="tomorrowSummary"
      :next-cycle-daily-budget="nextCycleDailyBudget"
      :tomorrow-is-new-cycle="tomorrowIsNewCycle"
      :tomorrow-label="tomorrowLabel"
      :loading="loadingTx"
    />

    <!-- Quick actions -->
    <div class="mb-6">
      <h2 class="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Aksi Cepat</h2>
      <div class="grid grid-cols-2 gap-2">
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

      <!-- Sudahi Hari Ini button -->
      <button v-if="canEndDay"
        @click="triggerEndOfDay"
        class="mt-3 w-full glass-card p-4 flex items-center gap-3 hover:border-emerald-500/30 hover:-translate-y-0.5 transition-all group text-left">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-amber-500/15">
          🌙
        </div>
        <div>
          <p class="font-semibold text-white text-sm group-hover:text-amber-300 transition-colors">Sudahi Hari Ini</p>
          <p class="text-slate-500 text-xs mt-0.5">Simpan sisa budget hari ini</p>
        </div>
      </button>
    </div>

    <!-- End-day modal -->
    <CarryoverModal
      :model-value="showEndDayModal"
      :total="endDayTotal"
      :choice="endDayAction"
      :loading="submittingEndDay"
      :error="endDayError"
      :yesterday-label="todayLabel"
      @update:model-value="showEndDayModal = $event"
      @update:choice="endDayAction = $event"
      @confirm="submitEndDay"
    />

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
        <div v-for="tx in todayTx" :key="tx.id ?? tx.transaction_id"
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

    <!-- Budget history chart -->
    <BudgetHistoryChart />

  </div>
</template>

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
  triggerEndOfDay, maybePromptEndDay, submitEndDay, undoEndDay, checkYesterdayCarryover,
} = useEndDay(todayStr, yesterdayStr, endDayChoice, totalRemaining, loadDashboard)

onMounted(async () => {
  checkReset()
  await loadDashboard()
  await checkYesterdayCarryover()
  maybePromptEndDay()
})
onActivated(async () => {
  await loadDashboard()
  maybePromptEndDay()
})
</script>
