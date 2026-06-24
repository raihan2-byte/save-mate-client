<template>
  <div class="min-h-screen flex items-center justify-center p-4"
    style="background: radial-gradient(ellipse 80% 60% at 50% -20%, rgba(16,185,129,0.15), transparent), #020617">

    <!-- Step indicator -->
    <div v-if="step < 4" class="fixed top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
      <div v-for="i in 3" :key="i"
        class="h-1.5 rounded-full transition-all duration-500"
        :class="i <= step ? 'bg-emerald-500 w-8' : 'bg-white/15 w-4'" />
    </div>

    <div class="w-full max-w-lg pt-8">

      <!-- ═══ STEP 1: Gaji & Profil ═══ -->
      <Transition name="slide">
        <div v-if="step === 1" key="s1">
          <div class="text-center mb-8">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-3xl mx-auto mb-4"
              style="box-shadow: 0 0 40px rgba(16,185,129,0.35)">💰</div>
            <p class="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-1">Langkah 1 dari 3</p>
            <h1 class="text-2xl font-black text-white">Berapa penghasilanmu?</h1>
            <p class="text-slate-400 text-sm mt-1">Ini jadi dasar perhitungan budget harianmu</p>
          </div>

          <div class="glass-card p-6 space-y-5">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1.5">Gaji / Penghasilan Bulanan</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">Rp</span>
                <input v-model="salaryDisplay" type="text" inputmode="numeric"
                  class="input-dark pl-10" placeholder="5.000.000" />
              </div>
              <p class="text-slate-600 text-xs mt-1">Masukkan gaji bersih atau total penghasilan tetap per bulan</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1.5">Kota / Wilayah Tinggal</label>
              <div v-if="regionsLoading" class="input-dark flex items-center gap-2 text-slate-500 text-sm">
                <span class="w-3 h-3 rounded-full border-2 border-slate-500 border-t-transparent animate-spin flex-shrink-0" />
                Memuat daftar kota...
              </div>
              <select v-else v-model="s1.region" class="input-dark">
                <option value="" disabled>Pilih kota/wilayah...</option>
                <option v-for="r in regions" :key="r.region_id" :value="r.region_name">
                  {{ r.region_name }}
                </option>
              </select>
              <p class="text-slate-600 text-xs mt-1">Digunakan sebagai referensi baseline biaya hidup</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Tujuan Pakai CipuyWallet</label>
              <div class="grid grid-cols-2 gap-2">
                <button v-for="opt in purposeOptions" :key="opt.value" type="button"
                  @click="selectPurpose(opt.value)"
                  class="text-left px-3 py-2.5 rounded-xl border text-sm transition-all"
                  :class="s1.purpose === opt.value
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'">
                  <span class="block text-base mb-0.5">{{ opt.icon }}</span>
                  {{ opt.label }}
                </button>
              </div>
              <input v-if="s1.purpose === '__other__'" v-model="s1.purposeCustom" type="text"
                maxlength="50" class="input-dark mt-2" placeholder="Ceritakan tujuanmu..." />
            </div>

            <button @click="goStep2" :disabled="!step1Valid"
              class="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all disabled:opacity-40"
              style="background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 0 30px rgba(16,185,129,0.3)">
              Lanjut → Pengeluaran Wajib
            </button>
          </div>
        </div>
      </Transition>

      <!-- ═══ STEP 2: Mandatory Expenses ═══ -->
      <Transition name="slide">
        <div v-if="step === 2" key="s2">
          <div class="text-center mb-6">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-3xl mx-auto mb-4">🏠</div>
            <p class="text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-1">Langkah 2 dari 3</p>
            <h1 class="text-2xl font-black text-white">Pengeluaran Wajib</h1>
            <p class="text-slate-400 text-sm mt-1">Input biaya tetap yang pasti keluar setiap bulan</p>
          </div>

          <div class="glass-card p-5 mb-4">
            <!-- Expense list -->
            <div v-if="mandatoryItems.length === 0" class="text-center py-6 text-slate-500 text-sm">
              Belum ada pengeluaran wajib. Tap tombol di bawah untuk tambah.
            </div>
            <div v-else class="space-y-2 mb-4">
              <div v-for="(item, idx) in mandatoryItems" :key="idx"
                class="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <span class="text-xl flex-shrink-0">{{ mandatoryCatMeta[item.category]?.icon ?? '📦' }}</span>
                <div class="flex-1 min-w-0">
                  <p class="text-white text-sm font-medium truncate">{{ item.description }}</p>
                  <p class="text-slate-500 text-xs">{{ mandatoryCatMeta[item.category]?.label }}</p>
                </div>
                <span class="text-emerald-400 font-bold text-sm tabular-nums flex-shrink-0">{{ fmtCur(item.amount) }}</span>
                <button @click="mandatoryItems.splice(idx, 1)" class="text-slate-600 hover:text-red-400 transition-colors ml-1">✕</button>
              </div>
            </div>

            <!-- Total -->
            <div class="flex justify-between items-center px-1 py-2 border-t border-white/10 mt-2">
              <span class="text-slate-400 text-sm">Total Wajib</span>
              <span class="font-black" :class="availableNegative ? 'text-red-400' : 'text-white'">{{ fmtCur(totalMandatory) }}</span>
            </div>
            <div class="flex justify-between items-center px-1 pb-1">
              <span class="text-slate-500 text-xs">Sisa untuk dikelola</span>
              <span class="font-bold text-sm" :class="availableNegative ? 'text-red-400' : 'text-emerald-400'">{{ fmtCur(available) }}</span>
            </div>
            <!-- Negative warning -->
            <div v-if="availableNegative" class="mt-3 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <span class="text-base flex-shrink-0">🚫</span>
              <p class="text-red-300 text-xs">Pengeluaran wajib melebihi gaji. Hapus atau kurangi beberapa item agar budget tetap positif.</p>
            </div>
          </div>

          <!-- Add item form -->
          <div class="glass-card p-5 mb-4">
            <p class="text-white font-semibold text-sm mb-3">＋ Tambah Pengeluaran Wajib</p>
            <div class="space-y-3">
              <div class="grid grid-cols-3 gap-2">
                <button v-for="cat in mandatoryCategories" :key="cat.value" type="button"
                  @click="addForm.category = cat.value"
                  class="flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-xs transition-all"
                  :class="addForm.category === cat.value
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'">
                  <span class="text-base">{{ cat.icon }}</span>
                  {{ cat.label }}
                </button>
              </div>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">Rp</span>
                <input v-model="addAmountDisplay" type="text" inputmode="numeric"
                  class="input-dark pl-10" placeholder="0" />
              </div>
              <input v-model="addForm.description" type="text" class="input-dark"
                placeholder="Kost, ojek bulanan, WiFi, dll." maxlength="100" />
              <p v-if="addAmountValue > 0 && (totalMandatory + addAmountValue) >= salaryValue" class="text-red-400 text-xs">
                ⚠️ Akan melebihi gaji (sisa: {{ fmtCur(salaryValue - totalMandatory) }})
              </p>
              <button @click="pushMandatory"
                :disabled="!addFormValid || (totalMandatory + addAmountValue) >= salaryValue"
                class="w-full py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold text-sm hover:bg-emerald-500/30 transition-all disabled:opacity-40">
                Tambah
              </button>
            </div>
          </div>

          <div class="flex gap-3">
            <button @click="step = 1" class="btn-secondary flex-1">← Kembali</button>
            <button @click="step = 3" :disabled="availableNegative"
              class="flex-1 py-3 rounded-2xl font-bold text-white text-sm transition-all disabled:opacity-40"
              style="background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 0 20px rgba(16,185,129,0.25)">
              Lanjut → Strategi Menabung
            </button>
          </div>
          <p class="text-center text-slate-600 text-xs mt-3">Pengeluaran wajib bisa ditambah belakangan</p>
        </div>
      </Transition>

      <!-- ═══ STEP 3: Saving Strategy ═══ -->
      <Transition name="slide">
        <div v-if="step === 3" key="s3">
          <div class="text-center mb-6">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-3xl mx-auto mb-4">🎯</div>
            <p class="text-violet-400 text-xs font-semibold uppercase tracking-widest mb-1">Langkah 3 dari 3</p>
            <h1 class="text-2xl font-black text-white">Pilih Strategi</h1>
            <p class="text-slate-400 text-sm mt-1">Seberapa agresif kamu mau menabung?</p>
          </div>

          <!-- Available overview -->
          <div class="glass-card p-4 mb-4 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-xl flex-shrink-0">💼</div>
            <div>
              <p class="text-slate-400 text-xs">Gaji - Pengeluaran Wajib = Tersedia</p>
              <p class="text-white font-black">{{ fmtCur(salaryValue) }} - {{ fmtCur(totalMandatory) }} = <span class="text-emerald-400">{{ fmtCur(available) }}</span></p>
            </div>
          </div>

          <!-- Strategy cards -->
          <div class="space-y-3 mb-5">
            <button v-for="opt in savingStrategies" :key="opt.type" type="button"
              @click="s3.saving_type = opt.type"
              class="w-full text-left rounded-2xl border p-4 transition-all"
              :class="s3.saving_type === opt.type
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-white/10 bg-white/5 hover:border-white/20'">
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-2xl">{{ opt.icon }}</span>
                  <div>
                    <p class="font-black text-white text-sm">{{ opt.label }}</p>
                    <p class="text-slate-500 text-xs">{{ opt.desc }}</p>
                  </div>
                </div>
                <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                  :class="s3.saving_type === opt.type ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'">
                  <div v-if="s3.saving_type === opt.type" class="w-2 h-2 rounded-full bg-white" />
                </div>
              </div>

              <!-- Preview numbers -->
              <div class="grid grid-cols-3 gap-2 mt-1">
                <div class="bg-white/5 rounded-xl p-2 text-center">
                  <p class="text-xs text-slate-500 mb-0.5">Tabungan/bln</p>
                  <p class="font-black text-emerald-400 text-sm">{{ fmtCurShort(calcFor(opt.type).savings) }}</p>
                </div>
                <div class="bg-white/5 rounded-xl p-2 text-center">
                  <p class="text-xs text-slate-500 mb-0.5">Budget/hari</p>
                  <p class="font-black text-cyan-400 text-sm">{{ fmtCurShort(calcFor(opt.type).dailyFlexible) }}</p>
                </div>
                <div class="bg-white/5 rounded-xl p-2 text-center">
                  <p class="text-xs text-slate-500 mb-0.5">Makan/hari</p>
                  <p class="font-black text-white text-sm">{{ fmtCurShort(calcFor(opt.type).dailyFood) }}</p>
                </div>
              </div>
            </button>
          </div>

          <div class="flex gap-3">
            <button @click="step = 2" class="btn-secondary flex-1">← Kembali</button>
            <button @click="startCalc" :disabled="!s3.saving_type"
              class="flex-1 py-3 rounded-2xl font-bold text-white text-sm transition-all disabled:opacity-40"
              style="background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 0 20px rgba(16,185,129,0.25)">
              ✨ Buat Rencana Budget!
            </button>
          </div>
        </div>
      </Transition>

      <!-- ═══ STEP 4: Calculating Animation ═══ -->
      <Transition name="fade">
        <div v-if="step === 4" key="s4" class="text-center py-10">
          <div class="relative w-24 h-24 mx-auto mb-8">
            <div class="absolute inset-0 rounded-full border-4 border-emerald-500/20" />
            <div class="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin" />
            <div class="absolute inset-0 flex items-center justify-center text-3xl">💡</div>
          </div>

          <h2 class="text-2xl font-black text-white mb-2">{{ calcPhase.title }}</h2>
          <p class="text-slate-400 text-sm mb-8">{{ calcPhase.subtitle }}</p>

          <!-- Animated counters -->
          <div class="glass-card p-5 space-y-4 text-left max-w-sm mx-auto">
            <div v-for="(item, i) in calcItems" :key="i"
              class="flex justify-between items-center"
              :class="i < calcRevealCount ? 'opacity-100' : 'opacity-20'"
              style="transition: opacity 0.4s">
              <span class="text-slate-400 text-sm">{{ item.label }}</span>
              <span class="font-black tabular-nums" :class="item.color">
                {{ i < calcRevealCount ? fmtCur(item.value) : '—' }}
              </span>
            </div>
          </div>

          <p v-if="calcError" class="mt-4 text-red-400 text-sm">{{ calcError }}</p>
        </div>
      </Transition>

      <!-- ═══ STEP 5: Plan Ready! ═══ -->
      <Transition name="fade">
        <div v-if="step === 5" key="s5">
          <div class="text-center mb-6">
            <div class="text-5xl mb-3">🎉</div>
            <h1 class="text-2xl font-black text-white">Rencana Keuanganmu Siap!</h1>
            <p class="text-slate-400 text-sm mt-1">Berdasarkan data yang kamu masukkan</p>
          </div>

          <!-- Envelope visual -->
          <div class="grid grid-cols-2 gap-3 mb-4">
            <div class="rounded-2xl p-4 border border-red-500/20 bg-red-500/5">
              <p class="text-red-400 text-xs font-semibold mb-1">📕 Tabungan Harian</p>
              <p class="text-2xl font-black text-white">{{ fmtCurShort(finalPlan.dailySavings) }}</p>
              <p class="text-slate-500 text-xs mt-1">{{ fmtCur(finalPlan.savings) }}/bulan</p>
              <p class="text-red-300/60 text-[10px] mt-1">Non-negotiable 🔒</p>
            </div>
            <div class="rounded-2xl p-4 border border-cyan-500/20 bg-cyan-500/5">
              <p class="text-cyan-400 text-xs font-semibold mb-1">🟦 Budget Harian</p>
              <p class="text-2xl font-black text-white">{{ fmtCurShort(finalPlan.dailyFlexible) }}</p>
              <p class="text-slate-500 text-xs mt-1">{{ fmtCur(finalPlan.flexible) }}/bulan</p>
              <p class="text-cyan-300/60 text-[10px] mt-1">Fleksibel 🛒</p>
            </div>
          </div>

          <!-- Breakdown -->
          <div class="glass-card p-5 mb-4">
            <p class="text-white font-bold mb-3">Rincian Budget Harian</p>
            <div class="space-y-2">
              <div v-for="cat in finalPlan.breakdown" :key="cat.label"
                class="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div class="flex items-center gap-2">
                  <span>{{ cat.icon }}</span>
                  <div>
                    <p class="text-white text-sm">{{ cat.label }}</p>
                    <div class="h-1.5 rounded-full bg-white/10 w-24 mt-1 overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-1000" :class="cat.barColor" :style="{ width: cat.pct + '%' }" />
                    </div>
                  </div>
                </div>
                <span class="font-bold text-sm tabular-nums" :class="cat.color">{{ fmtCurShort(cat.daily) }}</span>
              </div>
            </div>
          </div>

          <!-- Mandatory card -->
          <div class="glass-card p-4 mb-6 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-slate-500/20 flex items-center justify-center text-xl flex-shrink-0">⚙️</div>
            <div>
              <p class="text-slate-300 text-sm font-medium">Pengeluaran Wajib (auto-deducted)</p>
              <p class="text-white font-bold">{{ fmtCur(totalMandatory) }}/bulan</p>
            </div>
          </div>

          <!-- Carryover info note -->
          <div class="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4 mb-4">
            <p class="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">💡 Gimana kalau ada sisa?</p>
            <p class="text-slate-300 text-sm leading-relaxed">
              Kalau budget harianmu <span class="text-white font-semibold">tidak habis</span>, kamu bisa pilih:
            </p>
            <div class="mt-2 space-y-1.5">
              <div class="flex items-start gap-2">
                <span class="text-emerald-400 text-xs mt-0.5">➡️</span>
                <p class="text-slate-400 text-xs"><span class="text-white font-medium">Bawa ke besok</span> — budget besok jadi lebih besar dari biasanya</p>
              </div>
              <div class="flex items-start gap-2">
                <span class="text-emerald-400 text-xs mt-0.5">🏦</span>
                <p class="text-slate-400 text-xs"><span class="text-white font-medium">Masuk tabungan</span> — sisa masuk tabungan bulan ini, besok reset ke budget normal</p>
              </div>
            </div>
            <p class="text-slate-500 text-[11px] mt-3 border-t border-white/5 pt-2">Pilihan ini muncul otomatis setiap pagi kalau ada sisa dari hari sebelumnya.</p>
          </div>

          <button @click="finish"
            class="w-full py-4 rounded-2xl font-black text-white text-base transition-all"
            style="background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 0 40px rgba(16,185,129,0.35)">
            🚀 Mulai Tracking Sekarang!
          </button>
        </div>
      </Transition>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useCurrencyInput } from '@/composables/useCurrencyInput'

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
const { displayValue: salaryDisplay, numericValue: salaryValue, reset: resetSalary } = useCurrencyInput()
const { displayValue: addAmountDisplay, numericValue: addAmountValue, reset: resetAddAmount } = useCurrencyInput()

