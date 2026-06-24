<template>
  <section id="fitur" class="relative py-20 md:py-28">
    <div class="max-w-6xl mx-auto px-5 md:px-6">

      <!-- Header -->
      <div class="text-center mb-12 md:mb-16">
        <div class="badge-emerald mb-5">✨ Core Features</div>
        <h2 class="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
          Semua Yang Kamu Butuhkan
        </h2>
        <p class="mt-5 max-w-2xl mx-auto text-slate-400 text-sm md:text-lg">
          CipuyWallet bukan sekadar catatan keuangan. Kami bantu kamu membangun
          kebiasaan finansial sehat dengan tools yang intuitif.
        </p>
      </div>

      <!-- Feature cards -->
      <div class="grid md:grid-cols-3 gap-6">
        <div v-for="feat in features" :key="feat.title"
          class="group relative overflow-hidden glass-card p-7
                 hover:-translate-y-2 hover:border-emerald-500/30 transition-all duration-300">
          <!-- Hover glow -->
          <div class="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-emerald-500/10 blur-3xl
                      opacity-0 group-hover:opacity-100 transition-all" />

          <!-- Icon -->
          <div class="relative z-10 w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mb-6 text-2xl">
            {{ feat.icon }}
          </div>

          <h3 class="text-xl md:text-2xl font-bold relative z-10">{{ feat.title }}</h3>
          <p class="text-slate-400 mt-4 leading-relaxed relative z-10">{{ feat.desc }}</p>

          <div class="mt-6 inline-flex px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-emerald-400 relative z-10">
            {{ feat.badge }}
          </div>
        </div>
      </div>

      <!-- Bottom stats -->
      <div class="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        <div v-for="s in bottomStats" :key="s.label">
          <h3 class="text-3xl font-black" :class="s.color">{{ s.value }}</h3>
          <p class="text-slate-500 text-sm mt-1">{{ s.label }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const features = [
  {
    icon: '📊',
    title: 'Budget Planning',
    desc: 'Buat rencana budget bulanan otomatis berdasarkan penghasilan, UMP daerah, dan pengeluaran wajib.',
    badge: 'Auto Calculate',
  },
  {
    icon: '💳',
    title: 'Daily Tracking',
    desc: 'Catat setiap transaksi harian dengan mudah. Pantau sisa budget real-time supaya kamu tidak over-budget.',
    badge: '24/7 Monitoring',
  },
  {
    icon: '📈',
    title: 'Monthly Summary',
    desc: 'Lihat ringkasan keuangan bulanan — total pemasukan, pengeluaran, dan berapa yang berhasil kamu hemat.',
    badge: 'Insight Report',
  },
]

const bottomStats = [
  { value: 'Auto', label: 'Budget Generator', color: 'text-emerald-400' },
  { value: '24/7', label: 'Expense Tracking', color: 'text-cyan-400' },
  { value: 'UMP', label: 'Regional Data', color: 'text-white' },
  { value: '∞', label: 'Transaksi Free', color: 'text-emerald-400' },
]
</script>
