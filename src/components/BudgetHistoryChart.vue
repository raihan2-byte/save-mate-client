<template>
  <div class="glass-card p-5 mt-6">
    <!-- Header -->
    <div class="flex items-start justify-between mb-5 gap-3">
      <div>
        <h2 class="font-black text-white text-base">Riwayat Budget Harian</h2>
        <p class="text-slate-500 text-xs mt-0.5">Sejak awal hingga sekarang</p>
      </div>
      <div class="flex flex-col items-end gap-1.5 flex-shrink-0">
        <div class="flex items-center gap-1.5">
          <button
            v-if="filteredRows.length > 0"
            @click="doExportExcel"
            class="flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            title="Export Excel"
          >
            <Download class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Excel</span>
          </button>
        </div>
        <div class="flex gap-1 bg-white/5 rounded-xl p-1">
          <button v-for="t in chartTypes" :key="t.value" @click="chartType = t.value"
            class="px-2 py-1.5 rounded-lg text-xs font-semibold transition-all"
            :class="chartType === t.value ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'">
            {{ t.icon }}
          </button>
        </div>
      </div>
    </div>

    <!-- Range filter -->
    <div class="mb-4">
      <!-- Preset chips -->
      <div class="flex gap-2 mb-3">
        <button v-for="p in presets" :key="p.days"
          @click="applyPreset(p.days)"
          class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border"
          :class="activePreset === p.days
            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            : 'bg-white/5 text-slate-400 hover:text-white border-transparent'">
          {{ p.label }}
        </button>
      </div>
      <!-- Custom date inputs -->
      <div class="grid grid-cols-2 gap-2">
        <div>
          <p class="text-[10px] text-slate-500 uppercase tracking-widest mb-1 ml-1">Dari</p>
          <input type="date" v-model="rangeFrom" :max="rangeTo"
            @change="activePreset = null"
            class="w-full rounded-xl border border-white/10 bg-white/5 text-slate-300 text-xs px-3 py-2 focus:outline-none focus:border-emerald-500/50" />
        </div>
        <div>
          <p class="text-[10px] text-slate-500 uppercase tracking-widest mb-1 ml-1">Sampai</p>
          <input type="date" v-model="rangeTo" :min="rangeFrom" :max="todayStr"
            @change="activePreset = null"
            class="w-full rounded-xl border border-white/10 bg-white/5 text-slate-300 text-xs px-3 py-2 focus:outline-none focus:border-emerald-500/50" />
        </div>
      </div>
      <p v-if="rangeError" class="text-red-400 text-[10px] mt-1 ml-1">{{ rangeError }}</p>
    </div>

    <!-- Stats summary -->
    <div class="grid grid-cols-3 gap-1.5 mb-5">
      <div class="bg-white/3 rounded-xl p-3 text-center">
        <p class="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Total Hari</p>
        <p class="font-black text-white text-sm">{{ filteredRows.length }}</p>
      </div>
      <div class="bg-emerald-500/8 rounded-xl p-3 text-center">
        <p class="text-[10px] text-emerald-500/70 uppercase tracking-widest mb-1">Hemat</p>
        <p class="font-black text-emerald-400 text-sm">{{ savedDays }} hari</p>
      </div>
      <div class="bg-red-500/8 rounded-xl p-3 text-center">
        <p class="text-[10px] text-red-500/70 uppercase tracking-widest mb-1">Over</p>
        <p class="font-black text-red-400 text-sm">{{ overDays }} hari</p>
      </div>
    </div>

    <!-- Loading -->
    <LoadingSkeleton v-if="loading" :rows="3" height="h-16" />

    <!-- Empty -->
    <EmptyState v-else-if="filteredRows.length === 0"
      icon="📊"
      title="Belum ada data budget"
      subtitle="Coba ubah rentang tanggal atau mulai catat transaksi" />

    <!-- Chart area -->
    <div v-else-if="rows.length > 0">

      <!-- BAR CHART -->
      <div v-if="chartType === 'bar'" class="relative h-48 flex items-end gap-px overflow-hidden">
        <div v-for="(row, i) in filteredRows" :key="row.date"
          class="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative"
          @mouseenter="hovered = i" @mouseleave="hovered = null"
          @click="openDetail(row.date)">
          <!-- Hover tooltip -->
          <div v-if="hovered === i"
            class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 border border-white/10 rounded-xl px-3 py-2 z-10 text-center whitespace-nowrap shadow-xl pointer-events-none">
            <p class="text-[10px] text-slate-400 mb-1">{{ formatDateShort(row.date) }}</p>
            <p class="text-xs font-bold" :class="row.delta >= 0 ? 'text-emerald-400' : 'text-red-400'">
              {{ row.delta >= 0 ? '+' : '-' }}{{ fmtRp(Math.abs(row.delta)) }}
            </p>
            <p class="text-[10px] text-slate-500">dari {{ fmtRp(row.total_allocated) }}</p>
            <p v-if="row.delta < 0" class="text-[9px] text-red-400/70 mt-0.5">Klik untuk detail →</p>
          </div>
          <!-- Bar -->
          <div class="w-full rounded-t transition-all duration-200 relative"
            :class="[
              row.delta >= 0 ? 'bg-emerald-500/70 group-hover:bg-emerald-400' : 'bg-red-500/70 group-hover:bg-red-400',
              row.delta < 0 ? 'ring-0 group-hover:ring-1 ring-red-400/50' : ''
            ]"
            :style="{ height: barHeight(row) + '%' }" />
        </div>
        <div class="absolute bottom-0 left-0 right-0 h-px bg-white/10" />
      </div>

      <!-- LINE / AREA CHART -->
      <div v-else-if="chartType === 'line'" class="relative h-48 overflow-hidden">
        <svg class="w-full h-full" :viewBox="`0 0 ${svgW} ${svgH}`" preserveAspectRatio="none">
          <line v-for="y in gridYs" :key="y" x1="0" :y1="y" :x2="svgW" :y2="y" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
          <line :x1="0" :y1="zeroY" :x2="svgW" :y2="zeroY" stroke="rgba(255,255,255,0.15)" stroke-width="1" stroke-dasharray="4,4"/>
          <path :d="areaAbove" fill="rgba(16,185,129,0.15)" />
          <path :d="areaBelow" fill="rgba(239,68,68,0.12)" />
          <path :d="linePath" fill="none" stroke="url(#lineGrad)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
              <stop offset="0%" stop-color="#10b981"/>
              <stop offset="100%" stop-color="#06b6d4"/>
            </linearGradient>
          </defs>
          <circle v-for="(pt, i) in linePoints" :key="i"
            :cx="pt.x" :cy="pt.y" r="3.5"
            :fill="lineRows[i]?.delta >= 0 ? '#10b981' : '#ef4444'"
            stroke="#0f172a" stroke-width="1.5"
            class="cursor-pointer"
            @mouseenter="hovered = i" @mouseleave="hovered = null"
            @click="openDetail(lineRows[i]?.date)" />
        </svg>
        <!-- Tooltip line -->
        <div v-if="hovered !== null"
          class="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-800 border border-white/10 rounded-xl px-3 py-2 z-10 text-center pointer-events-none shadow-xl">
          <p class="text-[10px] text-slate-400 mb-1">{{ formatDateShort(lineRows[hovered]?.date) }}</p>
          <p class="text-xs font-bold" :class="(lineRows[hovered]?.delta ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'">
            {{ (lineRows[hovered]?.delta ?? 0) >= 0 ? '+' : '-' }}{{ fmtRp(Math.abs(lineRows[hovered]?.delta ?? 0)) }}
          </p>
          <p v-if="(lineRows[hovered]?.delta ?? 0) < 0" class="text-[9px] text-red-400/70 mt-0.5">Klik untuk detail</p>
        </div>
      </div>

      <!-- DONUT CHART -->
      <div v-else-if="chartType === 'donut'" class="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div class="relative w-40 h-40 flex-shrink-0 mx-auto">
          <svg viewBox="0 0 100 100" class="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="16"/>
            <circle cx="50" cy="50" r="38" fill="none"
              stroke="#10b981" stroke-width="16" stroke-linecap="round"
              :stroke-dasharray="`${savedArc} ${238 - savedArc}`"
              stroke-dashoffset="0" style="transition: stroke-dasharray 0.8s ease" />
            <circle cx="50" cy="50" r="38" fill="none"
              stroke="#ef4444" stroke-width="16" stroke-linecap="round"
              :stroke-dasharray="`${overArc} ${238 - overArc}`"
              :stroke-dashoffset="`${-(savedArc)}`"
              style="transition: stroke-dasharray 0.8s ease" />
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <p class="font-black text-white text-lg leading-none">{{ Math.round(savedPct) }}%</p>
            <p class="text-emerald-400 text-[10px] mt-0.5">Hemat</p>
          </div>
        </div>
        <div class="flex flex-col gap-4 flex-1">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <div class="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
              <p class="text-slate-300 text-sm font-semibold">Hari Hemat</p>
            </div>
            <p class="font-black text-emerald-400 text-lg">{{ savedDays }} hari</p>
            <p class="text-slate-500 text-xs">Total hemat {{ fmtRp(totalSaved) }}</p>
          </div>
          <div>
            <div class="flex items-center gap-2 mb-1">
              <div class="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
              <p class="text-slate-300 text-sm font-semibold">Hari Over</p>
            </div>
            <p class="font-black text-red-400 text-lg">{{ overDays }} hari</p>
            <p class="text-slate-500 text-xs">Total lebih {{ fmtRp(Math.abs(totalOver)) }}</p>
          </div>
        </div>
      </div>

      <!-- X-axis (bar only) -->
      <div v-if="chartType === 'bar'" class="flex mt-2 overflow-hidden">
        <div v-for="(row, i) in filteredRows" :key="row.date" class="flex-1 text-center">
          <p v-if="i === 0 || i === filteredRows.length - 1 || i % labelStep === 0"
            class="text-[9px] text-slate-600 truncate">{{ formatDateShort(row.date) }}</p>
        </div>
      </div>

      <!-- Net total banner -->
      <div class="mt-4 rounded-xl p-3 flex items-center justify-between"
        :class="netDelta >= 0 ? 'bg-emerald-500/8 border border-emerald-500/15' : 'bg-red-500/8 border border-red-500/15'">
        <p class="text-xs" :class="netDelta >= 0 ? 'text-emerald-400' : 'text-red-400'">
          {{ netDelta >= 0 ? '🎉 Total hemat bersih' : '⚠️ Total over budget bersih' }}
        </p>
        <p class="font-black text-sm" :class="netDelta >= 0 ? 'text-emerald-400' : 'text-red-400'">
          {{ netDelta >= 0 ? '+' : '-' }}{{ fmtRp(Math.abs(netDelta)) }}
        </p>
      </div>
    </div>
  </div>

  <!-- ── Detail modal ───────────────────────────────────────────────────── -->
  <ModalWrapper v-model="showDetail" max-width="max-w-sm">
    <template v-if="detail">
      <!-- Title -->
      <div class="flex items-center gap-3 mb-5">
        <div class="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          :class="isOverDay ? 'bg-red-500/15' : 'bg-emerald-500/15'">
          {{ isOverDay ? '⚠️' : '✅' }}
        </div>
        <div>
          <p class="font-black text-white text-base">{{ formatDateFull(detail.date) }}</p>
          <p class="text-xs mt-0.5" :class="isOverDay ? 'text-red-400' : 'text-emerald-400'">
            {{ isOverDay ? 'Over budget' : 'Hemat' }}
            {{ isOverDay ? '-' : '+' }}{{ fmtRp(Math.abs(detailDelta)) }}
          </p>
        </div>
        <button @click="showDetail = false" class="ml-auto w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors text-sm">✕</button>
      </div>

      <!-- Summary row -->
      <div class="grid grid-cols-2 gap-2 mb-4">
        <div class="bg-white/5 rounded-xl p-3">
          <p class="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Budget</p>
          <p class="font-bold text-white text-sm">{{ detailLoading ? '—' : fmtRp(detailTotalBudget) }}</p>
        </div>
        <div class="rounded-xl p-3" :class="isOverDay ? 'bg-red-500/10' : 'bg-emerald-500/10'">
          <p class="text-[10px] uppercase tracking-widest mb-1" :class="isOverDay ? 'text-red-400/70' : 'text-emerald-400/70'">Terpakai</p>
          <p class="font-bold text-sm" :class="isOverDay ? 'text-red-400' : 'text-emerald-400'">{{ detailLoading ? '—' : fmtRp(detailTotalSpent) }}</p>
        </div>
      </div>

      <!-- Per-category breakdown -->
      <LoadingSkeleton v-if="detailLoading" :rows="3" height="h-10" />
      <div v-else-if="detailCategories.length" class="space-y-2">
        <p class="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Rincian per Kategori</p>
        <div v-for="cat in detailCategories" :key="cat.category"
          class="flex items-center gap-3 bg-white/3 rounded-xl px-3 py-2.5">
          <span class="text-lg flex-shrink-0">{{ catEmoji(cat.category) }}</span>
          <div class="flex-1 min-w-0">
            <p class="text-white text-xs font-semibold">{{ catLabel(cat.category) }}</p>
            <!-- progress bar -->
            <div class="mt-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
              <div class="h-full rounded-full transition-all"
                :class="cat.over ? 'bg-red-400' : 'bg-emerald-400'"
                :style="{ width: Math.min(cat.pct, 100) + '%' }" />
            </div>
          </div>
          <div class="text-right flex-shrink-0">
            <p class="text-xs font-bold" :class="cat.over ? 'text-red-400' : 'text-white'">{{ fmtRp(cat.actual_spent) }}</p>
            <p class="text-[10px] text-slate-500">/ {{ fmtRp(cat.effective) }}</p>
          </div>
        </div>
      </div>
    </template>
  </ModalWrapper>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import * as XLSX from 'xlsx'
