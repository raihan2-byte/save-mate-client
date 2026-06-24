<template>
  <section class="relative py-20 md:py-36 overflow-hidden">
    <div class="max-w-6xl mx-auto px-5 md:px-6 text-center">

      <!-- Badge -->
      <div class="badge-emerald mb-6">
        💰 Smart Budget Manager
      </div>

      <!-- Headline -->
      <h1 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight text-slate-200">
        Kelola uangmu
        <br />
        <span class="text-white">bukan soal hemat, </span>
        <span class="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          tapi strategi.
        </span>
      </h1>

      <!-- Subtitle -->
      <p class="mt-6 md:mt-8 max-w-3xl mx-auto text-base sm:text-lg md:text-xl text-slate-400 leading-relaxed">
        CipuyWallet membantu kamu merencanakan budget bulanan, mencatat transaksi harian,
        dan memahami pola keuanganmu berdasarkan penghasilan dan kebutuhan nyata.
      </p>

      <!-- Feature pills -->
      <div class="mt-8 flex flex-wrap justify-center gap-2 md:gap-3">
        <span v-for="pill in pills" :key="pill"
          class="px-3 md:px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs sm:text-sm">
          {{ pill }}
        </span>
      </div>

      <!-- CTA buttons -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mt-10 md:mt-12">
        <RouterLink to="/register" class="w-full sm:w-auto btn-emerald">
          Mulai Gratis
        </RouterLink>
        <RouterLink to="/login"
          class="w-full sm:w-auto btn-ghost">
          Sudah Punya Akun
        </RouterLink>
      </div>

      <!-- Stats -->
      <div class="mt-16 md:mt-24 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div v-for="stat in stats" :key="stat.label" class="text-center">
          <h3 class="text-2xl md:text-3xl font-black" :class="stat.color">{{ stat.value }}</h3>
          <p class="text-slate-500 text-xs md:text-sm mt-1">{{ stat.label }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

const pills = ['Budget Harian', 'Mandatory Expense', 'Daily Tracker', 'Monthly Summary']

const stats = [
  { value: 'AI', label: 'Budget Planner', color: 'text-emerald-400' },
  { value: '24/7', label: 'Expense Tracking', color: 'text-cyan-400' },
  { value: 'UMP', label: 'Regional Analysis', color: 'text-white' },
  { value: '100%', label: 'Free to Use', color: 'text-emerald-400' },
]
</script>