// ── Step state ───────────────────────────────────────────────────────
const step = ref(1)

// ── Step 1 ───────────────────────────────────────────────────────────
const s1 = ref({ region: '', purpose: '', purposeCustom: '' })

const purposeOptions = [
  { value: 'Hemat lebih banyak setiap bulan',   icon: '💰', label: 'Hemat lebih banyak' },
  { value: 'Tracking pengeluaran harian',        icon: '📊', label: 'Tracking pengeluaran' },
  { value: 'Menabung untuk tujuan tertentu',     icon: '🎯', label: 'Nabung untuk tujuan' },
  { value: 'Belajar mengatur keuangan',          icon: '📚', label: 'Belajar keuangan' },
  { value: 'Melunasi hutang lebih cepat',        icon: '⚡', label: 'Lunasi hutang' },
  { value: '__other__',                           icon: '✏️', label: 'Lainnya...' },
]

function selectPurpose(val: string) {
  s1.value.purpose = val
  if (val !== '__other__') s1.value.purposeCustom = ''
}

const purposeValue = computed(() =>
  s1.value.purpose === '__other__' ? s1.value.purposeCustom : s1.value.purpose
)

const step1Valid = computed(() =>
  salaryValue.value > 0 && s1.value.region.trim().length > 0 && purposeValue.value.trim().length > 0
)

