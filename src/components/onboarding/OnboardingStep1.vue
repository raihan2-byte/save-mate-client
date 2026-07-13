<template>
  <div key="s1">
    <div class="text-center mb-8">
      <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-3xl mx-auto mb-4"
        style="box-shadow: 0 0 40px rgba(16,185,129,0.35)">💰</div>
      <p class="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-1">Langkah 1</p>
      <h1 class="text-2xl font-black text-white">Berapa penghasilanmu?</h1>
      <p class="text-slate-400 text-sm mt-1">Ini jadi dasar perhitungan budget harianmu</p>
    </div>

    <div class="glass-card p-6 space-y-5">
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-1.5">Gaji / Penghasilan Bulanan</label>
        <div class="relative">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">Rp</span>
          <input :value="salaryDisplay" @input="emit('update:salaryDisplay', ($event.target as HTMLInputElement).value)"
            type="text" inputmode="numeric" class="input-dark pl-10" placeholder="5.000.000" />
        </div>
        <p class="text-slate-600 text-xs mt-1">Masukkan gaji bersih atau total penghasilan tetap per bulan</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-300 mb-1.5">Tanggal Gajian <span class="text-slate-500 font-normal">(setiap bulan)</span></label>
        <input :value="paydayDay" @input="emit('update:paydayDay', Number(($event.target as HTMLInputElement).value))"
          type="number" min="1" max="28" class="input-dark" placeholder="Contoh: 25" />
        <p class="text-slate-600 text-xs mt-1">Tanggal berapa biasanya kamu terima gaji? (1–28)</p>
      </div>

      <Transition name="slide">
        <div v-if="isMidCycle" class="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2.5">
          <span class="text-base flex-shrink-0">📅</span>
          <p class="text-amber-300 text-xs leading-relaxed">
            Hari ini bukan hari gajian. Gajian berikutnya <span class="font-bold">{{ daysToNextPayday }} hari lagi</span> (tgl {{ paydayDay }}).
            Nanti kita setup budget khusus untuk periode ini.
          </p>
        </div>
      </Transition>

      <div>
        <label class="block text-sm font-medium text-slate-300 mb-2">Tujuan Pakai CipuyWallet</label>
        <div class="grid grid-cols-2 gap-2">
          <button v-for="opt in purposeOptions" :key="opt.value" type="button"
            @click="selectPurpose(opt.value)"
            class="text-left px-3 py-2.5 rounded-xl border text-sm transition-all"
            :class="purpose === opt.value
              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
              : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'">
            <span class="block text-base mb-0.5">{{ opt.icon }}</span>
            {{ opt.label }}
          </button>
        </div>
        <input v-if="purpose === '__other__'" :value="purposeCustom"
          @input="emit('update:purposeCustom', ($event.target as HTMLInputElement).value)"
          type="text" maxlength="50" class="input-dark mt-2" placeholder="Ceritakan tujuanmu..." />
      </div>

      <AppButton variant="primary" size="lg" class="w-full" @click="emit('next')" :disabled="!isValid">
        {{ isMidCycle ? 'Lanjut → Setup Periode Ini' : 'Lanjut → Pengeluaran Wajib' }}
      </AppButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'

const props = defineProps<{
  salary: number
  salaryDisplay: string
  paydayDay: number
  purpose: string
  purposeCustom: string
}>()

const emit = defineEmits<{
  'update:salaryDisplay': [value: string]
  'update:paydayDay': [value: number]
  'update:purpose': [value: string]
  'update:purposeCustom': [value: string]
  'next': []
}>()

const purposeOptions = [
  { value: 'Hemat lebih banyak setiap bulan', icon: '💰', label: 'Hemat lebih banyak' },
  { value: 'Tracking pengeluaran harian',     icon: '📊', label: 'Tracking pengeluaran' },
  { value: 'Menabung untuk tujuan tertentu',  icon: '🎯', label: 'Nabung untuk tujuan' },
  { value: 'Belajar mengatur keuangan',       icon: '📚', label: 'Belajar keuangan' },
  { value: 'Melunasi hutang lebih cepat',     icon: '⚡', label: 'Lunasi hutang' },
  { value: '__other__',                        icon: '✏️', label: 'Lainnya...' },
]

function selectPurpose(val: string) {
  emit('update:purpose', val)
  if (val !== '__other__') emit('update:purposeCustom', '')
}

const isMidCycle = computed(() => {
  const today = new Date().getDate()
  return props.paydayDay > 0 && today !== props.paydayDay
})

const daysToNextPayday = computed(() => {
  const now = new Date()
  const today = now.getDate()
  const payday = props.paydayDay
  const sameMonth = today < payday
  const nextPayday = new Date(now.getFullYear(), now.getMonth() + (sameMonth ? 0 : 1), payday)
  return Math.max(1, Math.ceil((nextPayday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
})

const purposeValue = computed(() =>
  props.purpose === '__other__' ? props.purposeCustom : props.purpose
)

const isValid = computed(() =>
  props.salary > 0 &&
  purposeValue.value.trim().length > 0 &&
  props.paydayDay > 0
)
</script>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: all 0.35s ease; }
.slide-enter-from { opacity: 0; transform: translateX(40px); }
.slide-leave-to   { opacity: 0; transform: translateX(-40px); }
</style>
