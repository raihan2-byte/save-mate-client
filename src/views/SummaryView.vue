<template>
  <div class="p-4 md:p-8 max-w-3xl mx-auto">

    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-black text-white">Ringkasan</h1>
        <p class="text-slate-500 text-sm mt-0.5">Laporan keuangan bulanan</p>
      </div>
      <div class="flex items-center gap-2 glass-card px-3 py-2">
        <button @click="prevMonth" class="text-slate-400 hover:text-white transition-colors px-1">◀</button>
        <span class="font-semibold text-white text-sm min-w-[110px] text-center">{{ monthLabel }}</span>
        <button @click="nextMonth" class="text-slate-400 hover:text-white transition-colors px-1">▶</button>
      </div>
    </div>

    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="h-32 rounded-2xl bg-white/5 animate-pulse" />
    </div>

    <div v-else-if="!summary" class="glass-card p-10 text-center">
      <p class="text-5xl mb-4">📊</p>
      <p class="text-white font-bold">Belum ada data bulan ini</p>
      <p class="text-slate-500 text-sm mt-1">Mulai catat transaksi untuk melihat ringkasan</p>
    </div>

    <div v-else class="space-y-5">
      <!-- Net balance hero -->
      <div class="relative overflow-hidden rounded-3xl p-6 border"
        :class="net >= 0 ? 'border-emerald-500/20' : 'border-red-500/20'"
        :style="net >= 0
          ? 'background: linear-gradient(135deg, #064e3b, #065f46)'
          : 'background: linear-gradient(135deg, #450a0a, #7f1d1d)'">
        <div class="pointer-events-none absolute -top-10 -right-10 w-52 h-52 blur-3xl rounded-full opacity-20"
          :class="net >= 0 ? 'bg-emerald-400' : 'bg-red-400'" />
        <div class="relative z-10">
          <p class="text-xs font-semibold uppercase tracking-widest mb-2" :class="net >= 0 ? 'text-emerald-300' : 'text-red-300'">
            {{ net >= 0 ? '✅ Keuangan Sehat' : '⚠️ Pengeluaran Melebihi Pemasukan' }}
          </p>
          <p class="text-4xl font-black text-white">{{ formatCurrency(Math.abs(net)) }}</p>
          <p class="text-sm mt-1" :class="net >= 0 ? 'text-emerald-200/70' : 'text-red-200/70'">
            {{ net >= 0 ? 'Sisa / berhasil dihemat' : 'Defisit bulan ini' }}
          </p>
        </div>
      </div>

      <!-- Income vs Expense -->
      <div class="grid grid-cols-2 gap-3">
        <div class="glass-card p-5">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-sm">⬆️</div>
            <p class="text-slate-400 text-xs font-medium">Pemasukan</p>
          </div>
          <p class="text-xl font-black text-emerald-400 tabular-nums">{{ formatCurrency(summary.total_income ?? 0) }}</p>
        </div>
        <div class="glass-card p-5">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-sm">⬇️</div>
            <p class="text-slate-400 text-xs font-medium">Pengeluaran</p>
          </div>
          <p class="text-xl font-black text-red-400 tabular-nums">{{ formatCurrency(summary.total_expense ?? summary.total_spent ?? 0) }}</p>
        </div>
      </div>

      <!-- Detail stats -->
      <div class="glass-card p-5">
        <h2 class="font-bold text-white mb-4">Detail Bulan Ini</h2>
        <div class="space-y-3">
          <div v-for="item in details" :key="item.label" class="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
            <span class="text-slate-400 text-sm flex items-center gap-2"><span>{{ item.icon }}</span>{{ item.label }}</span>
            <span class="font-semibold text-sm" :class="item.color">{{ item.display }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/api'

const now = new Date()
const currentMonth = ref(now.getMonth() + 1)
const currentYear = ref(now.getFullYear())
const summary = ref<any>(null)
const loading = ref(true)

const monthLabel = computed(() =>
  new Date(currentYear.value, currentMonth.value - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
)
const net = computed(() => summary.value?.net_balance ?? 0)

const details = computed(() => {
  const s = summary.value
  if (!s) return []
  const withinBudget = (s.total_spent ?? 0) <= (s.total_savings > 0 ? s.total_income - s.total_savings - s.total_mandatory : Infinity)
  return [
    { icon: '🍜', label: 'Pengeluaran Makan',     color: 'text-slate-300', display: formatCurrency(s.total_food_spent ?? 0) },
    { icon: '🛍️', label: 'Pengeluaran Lifestyle', color: 'text-slate-300', display: formatCurrency(s.total_lifestyle_spent ?? 0) },
    { icon: '🏠', label: 'Pengeluaran Wajib',     color: 'text-slate-300', display: formatCurrency(s.total_mandatory ?? 0) },
    { icon: '💰', label: 'Tabungan',               color: 'text-emerald-400', display: formatCurrency(s.total_savings ?? 0) },
    { icon: '📊', label: 'vs Budget',             color: withinBudget ? 'text-emerald-400' : 'text-red-400',
      display: withinBudget ? 'Dalam Budget ✅' : 'Melebihi Budget ⚠️' },
  ]
})

function formatCurrency(val: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

function prevMonth() {
  if (currentMonth.value === 1) { currentMonth.value = 12; currentYear.value-- }
  else currentMonth.value--
  loadSummary()
}
function nextMonth() {
  if (currentMonth.value === 12) { currentMonth.value = 1; currentYear.value++ }
  else currentMonth.value++
  loadSummary()
}

async function loadSummary() {
  loading.value = true
  try {
    const res = await api.get(`/summary/month/${currentMonth.value}/${currentYear.value}`)
    summary.value = res.data.data
  } catch { summary.value = null }
  finally { loading.value = false }
}

onMounted(loadSummary)
</script>
