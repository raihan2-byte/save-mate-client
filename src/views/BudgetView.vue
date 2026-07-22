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

<style scoped>
.bg-emerald-gradient {
  background: linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%);
}
</style>
