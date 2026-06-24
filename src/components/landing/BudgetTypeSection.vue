<template>
  <section class="py-20 md:py-28">
    <div class="max-w-7xl mx-auto px-5 md:px-6">

      <div class="text-center max-w-3xl mx-auto mb-12 md:mb-16">
        <div class="badge-emerald mb-5">Smart Budget Strategy</div>
        <h2 class="mt-5 text-3xl md:text-5xl font-black leading-tight">
          Pilih strategi budget
          <br class="hidden md:block" />
          sesuai kondisi hidupmu
        </h2>
        <p class="text-slate-400 mt-5 text-sm md:text-lg">
          Tidak semua orang harus mengalokasikan budget dengan angka yang sama.
          Pilih strategi yang paling realistis untuk kondisi finansialmu.
        </p>
      </div>

      <div class="grid lg:grid-cols-3 gap-6">
        <div v-for="(item, i) in types" :key="i"
          class="relative overflow-hidden rounded-3xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-2"
          :class="item.featured
            ? 'border border-cyan-500/30 bg-cyan-500/5 scale-[1.02]'
            : 'border border-white/10 bg-white/5'">

          <!-- glow -->
          <div class="absolute top-0 right-0 w-52 h-52 rounded-full blur-3xl opacity-20"
            :class="`bg-${item.color}-500`" />

          <div class="relative z-10 p-7 md:p-8">
            <div v-if="item.featured"
              class="inline-flex mb-5 px-3 py-1.5 mr-1 rounded-full bg-cyan-500/15 border border-cyan-500/20 text-cyan-300 text-[10px] font-semibold">
              ⭐ Paling Direkomendasikan
            </div>

            <div class="inline-flex px-3 py-1.5 rounded-full text-[10px] font-semibold"
              :class="item.featured ? 'bg-cyan-500/15 text-cyan-300' : item.color === 'emerald' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-orange-500/15 text-orange-300'">
              {{ item.title }}
            </div>

            <h3 class="text-4xl md:text-5xl font-black mt-6">{{ item.percent }}</h3>
            <p class="text-slate-500 text-sm mt-2">dari total pendapatan</p>

            <div class="mt-6 rounded-2xl bg-white/5 border border-white/10 p-4">
              <p class="text-xs text-slate-500">Contoh jika gaji Rp 5.000.000</p>
              <p class="text-lg font-bold text-white mt-1">{{ item.amount }}</p>
            </div>

            <p class="text-slate-400 mt-6 leading-relaxed">{{ item.desc }}</p>

            <div class="mt-8 pt-6 border-t border-white/10">
              <RouterLink to="/register"
                class="block text-center w-full py-3 rounded-2xl font-semibold transition-all"
                :class="item.featured
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-white'
                  : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'">
                Mulai dengan Mode Ini
              </RouterLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom note -->
      <div class="mt-10 md:mt-14 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-xl p-6 md:p-8 text-center">
        <h3 class="text-2xl md:text-3xl font-bold">Tidak yakin harus pilih yang mana?</h3>
        <p class="text-slate-400 mt-4 max-w-3xl mx-auto">
          Gunakan <span class="text-emerald-400 font-semibold">Budget Otomatis</span>.
          CipuyWallet akan menghitung alokasi ideal berdasarkan:
        </p>
        <div class="flex flex-wrap justify-center gap-3 mt-6">
          <div v-for="tag in tags" :key="tag"
            class="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300">
            {{ tag }}
          </div>
        </div>
      </div>

    </div>
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

const types = [
  {
    title: 'Frugal',
    percent: '40-50%',
    amount: 'Rp 2.000.000+',
    desc: 'Untuk kamu yang ingin mempercepat target finansial dan siap mengurangi pengeluaran tidak penting.',
    color: 'emerald',
    featured: false,
  },
  {
    title: 'Recommended',
    percent: '20-30%',
    amount: 'Rp 1.000.000 - Rp 1.500.000',
    desc: 'Dihitung otomatis berdasarkan gaji, UMP daerah, pengeluaran wajib, dan target finansialmu.',
    color: 'cyan',
    featured: true,
  },
  {
    title: 'Normal',
    percent: '10-15%',
    amount: 'Rp 500.000 - Rp 750.000',
    desc: 'Pendekatan seimbang antara menikmati hidup dan tetap membangun budget secara konsisten.',
    color: 'orange',
    featured: false,
  },
]

const tags = ['Gaji Bulanan', 'UMP Daerah', 'Expense Wajib', 'Target Finansial', 'Gaya Hidup']
</script>
