<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-6 text-center">
    <div class="mb-8 relative">
      <p class="text-8xl font-black text-white/5 select-none leading-none">404</p>
      <p class="absolute inset-0 flex items-center justify-center text-6xl">🗺️</p>
    </div>

    <h1 class="text-2xl font-black text-white mb-2">Halaman Tidak Ditemukan</h1>
    <p class="text-slate-500 text-sm max-w-xs mb-8">
      URL yang kamu tuju tidak ada atau sudah dipindahkan.
    </p>

    <div class="flex flex-col sm:flex-row gap-3">
      <button @click="router.back()"
        class="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 text-sm font-semibold hover:bg-white/10 transition-all">
        ← Kembali
      </button>
      <RouterLink to="/app"
        class="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition-all"
        style="box-shadow: 0 0 20px rgba(16,185,129,0.25)">
        Ke Dashboard
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter, RouterLink } from 'vue-router'
const router = useRouter()
</script>