function goStep2() {
  if (!step1Valid.value) return
  step.value = 2
}

// ── Step 2 ───────────────────────────────────────────────────────────
interface MandatoryItem { category: string; amount: number; description: string }
const mandatoryItems = ref<MandatoryItem[]>([])

const mandatoryCategories = [
  { value: 'housing',      icon: '🏠', label: 'Tempat tinggal' },
  { value: 'transport',    icon: '🚗', label: 'Transportasi' },
  { value: 'utilities',    icon: '📱', label: 'Utilitas' },
  { value: 'subscription', icon: '💳', label: 'Langganan' },
  { value: 'other',        icon: '📦', label: 'Lainnya' },
]

const mandatoryCatMeta: Record<string, { icon: string; label: string }> = {
  housing:      { icon: '🏠', label: 'Tempat tinggal' },
  transport:    { icon: '🚗', label: 'Transportasi' },
  utilities:    { icon: '📱', label: 'Utilitas' },
  subscription: { icon: '💳', label: 'Langganan' },
  other:        { icon: '📦', label: 'Lainnya' },
}

const addForm = ref({ category: '', description: '' })
const addFormValid = computed(() =>
  addForm.value.category && addAmountValue.value > 0 && addForm.value.description.trim().length >= 3
)

function pushMandatory() {
  if (!addFormValid.value) return
  const newTotal = totalMandatory.value + addAmountValue.value
  if (newTotal >= salaryValue.value) return
  mandatoryItems.value.push({
    category: addForm.value.category,
    amount: addAmountValue.value,
    description: addForm.value.description.trim(),
  })
  addForm.value = { category: '', description: '' }
  resetAddAmount()
}

