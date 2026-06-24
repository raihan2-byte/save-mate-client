<template>
  <footer class="border-t border-white/10 py-10 px-6">
    <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-black text-xs">
          CW
        </div>
        <span class="font-bold text-white">CipuyWallet</span>
      </div>
      <p class="text-slate-500 text-sm">© 2026 CipuyWallet. Smart Budget Manager.</p>
      <div class="flex items-center gap-6 text-sm text-slate-400">
        <RouterLink to="/login" class="hover:text-emerald-400 transition-colors">Masuk</RouterLink>
        <RouterLink to="/register" class="hover:text-emerald-400 transition-colors">Daftar</RouterLink>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>
