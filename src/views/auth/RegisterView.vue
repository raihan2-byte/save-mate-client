<template>
  <div class="relative min-h-screen bg-slate-950 overflow-hidden text-white">
    <div class="pointer-events-none absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/20 blur-[180px] rounded-full" />
    <div class="pointer-events-none absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[180px] rounded-full" />
    <div class="pointer-events-none absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:60px_60px]" />

    <div class="relative z-10 min-h-screen flex">
      <!-- Left branding panel (desktop) -->
      <div class="hidden md:flex w-[45%] lg:w-1/2 p-8 lg:p-16 flex-col justify-between">
        <RouterLink to="/" class="flex items-center gap-3 group w-fit">
          <div class="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-black shadow-glow-emerald group-hover:scale-110 transition-all">
            CW
          </div>
          <div>
            <h1 class="text-lg lg:text-xl font-black text-white leading-none">CipuyWallet</h1>
            <p class="text-xs lg:text-sm text-slate-400">Smart Budget Manager</p>
          </div>
        </RouterLink>

        <div class="space-y-6">
          <div class="badge-emerald w-fit">🎯 Start Your Journey</div>
          <h2 class="text-3xl lg:text-5xl font-black text-white leading-tight">
            Daftar gratis.<br />
            <span class="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Mulai hari ini.
            </span>
          </h2>
          <p class="text-sm lg:text-lg text-slate-400 max-w-md">
            Bergabung dengan CipuyWallet dan mulai rencanakan budget pertamamu
            dalam hitungan menit. Gratis selamanya.
          </p>

          <!-- Feature list -->
          <div class="space-y-3">
            <div v-for="item in benefits" :key="item" class="flex items-center gap-3 text-slate-300 text-sm">
              <div class="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs flex-shrink-0">✓</div>
              {{ item }}
            </div>
          </div>
        </div>

        <p class="text-slate-600 text-xs">© 2026 CipuyWallet</p>
      </div>

      <!-- Right form panel -->
      <div class="flex-1 flex items-center justify-center px-4 md:px-6 py-10">
        <div class="w-full max-w-sm lg:max-w-md rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-2xl p-6 md:p-8 lg:p-10 shadow-card">

          <!-- Mobile logo -->
          <div class="flex items-center gap-3 mb-8 md:hidden">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-black text-xs shadow-glow-emerald-sm">CW</div>
            <span class="font-black text-white">CipuyWallet</span>
          </div>

          <div class="mb-8">
            <h1 class="text-2xl lg:text-3xl font-black text-white">Daftar gratis</h1>
            <p class="text-slate-400 mt-2 text-sm lg:text-base">Mulai bangun kebiasaan finansial sehat.</p>
          </div>

          <form @submit.prevent="handleRegister" class="space-y-5">
            <div>
              <label class="block mb-2 text-slate-300 font-medium text-sm">Username</label>
              <input v-model="form.username" type="text" minlength="3" maxlength="50" placeholder="min. 3 karakter" class="input-dark" required />
            </div>
            <div>
              <label class="block mb-2 text-slate-300 font-medium text-sm">Email</label>
              <input v-model="form.email" type="email" placeholder="masukkan email" class="input-dark" required />
            </div>
            <div>
              <label class="block mb-2 text-slate-300 font-medium text-sm">Password</label>
              <div class="relative">
                <input v-model="form.password" :type="showPassword ? 'text' : 'password'" placeholder="min. 8 karakter" class="input-dark pr-11" required />
                <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors">
                  <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                </button>
              </div>
            </div>

            <div v-if="error" class="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl px-4 py-3">
              {{ error }}
            </div>
            <div v-if="success" class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-2xl px-4 py-3">
              Akun berhasil dibuat! Mengarahkan ke login...
            </div>

            <AppButton type="submit" variant="primary" :loading="loading" class="w-full">
              Daftar Gratis
            </AppButton>

            <div class="flex items-center gap-4 py-1">
              <div class="flex-1 h-px bg-white/10" />
              <span class="text-xs uppercase tracking-widest text-slate-500">atau</span>
              <div class="flex-1 h-px bg-white/10" />
            </div>

            <p class="text-center text-sm text-slate-400">
              Sudah punya akun?
              <RouterLink to="/login" class="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                Masuk
              </RouterLink>
            </p>
          </form>

          <div class="mt-8 text-center">
            <RouterLink to="/" class="text-sm text-emerald-400/70 hover:text-emerald-400 transition-colors">
              ← Kembali ke Home
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppButton from '@/components/ui/AppButton.vue'

const auth = useAuthStore()
const router = useRouter()

const form = ref({ username: '', email: '', password: '' })
const loading = ref(false)
const error = ref('')
const success = ref(false)
const showPassword = ref(false)

const benefits = [
  'Budget plan otomatis berdasarkan penghasilan',
  'Tracking transaksi harian real-time',
  'Ringkasan keuangan bulanan lengkap',
  'Gratis selamanya, tanpa biaya tersembunyi',
]

async function handleRegister() {
  loading.value = true
  error.value = ''
  try {
    await auth.register(form.value.email, form.value.password, form.value.username)
    success.value = true
    setTimeout(() => router.push('/login'), 1500)
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Registrasi gagal, coba lagi'
  } finally {
    loading.value = false
  }
}
</script>