const totalMandatory = computed(() => mandatoryItems.value.reduce((s, i) => s + i.amount, 0))
const available = computed(() => salaryValue.value - totalMandatory.value)
const availableNegative = computed(() => available.value < 0)

// ── Step 3 ───────────────────────────────────────────────────────────
const s3 = ref({ saving_type: '' })

const savingStrategies = [
  { type: 'frugal',         icon: '🧊', label: 'Frugal',         desc: 'Hemat ketat — prioritas tabungan maksimal', savePct: 0.65, spendPct: 0.35 },
  { type: 'recommendation', icon: '✅', label: 'Rekomendasi',    desc: 'Seimbang — enjoy hidup & tetap nabung', savePct: 0.45, spendPct: 0.55 },
  { type: 'normal',         icon: '😊', label: 'Normal',         desc: 'Fleksibel — santai, belanja lebih bebas', savePct: 0.25, spendPct: 0.75 },
]

function calcFor(type: string) {
  const strat = savingStrategies.find(s => s.type === type)!
  const avail = Math.max(0, available.value)
  const flexible = avail * strat.spendPct
  const savings = avail * strat.savePct
  const food = flexible * 0.65
  return {
    savings: Math.round(savings),
    flexible: Math.round(flexible),
    dailyFlexible: Math.round(flexible / 30),
    dailySavings: Math.round(savings / 30),
    dailyFood: Math.round(food / 30),
  }
}

