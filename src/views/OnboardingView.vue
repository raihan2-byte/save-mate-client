<template>
  <div class="min-h-screen flex items-center justify-center p-4"
    style="background: radial-gradient(ellipse 80% 60% at 50% -20%, rgba(16,185,129,0.15), transparent), #020617">

    <!-- Step indicator -->
    <div v-if="step < 5" class="fixed top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
      <div v-for="i in totalIndicatorSteps" :key="i"
        class="h-1.5 rounded-full transition-all duration-500"
        :class="i <= indicatorStep ? 'bg-emerald-500 w-8' : 'bg-white/15 w-4'" />
    </div>

    <div class="w-full max-w-lg pt-8">

      <!-- ═══ STEP 1: Gaji & Profil ═══ -->
      <Transition name="slide">
        <OnboardingStep1
          v-if="step === 1"
          :salary="salaryValue"
          :salary-display="salaryDisplay"
          :payday-day="s1.paydayDay"
          :purpose="s1.purpose"
          :purpose-custom="s1.purposeCustom"
          @update:salary-display="salaryDisplay = $event"
          @update:payday-day="s1.paydayDay = $event"
          @update:purpose="s1.purpose = $event"
          @update:purpose-custom="s1.purposeCustom = $event"
          @next="goNext"
        />
      </Transition>

      <!-- ═══ STEP 2: Mid-cycle Setup (only if mid-cycle) ═══ -->
      <Transition name="slide">
        <div v-if="step === 2" key="s2">
          <div class="text-center mb-6">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-3xl mx-auto mb-4">📅</div>
            <p class="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-1">Setup Periode Ini</p>
            <h1 class="text-2xl font-black text-white">Budget sampai gajian</h1>
            <p class="text-slate-400 text-sm mt-1">Atur keuanganmu untuk <span class="text-amber-300 font-semibold">{{ daysToNextPayday }} hari</span> ke depan</p>
          </div>

          <div class="space-y-4">
            <!-- Sisa uang -->
            <div class="glass-card p-5">
              <label class="block text-sm font-semibold text-white mb-3">💰 Sisa uangmu sekarang</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">Rp</span>
                <input v-model="currentBalanceDisplay" type="text" inputmode="numeric"
                  class="input-dark pl-10" placeholder="500.000" />
              </div>
              <p class="text-slate-500 text-xs mt-1.5">Total uang di rekening + dompet sekarang</p>
            </div>

            <!-- Pengeluaran pending -->
            <div class="glass-card p-5">
              <div class="flex items-center justify-between mb-3">
                <label class="text-sm font-semibold text-white">🏠 Ada yang belum dibayar sebelum gajian?</label>
              </div>
              <p class="text-slate-400 text-xs mb-4">Misal: kost, listrik, cicilan, dll. yang masih harus keluar sebelum tgl {{ s1.paydayDay }}</p>

              <div v-if="pendingItems.length > 0" class="space-y-2 mb-4">
                <div v-for="(item, idx) in pendingItems" :key="idx"
                  class="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div class="flex-1 min-w-0">
                    <p class="text-white text-sm font-medium truncate">{{ item.description }}</p>
                    <p class="text-red-400 text-xs font-semibold">{{ fmtCur(item.amount) }}</p>
                  </div>
                  <button @click="pendingItems.splice(idx, 1)" class="text-slate-600 hover:text-red-400 transition-colors">✕</button>
                </div>
                <div class="flex justify-between items-center px-1 pt-1 border-t border-white/10">
                  <span class="text-slate-400 text-xs">Total pending</span>
                  <span class="text-red-400 font-bold text-sm">{{ fmtCur(totalPending) }}</span>
                </div>
              </div>

              <div class="space-y-2">
                <input v-model="pendingForm.description" type="text" class="input-dark"
                  placeholder="Nama pengeluaran (kost, listrik...)" maxlength="60" />
                <div class="flex gap-2">
                  <div class="relative flex-1">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">Rp</span>
                    <input v-model="pendingAmountDisplay" type="text" inputmode="numeric"
                      class="input-dark pl-9" placeholder="0" />
                  </div>
                  <AppButton variant="outline" @click="pushPending" :disabled="!pendingFormValid">
                    + Tambah
                  </AppButton>
                </div>
              </div>

              <div v-if="currentBalanceValue > 0" class="mt-4 rounded-xl border px-4 py-3 flex items-center justify-between"
                :class="netBalance >= 0 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/10'">
                <span class="text-slate-400 text-sm">Sisa bersih untuk {{ daysToNextPayday }} hari</span>
                <span class="font-black text-lg" :class="netBalance >= 0 ? 'text-emerald-400' : 'text-red-400'">{{ fmtCur(Math.max(0, netBalance)) }}</span>
              </div>
            </div>

            <!-- Pilih mode interim -->
            <div class="glass-card p-5">
              <p class="text-white font-semibold text-sm mb-1">🎯 Pilih mode untuk {{ daysToNextPayday }} hari ini</p>
              <p class="text-slate-500 text-xs mb-4">Setelah gajian, mode ini akan reset ke pilihan utama kamu</p>
              <div class="space-y-2.5">
                <button v-for="opt in savingStrategies" :key="opt.type" type="button"
                  @click="s2.strategy = opt.type"
                  class="w-full text-left rounded-2xl border p-3.5 transition-all"
                  :class="s2.strategy === opt.type
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'">
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <span class="text-xl">{{ opt.icon }}</span>
                      <div>
                        <p class="font-bold text-white text-sm">{{ opt.label }}</p>
                        <p class="text-slate-500 text-xs">{{ opt.desc }}</p>
                      </div>
                    </div>
                    <div class="w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all"
                      :class="s2.strategy === opt.type ? 'border-amber-500 bg-amber-500' : 'border-slate-600'" />
                  </div>
                  <div v-if="currentBalanceValue > 0 && s2.strategy === opt.type" class="grid grid-cols-3 gap-2 mt-3">
                    <div class="bg-white/5 rounded-xl p-2 text-center">
                      <p class="text-[10px] text-slate-500 mb-0.5">Budget/hari</p>
                      <p class="font-black text-amber-400 text-sm">{{ fmtCurShort(calcMidCycle(opt.type).dailyFlexible) }}</p>
                    </div>
                    <div class="bg-white/5 rounded-xl p-2 text-center">
                      <p class="text-[10px] text-slate-500 mb-0.5">Makan/hari</p>
                      <p class="font-black text-white text-sm">{{ fmtCurShort(calcMidCycle(opt.type).dailyFood) }}</p>
                    </div>
                    <div class="bg-white/5 rounded-xl p-2 text-center">
                      <p class="text-[10px] text-slate-500 mb-0.5">Nabung</p>
                      <p class="font-black text-emerald-400 text-sm">{{ fmtCurShort(calcMidCycle(opt.type).savings) }}</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row gap-3">
              <AppButton variant="outline" class="flex-1" @click="step = 1">← Kembali</AppButton>
              <AppButton variant="primary" class="flex-1" :disabled="!step2Valid" @click="goToStep3">
                Lanjut → Pengeluaran Tetap
              </AppButton>
            </div>
          </div>
        </div>
      </Transition>

      <!-- ═══ STEP 3: Mandatory Expenses ═══ -->
      <Transition name="slide">
        <div v-if="step === 3" key="s3">
          <div class="text-center mb-6">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-3xl mx-auto mb-4">🏠</div>
            <p class="text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-1">{{ isMidCycle ? 'Langkah 3' : 'Langkah 2' }} dari {{ totalIndicatorSteps }}</p>
            <h1 class="text-2xl font-black text-white">Pengeluaran Wajib</h1>
            <p class="text-slate-400 text-sm mt-1">Biaya tetap yang keluar setiap bulan</p>
          </div>

          <OnboardingStep2
            :items="mandatoryItems"
            :salary="salaryValue"
            @update:items="mandatoryItems = $event"
          />

          <div class="flex flex-col sm:flex-row gap-3 mt-4">
            <AppButton variant="outline" class="flex-1" @click="step = isMidCycle ? 2 : 1">← Kembali</AppButton>
            <AppButton variant="primary" class="flex-1" :disabled="availableNegative" @click="step = 4">
              Lanjut → Strategi Menabung
            </AppButton>
          </div>
          <p class="text-center text-slate-600 text-xs mt-3">Pengeluaran wajib bisa ditambah belakangan</p>
        </div>
      </Transition>

      <!-- ═══ STEP 4: Saving Strategy ═══ -->
      <Transition name="slide">
        <div v-if="step === 4" key="s4">
          <div class="text-center mb-6">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-3xl mx-auto mb-4">🎯</div>
            <p class="text-violet-400 text-xs font-semibold uppercase tracking-widest mb-1">Langkah {{ totalIndicatorSteps }} dari {{ totalIndicatorSteps }}</p>
            <h1 class="text-2xl font-black text-white">Pilih Strategi Utama</h1>
            <p class="text-slate-400 text-sm mt-1">Untuk bulan-bulan ke depan setelah gajian</p>
          </div>

          <div class="glass-card p-4 mb-4 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-xl flex-shrink-0">💼</div>
            <div>
              <p class="text-slate-400 text-xs">Gaji - Pengeluaran Wajib = Tersedia</p>
              <p class="text-white font-black">{{ fmtCur(salaryValue) }} - {{ fmtCur(totalMandatory) }} = <span class="text-emerald-400">{{ fmtCur(available) }}</span></p>
            </div>
          </div>

          <OnboardingStep4
            :saving-type="s4.saving_type"
            @update:saving-type="s4.saving_type = $event"
          />

          <div class="flex flex-col sm:flex-row gap-3 mt-4">
            <AppButton variant="outline" class="flex-1" @click="step = 3">← Kembali</AppButton>
            <AppButton variant="primary" class="flex-1" :disabled="!s4.saving_type" @click="startCalc">
              ✨ Buat Rencana Budget!
            </AppButton>
          </div>
        </div>
      </Transition>

      <!-- ═══ STEP 5: Calculating Animation ═══ -->
      <Transition name="fade">
        <OnboardingStep5
          v-if="step === 5"
          :salary="salaryValue"
          :mandatory="totalMandatory"
          :saving-type="s4.saving_type"
          :region="s1.region"
          :loading="true"
          :error="calcError"
          :calc-reveal-count="calcRevealCount"
          :calc-phase-idx="calcPhaseIdx"
        />
      </Transition>

      <!-- ═══ STEP 6: Plan Ready! ═══ -->
      <Transition name="fade">
        <div v-if="step === 6" key="s6">
          <!-- Mid-cycle note -->
          <div v-if="isMidCycle" class="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 mb-4 flex items-start gap-3">
            <span class="text-xl flex-shrink-0">📅</span>
            <div>
              <p class="text-amber-300 text-sm font-bold">Mode: {{ savingStrategies.find(s => s.type === s2.strategy)?.label }} ({{ daysToNextPayday }} hari)</p>
              <p class="text-slate-400 text-xs mt-0.5">Setelah gajian tgl {{ s1.paydayDay }}, budget akan reset otomatis ke mode <span class="text-white font-medium">{{ savingStrategies.find(s => s.type === s4.saving_type)?.label }}</span> penuh.</p>
            </div>
          </div>

          <OnboardingStep6
            :plan="finalPlan"
            :mandatory="totalMandatory"
            @done="finish"
          />
        </div>
      </Transition>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useCurrencyInput } from '@/composables/useCurrencyInput'
