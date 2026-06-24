<template>
  <section class="py-20 md:py-28">
    <div class="max-w-7xl mx-auto px-5 md:px-6">

      <div class="text-center max-w-3xl mx-auto mb-12 md:mb-20">
        <div class="badge-emerald mb-5">Financial Foundation</div>
        <h2 class="mt-5 text-3xl md:text-5xl font-black text-white leading-tight">
          Mengelola budget bukan langkah pertama.
        </h2>
        <p class="text-slate-400 text-base md:text-lg mt-5 leading-relaxed">
          CipuyWallet memastikan kondisi keuanganmu sehat terlebih dahulu
          sebelum menentukan budget harian. Karena strategi yang tepat
          selalu dimulai dari pondasi yang kuat.
        </p>
      </div>

      <div class="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

        <!-- Steps -->
        <div class="space-y-4">
          <div v-for="(item, index) in foundations" :key="index"
            class="group glass-card p-5 md:p-6 hover:border-emerald-500/30 transition-all">
            <div class="flex gap-4">
              <div class="shrink-0 w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 font-bold">
                {{ index + 1 }}
              </div>
              <div>
                <h3 class="font-bold text-white text-lg">{{ item.title }}</h3>
                <p class="text-slate-400 mt-2 text-sm md:text-base">{{ item.desc }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Budget visualization card -->
        <div class="relative overflow-hidden glass-card p-6 md:p-8">
          <div class="absolute top-0 right-0 w-60 h-60 bg-emerald-500/10 blur-[100px] rounded-full" />

          <div class="relative z-10">
            <h3 class="text-xl md:text-2xl font-bold text-white">Distribusi Gaji Rp 5.000.000</h3>
            <p class="text-slate-400 mt-2 text-sm">Contoh perhitungan rekomendasi CipuyWallet</p>

            <div class="space-y-6 mt-8">
              <div>
                <div class="flex justify-between mb-2">
                  <span class="text-slate-300">Kebutuhan Wajib</span>
                  <span class="font-bold text-cyan-400">Rp 2.500.000</span>
                </div>
                <div class="h-3 rounded-full bg-slate-800 overflow-hidden">
                  <div class="w-1/2 h-full bg-cyan-500 rounded-full" />
                </div>
              </div>

              <div>
                <div class="flex justify-between mb-2">
                  <span class="text-slate-300">Budget Harian</span>
                  <span class="font-bold text-emerald-400">Rp 1.500.000</span>
                </div>
                <div class="h-3 rounded-full bg-slate-800 overflow-hidden">
                  <div class="w-[30%] h-full bg-emerald-500 rounded-full" />
                </div>
              </div>

              <div>
                <div class="flex justify-between mb-2">
                  <span class="text-slate-300">Tabungan & Dana Darurat</span>
                  <span class="font-bold text-violet-400">Rp 1.000.000</span>
                </div>
                <div class="h-3 rounded-full bg-slate-800 overflow-hidden">
                  <div class="w-[20%] h-full bg-violet-500 rounded-full" />
                </div>
              </div>
            </div>

            <div class="mt-8 border border-emerald-500/20 bg-emerald-500/10 rounded-2xl p-5">
              <p class="text-sm text-emerald-300 leading-relaxed">
                💡 CipuyWallet tidak pakai rumus tetap. Budget disesuaikan dengan:
              </p>
              <div class="flex flex-wrap gap-2 mt-4">
                <span v-for="tag in tags" :key="tag"
                  class="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
                  {{ tag }}
                </span>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-3 mt-6">
              <div class="bg-white/5 rounded-2xl p-4 text-center">
                <p class="text-emerald-400 font-black text-xl">30%</p>
                <p class="text-xs text-slate-500 mt-1">Daily Budget</p>
              </div>
              <div class="bg-white/5 rounded-2xl p-4 text-center">
                <p class="text-cyan-400 font-black text-xl">50%</p>
                <p class="text-xs text-slate-500 mt-1">Needs</p>
              </div>
              <div class="bg-white/5 rounded-2xl p-4 text-center">
                <p class="text-violet-400 font-black text-xl">20%</p>
                <p class="text-xs text-slate-500 mt-1">Savings</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const foundations = [
  { title: 'Hitung Pengeluaran Wajib', desc: 'Kontrakan, listrik, internet, cicilan, dan kebutuhan utama lainnya.' },
  { title: 'Tentukan Target Finansial', desc: 'Dana darurat, menikah, rumah, kendaraan, atau investasi.' },
  { title: 'Analisis Gaji & UMP', desc: 'Rekomendasi budget disesuaikan dengan daerah tempat tinggalmu.' },
  { title: 'Bangun Konsistensi', desc: 'Progress kecil yang konsisten lebih penting daripada target besar.' },
]
const tags = ['Gaji', 'UMP Daerah', 'Expense Wajib', 'Target Finansial']
</script>