// ── Step 4: Calculating animation ────────────────────────────────────
const calcRevealCount = ref(0)
const calcError = ref('')
const calcPhases = [
  { title: 'Menghitung anggaran...', subtitle: 'Memproses gaji dan pengeluaran wajib' },
  { title: 'Mengoptimasi alokasi...', subtitle: 'Menerapkan strategi ' + (s3.value.saving_type || 'menabung') },
  { title: 'Menyiapkan rencana...', subtitle: 'Menghitung target harian per kategori' },
  { title: 'Hampir selesai!', subtitle: 'Menyimpan rencana keuanganmu...' },
]
const calcPhaseIdx = ref(0)
const calcPhase = computed(() => calcPhases[Math.min(calcPhaseIdx.value, calcPhases.length - 1)])

const calcItems = computed(() => {
  const c = calcFor(s3.value.saving_type || 'recommendation')
  return [
    { label: 'Penghasilan bulanan',    value: salaryValue.value,  color: 'text-white' },
    { label: '- Pengeluaran wajib',    value: -totalMandatory.value, color: 'text-red-400' },
    { label: '= Dana tersedia',        value: available.value,    color: 'text-emerald-400' },
    { label: '📕 Target tabungan/bln', value: c.savings,          color: 'text-red-300' },
    { label: '🟦 Budget fleksibel/bln',value: c.flexible,         color: 'text-cyan-400' },
    { label: '🍜 Budget makan/hari',   value: c.dailyFood,        color: 'text-white' },
    { label: '🎯 Budget harian total', value: c.dailyFlexible,    color: 'text-emerald-400' },
  ]
})