import { Download } from 'lucide-vue-next'
import api from '@/api'
import { formatRupiah, toLocaleDateStr, addDays } from '@/utils/formatting'
import { CATEGORIES } from '@/constants/categories'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import ModalWrapper from '@/components/ui/ModalWrapper.vue'

interface HistoryRow {
  date: string
  total_allocated: number
  total_spent: number
  delta: number
}

interface TrackerItem {
  category: string
  allocated_amount: number
  actual_spent: number
  carryover_in: number
}

const loading = ref(true)
const rows = ref<HistoryRow[]>([])
const hovered = ref<number | null>(null)
const chartType = ref<'bar' | 'line' | 'donut'>('bar')
const showDetail = ref(false)

const chartTypes = [
  { value: 'bar'   as const, icon: '▊' },
  { value: 'line'  as const, icon: '〜' },
  { value: 'donut' as const, icon: '◉' },
]

// ── Range filter ──────────────────────────────────────────────────────────────

const todayStr   = toLocaleDateStr(new Date())
const presets    = [
  { label: '7 Hari',  days: 7  },
  { label: '14 Hari', days: 14 },
  { label: '30 Hari', days: 30 },
]
const activePreset = ref<number | null>(7)
const rangeFrom    = ref(addDays(todayStr, -6))
const rangeTo      = ref(todayStr)