import { SAVING_TYPES, FOOD_SPEND_PCT, LIFESTYLE_SPEND_PCT, DEFAULT_MONTH_DAYS } from '@/constants/budgetConfig'
import AppButton from '@/components/ui/AppButton.vue'
import OnboardingStep1 from '@/components/onboarding/OnboardingStep1.vue'
import OnboardingStep2 from '@/components/onboarding/OnboardingStep2.vue'
import OnboardingStep4 from '@/components/onboarding/OnboardingStep4.vue'
import OnboardingStep5 from '@/components/onboarding/OnboardingStep5.vue'
import OnboardingStep6 from '@/components/onboarding/OnboardingStep6.vue'
import type { MandatoryItem } from '@/components/onboarding/OnboardingStep2.vue'
import type { FinalPlan } from '@/components/onboarding/OnboardingStep6.vue'

const router = useRouter()
const auth = useAuthStore()

// ── Regions ──────────────────────────────────────────────────────────
const regions = ref<any[]>([])
const regionsLoading = ref(true)
api.get('/regions/').then(res => {
  const raw = res.data.data
  regions.value = Array.isArray(raw) ? raw : (raw ? [raw] : [])
}).catch(() => {}).finally(() => { regionsLoading.value = false })

// ── Currency inputs ──────────────────────────────────────────────────
const { displayValue: salaryDisplay, numericValue: salaryValue } = useCurrencyInput()
const { displayValue: currentBalanceDisplay, numericValue: currentBalanceValue } = useCurrencyInput()
const { displayValue: pendingAmountDisplay, numericValue: pendingAmountValue, reset: resetPendingAmount } = useCurrencyInput()

