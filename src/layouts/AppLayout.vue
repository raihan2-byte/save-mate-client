<template>
  <div class="min-h-screen bg-slate-950 text-white flex">

    <!-- ===== SIDEBAR (desktop) ===== -->
    <aside class="hidden md:flex w-64 min-w-[220px] flex-col fixed h-full border-r border-white/10 bg-slate-900/80 backdrop-blur-xl z-20">

      <!-- Logo -->
      <div class="p-6 border-b border-white/10">
        <RouterLink to="/" class="flex items-center gap-3 group">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center font-black text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-all">
            CW
          </div>
          <div>
            <p class="font-black text-white leading-none truncate">CipuyWallet</p>
            <p class="text-[11px] text-slate-500 mt-0.5 truncate">Smart Budget Manager</p>
          </div>
        </RouterLink>
      </div>

      <!-- Nav -->
      <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
        <p class="text-[10px] font-semibold uppercase tracking-widest text-slate-600 px-3 mb-3">Menu Utama</p>
        <SidebarLink to="/app"              :icon="icons.home"    label="Dashboard" />
        <SidebarLink to="/app/transactions" :icon="icons.tx"      label="Transaksi" />
        <SidebarLink to="/app/budget"       :icon="icons.budget"  label="Budget Plan" />
        <p class="text-[10px] font-semibold uppercase tracking-widest text-slate-600 px-3 mb-1 mt-5">Keuangan</p>
        <SidebarLink to="/app/income"       :icon="icons.income"  label="Pemasukan" />
        <SidebarLink to="/app/summary"      :icon="icons.summary" label="Ringkasan Bulanan" />
      </nav>

      <!-- Footer -->
      <div class="p-4 border-t border-white/10 space-y-1">
        <SidebarLink to="/app/profile" :icon="icons.profile" label="Profil" />
        <button @click="handleLogout"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium">
          <span class="text-base">🚪</span> Keluar
        </button>
      </div>
    </aside>

    <!-- ===== MAIN CONTENT ===== -->
    <div class="flex-1 md:ml-64 flex flex-col min-h-screen">

      <!-- Mobile top bar -->
      <header class="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-10">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center font-black text-white text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            CW
          </div>
          <span class="font-black text-white">CipuyWallet</span>
        </div>
        <RouterLink to="/app/profile" class="w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-slate-300 hover:border-emerald-500/40 transition-all">
          👤
        </RouterLink>
      </header>

      <!-- Page content -->
      <main class="flex-1 pb-24 md:pb-0">
        <RouterView />
      </main>
    </div>

    <!-- ===== BOTTOM NAV (mobile) ===== -->
    <nav class="fixed bottom-0 left-0 right-0 md:hidden z-20 border-t border-white/10 bg-slate-950/90 backdrop-blur-xl flex" style="padding-bottom: env(safe-area-inset-bottom)">
      <BottomNavItem to="/app"              :icon="icons.home"    label="Home" />
      <BottomNavItem to="/app/transactions" :icon="icons.tx"      label="Transaksi" />
      <BottomNavItem to="/app/budget"       :icon="icons.budget"  label="Budget" />
      <BottomNavItem to="/app/summary"      :icon="icons.summary" label="Ringkasan" />
      <BottomNavItem to="/app/profile"      :icon="icons.profile" label="Profil" />
    </nav>

  </div>
</template>

<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import SidebarLink from '@/components/SidebarLink.vue'
import BottomNavItem from '@/components/BottomNavItem.vue'

const auth = useAuthStore()
const router = useRouter()

const icons = {
  home:    '🏠',
  tx:      '💳',
  budget:  '📊',
  income:  '💰',
  expense: '🛍️',
  summary: '📈',
  profile: '👤',
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>