const rangeError = computed(() => {
  if (!rangeFrom.value || !rangeTo.value) return ''
  const diff = daysBetween(rangeFrom.value, rangeTo.value)
  if (diff < 0) return 'Tanggal awal harus sebelum tanggal akhir'
  if (diff > 29) return 'Maksimal 30 hari'
  return ''
})

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

function applyPreset(days: number) {
  activePreset.value = days
  rangeTo.value   = todayStr
  rangeFrom.value = addDays(todayStr, -(days - 1))
}

const filteredRows = computed(() => {
  if (rangeError.value) return rows.value.slice(-7)
  return rows.value.filter(r => r.date >= rangeFrom.value && r.date <= rangeTo.value)
})

// Detail modal
const detail = ref<HistoryRow | null>(null)
const detailLoading = ref(false)
const detailCategories = ref<{ category: string; actual_spent: number; effective: number; pct: number; over: boolean }[]>([])
const detailTotalBudget = ref(0)
const detailTotalSpent = ref(0)

const isOverDay = computed(() => detailTotalSpent.value > detailTotalBudget.value)
const detailDelta = computed(() => detailTotalBudget.value - detailTotalSpent.value)

function fmtRp(val: number): string {
  return formatRupiah(val)
}

onMounted(async () => {
  try {
    const res = await api.get('/daily-budget/history')
    rows.value = res.data?.data ?? []
  } catch {
    rows.value = []
  } finally {
    loading.value = false
  }
})

