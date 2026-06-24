<template>
  <section class="py-20 md:py-32 relative">
    <div class="max-w-6xl mx-auto px-5 md:px-6">
      <div class="relative overflow-hidden rounded-[32px] md:rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-2xl p-8 md:p-12 lg:p-16">

        <!-- Glows -->
        <div class="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/20 blur-[180px]" />
        <div class="pointer-events-none absolute bottom-0 right-0 w-[350px] h-[350px] rounded-full bg-cyan-500/10 blur-[140px]" />

        <div class="relative z-10 text-center">
          <div class="badge-emerald mb-8">
            ✨ Mulai membangun masa depan finansialmu
          </div>

          <h2 class="text-2xl sm:text-4xl lg:text-6xl font-black leading-tight text-white">
            Setiap rupiah yang kamu kelola hari ini
            <br />
            <span class="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              adalah kebebasan di masa depan.
            </span>
          </h2>

          <p class="mt-6 max-w-3xl mx-auto text-sm md:text-lg text-slate-400 leading-relaxed">
            CipuyWallet membantu kamu mengelola pemasukan, mengontrol pengeluaran, merencanakan budget harian,
            dan mendapatkan insight keuangan yang realistis berdasarkan kondisi hidupmu.
          </p>

          <!-- Feature pills -->
          <div class="flex flex-wrap justify-center gap-3 mt-8">
            <div v-for="pill in pills" :key="pill"
              class="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-300 text-sm">
              {{ pill }}
            </div>
          </div>

          <!-- CTA buttons -->
          <div class="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <RouterLink to="/register"
              class="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 px-8 py-4 rounded-2xl font-semibold text-white transition-all hover:scale-[1.02]"
              style="box-shadow: 0 0 40px rgba(16,185,129,0.35)">
              Mulai Gratis →
            </RouterLink>
            <RouterLink to="/login"
              class="px-8 py-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all">
              Masuk ke Akun
            </RouterLink>
          </div>

          <!-- Mini stats -->
          <div class="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div v-for="stat in stats" :key="stat.label"
              class="rounded-2xl bg-white/5 border border-white/10 p-5">
              <p class="text-2xl mb-1">{{ stat.icon }}</p>
              <p class="text-3xl font-black text-white mt-1">{{ stat.value }}</p>
              <p class="text-sm text-slate-500 mt-1">{{ stat.label }}</p>
            </div>
          </div>

          <div class="mt-10 pt-8 border-t border-white/10">
            <p class="text-slate-500 text-sm">Tidak perlu menjadi ahli keuangan untuk mulai mengelola uang.</p>
            <p class="text-white font-semibold mt-2">Mulai dari memahami uangmu, sisanya biarkan CipuyWallet membantu.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

const pills = ['Auto Budget Plan', 'Smart Daily Tracking', 'Monthly Summary', 'UMP Based Analysis']

const stats = [
  { icon: '🛡️', value: '100%', label: 'Gratis Digunakan' },
  { icon: '📊', value: 'Auto', label: 'Budget Generator' },
  { icon: '⏱️', value: '24/7', label: 'Monitoring Keuangan' },
]
</script>
