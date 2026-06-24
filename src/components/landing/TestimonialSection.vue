<template>
  <section class="py-20 md:py-28 relative">
    <div class="max-w-6xl mx-auto px-5 md:px-6">

      <div class="text-center mb-14 md:mb-16">
        <div class="badge-emerald mb-5">Financial Mindset</div>
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-black mt-5 text-white leading-tight">
          Bukan soal berapa yang kamu hasilkan
        </h2>
        <p class="text-slate-400 mt-5 max-w-2xl mx-auto text-sm md:text-base">
          Kebebasan finansial dibangun dari kebiasaan kecil yang dilakukan secara konsisten setiap hari.
        </p>
      </div>

      <!-- Quote cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div v-for="(item, i) in testimonials" :key="i"
          class="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8
                 hover:-translate-y-2 hover:border-emerald-500/30 transition-all duration-300">
          <div class="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 blur-3xl rounded-full" />
          <div class="relative z-10">
            <div class="text-5xl md:text-6xl text-emerald-400 leading-none">"</div>
            <p class="text-sm md:text-base text-slate-300 leading-relaxed mt-3">{{ item.quote }}</p>
            <div class="mt-8 pt-6 border-t border-white/10">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 md:w-14 md:h-14 rounded-full border border-white/10 bg-slate-800 flex items-center justify-center text-xl">
                  {{ item.emoji }}
                </div>
                <div>
                  <h4 class="font-bold text-white">{{ item.name }}</h4>
                  <p class="text-sm text-slate-500">{{ item.role }}</p>
                </div>
              </div>
              <div class="mt-4">
                <span class="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
                  Total Saving {{ item.saved }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats banner -->
      <div class="mt-14 md:mt-16 relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-10 text-center">
        <div class="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-cyan-500/5" />
        <div class="relative z-10">
          <h3 class="text-2xl md:text-3xl font-black text-white leading-tight">
            CipuyWallet membantu mengubah kebiasaan menjadi hasil
          </h3>
          <p class="text-slate-400 mt-4 max-w-2xl mx-auto text-sm md:text-base">
            Catat pemasukan, kendalikan pengeluaran, rencanakan budget, dan biarkan data membantu menjaga konsistensimu.
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <div v-for="stat in stats" :key="stat.label"
              class="px-5 py-4 rounded-2xl bg-white/5 border border-white/10">
              <p class="text-2xl font-black text-white">{{ stat.value }}</p>
              <p class="text-sm text-slate-500">{{ stat.label }}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  </section>
</template>

<script setup lang="ts">
const testimonials = [
  {
    name: 'Theo Derick',
    role: 'Fresh Graduate',
    saved: 'Rp 12.500.000',
    emoji: '👨‍💼',
    quote: 'Kalau mau kaya, bukan cuma soal berapa besar gaji yang kamu dapat. Tapi seberapa banyak yang berhasil kamu simpan dan pertahankan.',
  },
  {
    name: 'Sarah Putri',
    role: 'Karyawan Swasta',
    saved: 'Rp 28.300.000',
    emoji: '👩‍💻',
    quote: 'Banyak orang fokus mencari penghasilan tambahan, tapi lupa mengelola uang yang sudah dimiliki. Kebiasaan kecil setiap hari menentukan masa depan finansialmu.',
  },
  {
    name: 'Rizky Pratama',
    role: 'Freelancer',
    saved: 'Rp 18.900.000',
    emoji: '🧑‍🎨',
    quote: 'Menabung bukan menyiksa diri. Menabung adalah memberi kebebasan untuk dirimu di masa depan ketika kesempatan besar datang.',
  },
]

const stats = [
  { value: '10K+', label: 'Transaksi Dicatat' },
  { value: '95%', label: 'Konsistensi Budget' },
  { value: '24/7', label: 'Real-time Tracking' },
]
</script>