async function openDetail(date?: string) {
  if (!date) return
  const row = rows.value.find(r => r.date === date)
  if (!row) return
  detail.value = row
  showDetail.value = true
  detailLoading.value = true
  detailCategories.value = []
  detailTotalBudget.value = 0
  detailTotalSpent.value = 0
  try {
    const res = await api.get(`/daily-budget/${date}`)
    const data = res.data?.data
    // Pakai daily_budget (total semua kategori), bukan sum tracker yang mungkin tidak lengkap
    detailTotalBudget.value = data?.daily_budget ?? data?.total_allocated ?? 0
    detailTotalSpent.value  = data?.total_spent ?? 0
    const budgets: TrackerItem[] = data?.budgets ?? []
    detailCategories.value = budgets
      .map(b => {
        const effective = b.allocated_amount + b.carryover_in
        return {
          category: b.category,
          actual_spent: b.actual_spent,
          effective,
          pct: effective > 0 ? (b.actual_spent / effective) * 100 : 0,
          over: b.actual_spent > effective,
        }
      })
      .sort((a, b) => b.actual_spent - a.actual_spent)
  } catch {
    detailCategories.value = []
  } finally {
    detailLoading.value = false
  }
}

function catEmoji(cat: string): string {
  return CATEGORIES[cat]?.emoji ?? '💸'
}
function catLabel(cat: string): string {
  return CATEGORIES[cat]?.label ?? cat
}

