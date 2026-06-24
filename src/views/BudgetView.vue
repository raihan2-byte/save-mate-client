<template>
  <div class="p-4 md:p-8 max-w-3xl mx-auto">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-black text-white">Budget Plan</h1>
        <p class="text-slate-500 text-sm mt-0.5">Rencana keuangan bulanan</p>
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

    <!-- Empty state -->
    <div v-else-if="!budget" class="glass-card p-10 text-center">
      <p class="text-5xl mb-4">📊</p>
      <p class="text-white font-bold text-lg">Budget bulan ini belum dibuat</p>
      <p class="text-slate-500 text-sm mt-1 mb-6">Buat budget berdasarkan data keuanganmu</p>
      <button @click="showGenModal = true"
        class="btn-emerald mx-auto text-sm"
        style="box-shadow: 0 0 20px rgba(16,185,129,0.3)">
        ✨ Buat Budget Otomatis
      </button>
    </div>

    <div v-else class="space-y-5">
      <!-- Hero card -->
      <div class="relative overflow-hidden rounded-3xl p-6 border border-emerald-500/20"
        style="background: linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)">
        <div class="pointer-events-none absolute -top-10 -right-10 w-52 h-52 bg-emerald-400/15 blur-3xl rounded-full" />
        <div class="relative z-10">
          <p class="text-emerald-300 text-xs font-semibold uppercase tracking-widest">Total Budget Bulanan</p>
          <p class="text-4xl font-black text-white mt-2">{{ formatCurrency(budget.total_income ?? 0) }}</p>
          <div class="grid grid-cols-3 gap-3 mt-5">
            <div v-for="stat in budgetStats" :key="stat.label" class="bg-white/10 rounded-xl p-3 text-center backdrop-blur">
              <p class="font-black text-white text-base">{{ formatCurrency(stat.value) }}</p>
              <p class="text-emerald-200/60 text-[10px] mt-0.5">{{ stat.label }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Breakdown -->
      <div class="glass-card p-5">
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
      </div>

      <!-- Daily budget highlight -->
      <div class="glass-card p-5 flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-2xl flex-shrink-0">📅</div>
        <div>
          <p class="text-slate-400 text-xs">Budget harian yang tersedia</p>
          <p class="text-2xl font-black text-emerald-400">{{ formatCurrency(budget.daily_budget ?? 0) }}</p>
          <p class="text-slate-500 text-xs mt-0.5">per hari sepanjang bulan ini</p>
        </div>
      </div>
    </div>

    <!-- Generate budget modal -->
    <Transition name="modal">
      <div v-if="showGenModal" class="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" @click.self="showGenModal = false">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showGenModal = false" />
        <div class="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 z-10">
          <div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5 md:hidden" />
          <div class="flex items-center justify-between mb-6">
            <h2 class="font-black text-white text-lg">Buat Budget</h2>
            <button @click="showGenModal = false" class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400">✕</button>
          </div>
          <form @submit.prevent="generateBudget" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1.5">Gaya Menabung</label>
              <select v-model="genForm.saving_type" class="input-dark" required>
                <option value="" disabled>Pilih gaya</option>
                <option value="frugal">🧊 Frugal — Hemat ketat</option>
                <option value="recommendation">✅ Rekomendasi — Seimbang</option>
                <option value="normal">😊 Normal — Santai</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1.5">Wilayah / Kota</label>
              <input v-model="genForm.region" type="text" class="input-dark" placeholder="Jakarta, Bandung, dll." required />
            </div>
            <div v-if="genError" class="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">{{ genError }}</div>
            <div class="flex gap-3 pt-1">
              <button type="button" @click="showGenModal = false" class="btn-secondary flex-1">Batal</button>
              <button type="submit" :disabled="generating"
                class="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-all disabled:opacity-50">
                {{ generating ? 'Membuat...' : '✨ Buat' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/api'

const now = new Date()
const currentMonth = ref(now.getMonth() + 1)
const currentYear = ref(now.getFullYear())
const budget = ref<any>(null)
const loading = ref(true)
const generating = ref(false)
const showGenModal = ref(false)
const genForm = ref({ saving_type: '', region: '' })
const genError = ref('')

const monthLabel = computed(() =>
  new Date(currentYear.value, currentMonth.value - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
)

const budgetStats = computed(() => [
  { label: 'Per Hari', value: budget.value?.daily_budget ?? 0 },
  { label: 'Wajib', value: budget.value?.total_mandatory ?? 0 },
  { label: 'Tabungan', value: budget.value?.savings_amount ?? 0 },
])

const breakdown = computed(() => [
  { icon: '🏠', label: 'Pengeluaran Wajib', value: budget.value?.total_mandatory ?? 0,                                          color: 'bg-red-400' },
  { icon: '🍜', label: 'Kebutuhan Makan',   value: budget.value?.food_amount ?? 0,                                              color: 'bg-cyan-400' },
  { icon: '🛍️', label: 'Gaya Hidup',        value: budget.value?.lifestyle_amount ?? 0,                                        color: 'bg-violet-400' },
  { icon: '💰', label: 'Tabungan',          value: budget.value?.savings_amount ?? 0,                                          color: 'bg-emerald-400' },
])

function pct(val: number) {
  const total = budget.value?.total_income ?? 1
  return Math.min((val / total) * 100, 100).toFixed(1)
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

function prevMonth() {
  if (currentMonth.value === 1) { currentMonth.value = 12; currentYear.value-- }
  else currentMonth.value--
  loadBudget()
}
function nextMonth() {
  if (currentMonth.value === 12) { currentMonth.value = 1; currentYear.value++ }
  else currentMonth.value++
  loadBudget()
}

async function loadBudget() {
  loading.value = true
  try {
    const res = await api.get(`/budget-plan/${currentMonth.value}/${currentYear.value}`)
    budget.value = res.data.data
  } catch { budget.value = null }
  finally { loading.value = false }
}

async function generateBudget() {
  generating.value = true; genError.value = ''
  try {
    await api.post('/budget-plan/', {
      for_month: currentMonth.value,
      for_year: currentYear.value,
      saving_type: genForm.value.saving_type,
      region: genForm.value.region,
    })
    showGenModal.value = false
    await loadBudget()
  } catch (e: any) {
    genError.value = e.response?.data?.errors ?? e.response?.data?.message ?? 'Gagal membuat budget'
  } finally { generating.value = false }
}

onMounted(loadBudget)
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
