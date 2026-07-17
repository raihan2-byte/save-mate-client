<template>
  <div class="relative min-h-screen bg-slate-950 overflow-hidden text-white">
    <!-- Blob glows -->
    <div class="pointer-events-none absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/20 blur-[180px] rounded-full" />
    <div class="pointer-events-none absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[180px] rounded-full" />
    <!-- Grid overlay -->
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
          <div class="badge-emerald w-fit">💸 Financial Freedom Starts Here</div>
          <h2 class="text-3xl lg:text-5xl font-black text-white leading-tight">
            Kelola uangmu.<br />
            <span class="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Bangun masa depanmu.
            </span>
          </h2>
          <p class="text-sm lg:text-lg text-slate-400 max-w-md">
            CipuyWallet membantu kamu merencanakan budget, mencatat transaksi harian,
            dan memahami pola keuanganmu secara real-time.
          </p>

          <div class="flex gap-6 lg:gap-10 flex-wrap">
            <div v-for="s in sideStats" :key="s.label">
              <p class="text-xl lg:text-3xl font-black" :class="s.color">{{ s.value }}</p>
              <p class="text-xs lg:text-sm text-slate-500">{{ s.label }}</p>
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
            <h1 class="text-2xl lg:text-3xl font-black text-white">Masuk ke akun</h1>
            <p class="text-slate-400 mt-2 text-sm lg:text-base">Lanjutkan perjalanan finansialmu.</p>
          </div>

          <form @submit.prevent="handleLogin" class="space-y-5">
            <div>
              <label class="block mb-2 text-slate-300 font-medium text-sm">Email</label>
              <input v-model="form.email" type="email" placeholder="masukkan email" class="input-dark" required />
            </div>
            <div>
              <label class="block mb-2 text-slate-300 font-medium text-sm">Password</label>
              <div class="relative">
                <input v-model="form.password" :type="showPassword ? 'text' : 'password'" placeholder="masukkan password" class="input-dark pr-11" required />
                <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors">
                  <Eye v-if="!showPassword" class="w-5 h-5" />
                  <EyeOff v-else class="w-5 h-5" />
                </button>
              </div>
            </div>

            <div v-if="error" class="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl px-4 py-3">
              {{ error }}
            </div>

            <AppButton type="submit" variant="primary" :loading="loading" class="w-full">
              Masuk
            </AppButton>

            <p class="text-center text-sm text-slate-500">
              Belum punya akun?
              <RouterLink to="/register" class="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                Daftar Gratis
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
import { Eye, EyeOff } from 'lucide-vue-next'

const auth = useAuthStore()
const router = useRouter()

const form = ref({ email: '', password: '' })
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

const sideStats = [
  { value: 'Auto', label: 'Budget Plan', color: 'text-white' },
  { value: '24/7', label: 'Tracking', color: 'text-emerald-400' },
  { value: 'UMP', label: 'Smart Analysis', color: 'text-cyan-400' },
]

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    await auth.login(form.value.email, form.value.password)
    router.push('/app')
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Email atau password salah'
  } finally {
    loading.value = false
  }
}
</script>