// ── Derived ───────────────────────────────────────────────────────────────────

const labelStep = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / 5)))

const savedDays  = computed(() => filteredRows.value.filter(r => r.delta >= 0).length)
const overDays   = computed(() => filteredRows.value.filter(r => r.delta < 0).length)
const totalSaved = computed(() => filteredRows.value.filter(r => r.delta > 0).reduce((s, r) => s + r.delta, 0))
const totalOver  = computed(() => filteredRows.value.filter(r => r.delta < 0).reduce((s, r) => s + r.delta, 0))
const netDelta   = computed(() => filteredRows.value.reduce((s, r) => s + r.delta, 0))
const savedPct   = computed(() => filteredRows.value.length ? (savedDays.value / filteredRows.value.length) * 100 : 0)

// ── Bar ───────────────────────────────────────────────────────────────────────

const maxAbsDelta = computed(() => Math.max(...filteredRows.value.map(r => Math.abs(r.delta)), 1))

function barHeight(row: HistoryRow): number {
  return Math.max((Math.abs(row.delta) / maxAbsDelta.value) * 90, 4)
}

// ── Line SVG ──────────────────────────────────────────────────────────────────

const svgW = 500
const svgH = 120
const pad  = 4

const lineRows = computed(() => filteredRows.value)

const linePoints = computed(() => {
  const n = lineRows.value.length
  if (n === 0) return []
  const maxAbs = Math.max(...lineRows.value.map(r => Math.abs(r.delta)), 1)
  return lineRows.value.map((row, i) => ({
    x: pad + (i / Math.max(n - 1, 1)) * (svgW - pad * 2),
    y: svgH / 2 - (row.delta / maxAbs) * (svgH / 2 - pad),
  }))
})

