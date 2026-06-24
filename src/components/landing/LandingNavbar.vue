<template>
  <nav class="sticky top-0 z-50 backdrop-blur-2xl bg-slate-950/70 border-b border-white/10">
    <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
      <!-- Logo -->
      <RouterLink to="/" class="flex items-center gap-3 group">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center font-black shadow-glow-emerald-sm group-hover:scale-110 transition-all">
          CW
        </div>
        <div>
          <h1 class="font-black text-lg text-white leading-none">CipuyWallet</h1>
          <p class="text-xs text-slate-400">Smart Budget Manager</p>
        </div>
      </RouterLink>

      <!-- Desktop nav links -->
      <div class="hidden md:flex items-center gap-8">
        <a v-for="link in navLinks" :key="link" :href="`#${link.toLowerCase()}`"
          class="relative text-slate-300 font-medium hover:text-white transition-all
                 after:absolute after:left-0 after:-bottom-1.5 after:h-0.5 after:w-0
                 after:bg-emerald-400 after:transition-all hover:after:w-full">
          {{ link }}
        </a>
      </div>

      <!-- Desktop CTA -->
      <div class="hidden md:flex items-center gap-3">
        <RouterLink to="/login"
          class="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300
                 hover:text-white hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all">
          Masuk
        </RouterLink>
        <RouterLink to="/register"
          class="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold
                 shadow-glow-emerald-sm hover:scale-105 transition-all">
          Daftar Gratis
        </RouterLink>
      </div>

      <!-- Mobile hamburger -->
      <button @click="open = !open"
        class="md:hidden w-11 h-11 rounded-xl border border-white/10 bg-white/5
               flex items-center justify-center text-white">
        <span class="text-xl">{{ open ? '✕' : '☰' }}</span>
      </button>
    </div>

    <!-- Mobile menu -->
    <div class="md:hidden overflow-hidden transition-all duration-300"
      :class="open ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'">
      <div class="px-6 pb-6 border-t border-white/10 bg-slate-950/95 backdrop-blur-xl">
        <div class="flex flex-col gap-5 py-5">
          <a v-for="link in navLinks" :key="link" :href="`#${link.toLowerCase()}`"
            class="text-slate-300 hover:text-emerald-400 transition-colors">{{ link }}</a>
        </div>
        <div class="flex flex-col gap-3 mt-2">
          <RouterLink to="/login" class="text-center py-3 rounded-xl border border-white/10 text-slate-300">Masuk</RouterLink>
          <RouterLink to="/register" class="text-center py-3 rounded-xl bg-emerald-500 text-white font-semibold shadow-glow-emerald-sm">Daftar Gratis</RouterLink>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

const open = ref(false)
const navLinks = ['Fitur', 'Budget', 'Transaksi']
</script>