// ── Step state ───────────────────────────────────────────────────────
const step = ref(1)

// ── Step 1 ──────────────────────────────────────────────────────────
const s1 = ref({ region: '', purpose: '', purposeCustom: '', paydayDay: 25 })

const isMidCycle = computed(() => {
  const today = new Date().getDate()
  return s1.value.paydayDay > 0 && today !== s1.value.paydayDay
})

const daysToNextPayday = computed(() => {
  const now = new Date()
  const today = now.getDate()
  const payday = s1.value.paydayDay
  const sameMonth = today < payday
  const nextPayday = new Date(now.getFullYear(), now.getMonth() + (sameMonth ? 0 : 1), payday)
  return Math.max(1, Math.ceil((nextPayday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
})

const nextPaydayMonth = computed(() => {
  const now = new Date()
  const today = now.getDate()
  const payday = s1.value.paydayDay
  const sameMonth = today < payday
  return sameMonth ? now.getMonth() + 1 : (now.getMonth() + 1) % 12 + 1
})

const nextPaydayYear = computed(() => {
  const now = new Date()
  const today = now.getDate()
  const payday = s1.value.paydayDay
  const sameMonth = today < payday
  const isDecember = now.getMonth() === 11
  return (!sameMonth && isDecember) ? now.getFullYear() + 1 : now.getFullYear()
})

const midCycleSpansTwoMonths = computed(() => {
  if (!isMidCycle.value) return false
  const today = new Date().getDate()
  return today > s1.value.paydayDay
})

const daysRemainingCurrentMonth = computed(() => {
  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return lastDay - now.getDate() + 1
})

const purposeValue = computed(() =>
  s1.value.purpose === '__other__' ? s1.value.purposeCustom : s1.value.purpose
)

function goNext() {
  step.value = isMidCycle.value ? 2 : 3
}

// ── Step 2: Mid-cycle ────────────────────────────────────────────────
const s2 = ref({ strategy: '' })

interface PendingItem { description: string; amount: number }
const pendingItems = ref<PendingItem[]>([])
const pendingForm = ref({ description: '' })

const pendingFormValid = computed(() =>
  pendingForm.value.description.trim().length >= 2 && pendingAmountValue.value > 0
)

function pushPending() {
  if (!pendingFormValid.value) return
  pendingItems.value.push({ description: pendingForm.value.description.trim(), amount: pendingAmountValue.value })
  pendingForm.value.description = ''
  resetPendingAmount()
}

const totalPending = computed(() => pendingItems.value.reduce((s, i) => s + i.amount, 0))
const netBalance = computed(() => currentBalanceValue.value - totalPending.value)
const step2Valid = computed(() => currentBalanceValue.value > 0 && s2.value.strategy !== '')

// ── Step 3: Mandatory Expenses ───────────────────────────────────────
const mandatoryItems = ref<MandatoryItem[]>([])

function guessCategoryFromDescription(desc: string): string {
  const d = desc.toLowerCase()
  if (/kost|sewa|kontrakan|rumah|apartemen/.test(d)) return 'housing'
  if (/listrik|air|pam|wifi|internet|gas|token/.test(d)) return 'utilities'
  if (/ojek|motor|bensin|bbm|grab|gojek|bus|commuter|krl|toll|parkir/.test(d)) return 'transport'
  if (/netflix|spotify|icloud|youtube|langganan|subscription/.test(d)) return 'subscription'
  return 'other'
}

function goToStep3() {
  if (pendingItems.value.length > 0) {
    const existing = new Set(mandatoryItems.value.map(m => m.description.toLowerCase()))
    for (const p of pendingItems.value) {
      if (!existing.has(p.description.toLowerCase())) {
        mandatoryItems.value.push({
          description: p.description,
          amount: p.amount,
          category: guessCategoryFromDescription(p.description),
        })
      }
    }
  }
  step.value = 3
}

const totalMandatory = computed(() => mandatoryItems.value.reduce((s, i) => s + i.amount, 0))
const available = computed(() => salaryValue.value - totalMandatory.value)
const availableNegative = computed(() => available.value < 0)

// ── Step 4: Strategy ─────────────────────────────────────────────────
const s4 = ref({ saving_type: '' })

const savingStrategies = [
  {
    type: 'frugal',
    icon: '🧊',
    label: 'Frugal',
    desc: 'Hemat ketat — prioritas tabungan maksimal',
    savePct: SAVING_TYPES.frugal.save,
    spendPct: SAVING_TYPES.frugal.spend,
  },
  {
    type: 'recommendation',
    icon: '✅',
    label: 'Rekomendasi',
    desc: 'Seimbang — enjoy hidup & tetap nabung',
    savePct: SAVING_TYPES.recommendation.save,
    spendPct: SAVING_TYPES.recommendation.spend,
  },
  {
    type: 'normal',
    icon: '😊',
    label: 'Normal',
    desc: 'Fleksibel — santai, belanja lebih bebas',
    savePct: SAVING_TYPES.normal.save,
    spendPct: SAVING_TYPES.normal.spend,
  },
]

function calcFor(type: string) {
  const strat = SAVING_TYPES[type] ?? SAVING_TYPES.recommendation
  const avail = Math.max(0, available.value)
  const flexible = avail * strat.spend
  const savings = avail * strat.save
  return {
    savings: Math.round(savings),
    flexible: Math.round(flexible),
    dailyFlexible: Math.round(flexible / DEFAULT_MONTH_DAYS),
    dailySavings: Math.round(savings / DEFAULT_MONTH_DAYS),
    dailyFood: Math.round(flexible * FOOD_SPEND_PCT / DEFAULT_MONTH_DAYS),
  }
}

function calcMidCycle(type: string) {
  const strat = SAVING_TYPES[type] ?? SAVING_TYPES.recommendation
  const net = Math.max(0, netBalance.value)
  const days = daysToNextPayday.value
  const flexible = net * strat.spend
  const savings = net * strat.save
  return {
    savings: Math.round(savings),
    flexible: Math.round(flexible),
    dailyFlexible: Math.round(flexible / days),
    dailyFood: Math.round(flexible * FOOD_SPEND_PCT / days),
  }
}

// ── Step indicator ────────────────────────────────────────────────────
const totalIndicatorSteps = computed(() => isMidCycle.value ? 4 : 3)
const indicatorStep = computed(() => {
  if (step.value === 1) return 1
  if (step.value === 2) return 2
  if (step.value === 3) return isMidCycle.value ? 3 : 2
  if (step.value === 4) return isMidCycle.value ? 4 : 3
  return totalIndicatorSteps.value
})

// ── Step 5: Calculating animation ────────────────────────────────────
const calcRevealCount = ref(0)
const calcError = ref('')
const calcPhaseIdx = ref(0)

// ── Final plan (step 6) ───────────────────────────────────────────────
const finalPlan = ref<FinalPlan>({
  savings: 0,
  flexible: 0,
  dailySavings: 0,
  dailyFlexible: 0,
  breakdown: [],
})

async function startCalc() {
  if (!s4.value.saving_type) return
  step.value = 5
  calcRevealCount.value = 0
  calcPhaseIdx.value = 0
  calcError.value = ''

  const calcPhasesLength = 4
  const calcItemsLength = 7

  const revealInterval = setInterval(() => {
    calcRevealCount.value++
    if (calcRevealCount.value >= calcItemsLength) clearInterval(revealInterval)
  }, 420)

  const phaseInterval = setInterval(() => {
    calcPhaseIdx.value++
    if (calcPhaseIdx.value >= calcPhasesLength - 1) clearInterval(phaseInterval)
  }, 900)

  await sleep(2800)

  try {
    await api.post('/personal-data/', {
      salary: salaryValue.value,
      purpose_of_join_here: purposeValue.value,
      saving_type: s4.value.saving_type,
      payday_day: s1.value.paydayDay,
    })

    const now = new Date()
    const txDate = now.toISOString()
    for (const item of mandatoryItems.value) {
      try {
        await api.post('/mandatory-expenditure/', {
          category: item.category,
          amount: item.amount,
          description: item.description,
          transaction_date: txDate,
          for_month: isMidCycle.value ? nextPaydayMonth.value : now.getMonth() + 1,
          for_year: isMidCycle.value ? nextPaydayYear.value : now.getFullYear(),
        })
      } catch {}
    }

    const midCycleNet = Math.max(0, netBalance.value)
    if (isMidCycle.value && midCycleSpansTwoMonths.value) {
      const totalDays = daysToNextPayday.value
      const daysCurrentMonth = daysRemainingCurrentMonth.value
      const daysNextMonth = s1.value.paydayDay - 1
      const balanceCurrentMonth = midCycleNet * daysCurrentMonth / totalDays
      const balanceNextMonth = midCycleNet * daysNextMonth / totalDays

      await api.post('/budget-plan/', {
        for_month: now.getMonth() + 1,
        for_year: now.getFullYear(),
        saving_type: s2.value.strategy,
        region: s1.value.region,
        current_balance: balanceCurrentMonth,
        days_remaining: daysCurrentMonth,
        mandatory_already_paid: true,
        pending_mandatory: totalPending.value,
      })

      await api.post('/budget-plan/', {
        for_month: nextPaydayMonth.value,
        for_year: nextPaydayYear.value,
        saving_type: s2.value.strategy,
        region: s1.value.region,
        current_balance: balanceNextMonth,
        days_remaining: daysNextMonth,
        mandatory_already_paid: true,
        pending_mandatory: 0,
      })
    } else {
      await api.post('/budget-plan/', {
        for_month: isMidCycle.value ? nextPaydayMonth.value : now.getMonth() + 1,
        for_year: isMidCycle.value ? nextPaydayYear.value : now.getFullYear(),
        saving_type: isMidCycle.value ? s2.value.strategy : s4.value.saving_type,
        region: s1.value.region,
        ...(isMidCycle.value ? {
          current_balance: midCycleNet,
          days_remaining: daysToNextPayday.value,
          mandatory_already_paid: true,
          pending_mandatory: totalPending.value,
        } : {}),
      })
    }

    auth.hasPersonalData = true

    if (isMidCycle.value) {
      const mc = calcMidCycle(s2.value.strategy)
      finalPlan.value = {
        savings: mc.savings,
        flexible: mc.flexible,
        dailySavings: Math.round(mc.savings / daysToNextPayday.value),
        dailyFlexible: mc.dailyFlexible,
        breakdown: [
          { icon: '🍜', label: 'Makanan',  daily: mc.dailyFood, pct: Math.round(FOOD_SPEND_PCT * 100), color: 'text-white',       barColor: 'bg-emerald-400' },
          { icon: '🛍️', label: 'Lainnya', daily: Math.round(mc.flexible * LIFESTYLE_SPEND_PCT / daysToNextPayday.value), pct: Math.round(LIFESTYLE_SPEND_PCT * 100), color: 'text-cyan-400', barColor: 'bg-cyan-400' },
        ],
      }
    } else {
      const c = calcFor(s4.value.saving_type)
      finalPlan.value = {
        savings: c.savings,
        flexible: c.flexible,
        dailySavings: c.dailySavings,
        dailyFlexible: c.dailyFlexible,
        breakdown: [
          { icon: '🍜', label: 'Makanan',  daily: Math.round(c.flexible * FOOD_SPEND_PCT / DEFAULT_MONTH_DAYS), pct: 65, color: 'text-white',        barColor: 'bg-emerald-400' },
          { icon: '🎮', label: 'Hiburan',  daily: Math.round(c.flexible * LIFESTYLE_SPEND_PCT * 0.20 / DEFAULT_MONTH_DAYS), pct: 7,  color: 'text-cyan-400',   barColor: 'bg-cyan-400' },
          { icon: '🛍️', label: 'Belanja', daily: Math.round(c.flexible * LIFESTYLE_SPEND_PCT * 0.17 / DEFAULT_MONTH_DAYS), pct: 6,  color: 'text-violet-400', barColor: 'bg-violet-400' },
          { icon: '📦', label: 'Lainnya', daily: Math.round(c.flexible * LIFESTYLE_SPEND_PCT * 0.63 / DEFAULT_MONTH_DAYS), pct: 22, color: 'text-slate-300',  barColor: 'bg-slate-400' },
        ],
      }
    }

    await sleep(600)
    step.value = 6
  } catch (e: any) {
    calcError.value = e.response?.data?.errors ?? e.response?.data?.message ?? 'Gagal menyimpan. Coba lagi.'
    step.value = 4
  }
}

function finish() {
  router.push('/app')
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

function fmtCur(val: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Math.abs(val))
}

function fmtCurShort(val: number) {
  if (val >= 1_000_000) return 'Rp ' + (val / 1_000_000).toFixed(1).replace('.0', '') + 'jt'
  if (val >= 1_000) return 'Rp ' + (val / 1_000).toFixed(0) + 'rb'
  return 'Rp ' + val
}
</script>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: all 0.35s ease; }
.slide-enter-from { opacity: 0; transform: translateX(40px); }
.slide-leave-to   { opacity: 0; transform: translateX(-40px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }
</style>