const zeroY  = computed(() => svgH / 2)
const gridYs = computed(() => [svgH * 0.1, svgH * 0.5, svgH * 0.9])

const linePath = computed(() => {
  const pts = linePoints.value
  if (pts.length === 0) return ''
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const cpx = (pts[i - 1].x + pts[i].x) / 2
    d += ` C ${cpx} ${pts[i - 1].y} ${cpx} ${pts[i].y} ${pts[i].x} ${pts[i].y}`
  }
  return d
})

const areaAbove = computed(() => {
  const pts = linePoints.value
  if (!pts.length) return ''
  const z = zeroY.value
  let d = `M ${pts[0].x} ${z} L ${pts[0].x} ${Math.min(pts[0].y, z)}`
  for (let i = 1; i < pts.length; i++) {
    const cpx = (pts[i - 1].x + pts[i].x) / 2
    d += ` C ${cpx} ${Math.min(pts[i - 1].y, z)} ${cpx} ${Math.min(pts[i].y, z)} ${pts[i].x} ${Math.min(pts[i].y, z)}`
  }
  return d + ` L ${pts[pts.length - 1].x} ${z} Z`
})

const areaBelow = computed(() => {
  const pts = linePoints.value
  if (!pts.length) return ''
  const z = zeroY.value
  let d = `M ${pts[0].x} ${z} L ${pts[0].x} ${Math.max(pts[0].y, z)}`
  for (let i = 1; i < pts.length; i++) {
    const cpx = (pts[i - 1].x + pts[i].x) / 2
    d += ` C ${cpx} ${Math.max(pts[i - 1].y, z)} ${cpx} ${Math.max(pts[i].y, z)} ${pts[i].x} ${Math.max(pts[i].y, z)}`
  }
  return d + ` L ${pts[pts.length - 1].x} ${z} Z`
})

// ── Donut ─────────────────────────────────────────────────────────────────────

const circumference = 238
const savedArc = computed(() => (savedPct.value / 100) * circumference)
const overArc  = computed(() => ((100 - savedPct.value) / 100) * circumference)

// ── Export ────────────────────────────────────────────────────────────────────

function doExportExcel() {
  const rows_data = filteredRows.value.map(r => ({
    'Tanggal': r.date,
    'Budget (Rp)': r.total_allocated,
    'Terpakai (Rp)': r.total_spent,
    'Selisih (Rp)': r.delta,
    'Status': r.delta >= 0 ? 'Hemat' : 'Over',
  }))

  const ws = XLSX.utils.json_to_sheet(rows_data)
  ws['!cols'] = [{ wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 10 }]

  // Apply number format (#,##0) to numeric columns B, C, D for all data rows
  const numFmt = '#,##0'
  const numCols = ['B', 'C', 'D']
  for (let i = 2; i <= rows_data.length + 1; i++) {
    for (const col of numCols) {
      const cell = ws[`${col}${i}`]
      if (cell) cell.z = numFmt
    }
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Budget')

  const label = `${rangeFrom.value}_sd_${rangeTo.value}`
  XLSX.writeFile(wb, `riwayat_budget_${label}.xlsx`)
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function formatDateShort(s?: string): string {
  if (!s) return ''
  return parseDate(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}
function formatDateFull(s?: string): string {
  if (!s) return ''
  return parseDate(s).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