// ── Final plan (shown in step 5) ──────────────────────────────────────
const finalPlan = ref<any>({})

async function startCalc() {
  if (!s3.value.saving_type) return
  step.value = 4
  calcRevealCount.value = 0
  calcPhaseIdx.value = 0
  calcError.value = ''

  // Reveal items one by one
  const revealInterval = setInterval(() => {
    calcRevealCount.value++
    if (calcRevealCount.value >= calcItems.value.length) clearInterval(revealInterval)
  }, 420)

  // Phase progression
  const phaseInterval = setInterval(() => {
    calcPhaseIdx.value++
    if (calcPhaseIdx.value >= calcPhases.length - 1) clearInterval(phaseInterval)
  }, 900)

  // Give animation 2.8s head start then submit
  await sleep(2800)

  try {
    // 1. Personal data
    await api.post('/personal-data/', {
      salary: salaryValue.value,
      purpose_of_join_here: purposeValue.value,
      saving_type: s3.value.saving_type,
    })

    // 2. Mandatory expenses (batch, skip errors individually)
    const now = new Date()
    const txDate = now.toISOString()
    for (const item of mandatoryItems.value) {
      try {
        await api.post('/mandatory-expenditure/', {
          category: item.category,
          amount: item.amount,
          description: item.description,
          transaction_date: txDate,
          for_month: now.getMonth() + 1,
          for_year: now.getFullYear(),
        })
      } catch {}
    }

    // 3. Budget plan
    await api.post('/budget-plan/', {
      for_month: now.getMonth() + 1,
      for_year: now.getFullYear(),
      saving_type: s3.value.saving_type,
      region: s1.value.region,
    })

    auth.hasPersonalData = true

    // Build final plan for step 5
    const c = calcFor(s3.value.saving_type)
    finalPlan.value = {
      savings: c.savings,
      flexible: c.flexible,
      dailySavings: c.dailySavings,
      dailyFlexible: c.dailyFlexible,
      breakdown: [
        { icon: '🍜', label: 'Makanan',    daily: Math.round(c.flexible * 0.65 / 30), pct: 65, color: 'text-white',         barColor: 'bg-emerald-400' },
        { icon: '🎮', label: 'Hiburan',    daily: Math.round(c.flexible * 0.35 * 0.20 / 30), pct: 7,  color: 'text-cyan-400',    barColor: 'bg-cyan-400' },
        { icon: '🛍️', label: 'Belanja',   daily: Math.round(c.flexible * 0.35 * 0.17 / 30), pct: 6,  color: 'text-violet-400',  barColor: 'bg-violet-400' },
        { icon: '📦', label: 'Lainnya',   daily: Math.round(c.flexible * 0.35 * 0.63 / 30), pct: 22, color: 'text-slate-300',   barColor: 'bg-slate-400' },
      ],
    }

    await sleep(600)
    step.value = 5
  } catch (e: any) {
    calcError.value = e.response?.data?.errors ?? e.response?.data?.message ?? 'Gagal menyimpan. Coba lagi.'
    step.value = 3
  }
}

function finish() {
  router.push('/app')
}

// ── Helpers ───────────────────────────────────────────────────────────
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
