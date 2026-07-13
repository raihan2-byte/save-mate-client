<template>
  <div key="s3">
    <div class="text-center mb-8">
      <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-3xl mx-auto mb-4"
        style="box-shadow: 0 0 40px rgba(59,130,246,0.35)">🗺️</div>
      <p class="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-1">Langkah 2</p>
      <h1 class="text-2xl font-black text-white">Kamu tinggal di mana?</h1>
      <p class="text-slate-400 text-sm mt-1">Digunakan sebagai referensi baseline biaya hidup</p>
    </div>

    <div class="glass-card p-6">
      <label class="block text-sm font-medium text-slate-300 mb-1.5">Kota / Wilayah Tinggal</label>
      <div v-if="loading" class="input-dark flex items-center gap-2 text-slate-500 text-sm">
        <span class="w-3 h-3 rounded-full border-2 border-slate-500 border-t-transparent animate-spin flex-shrink-0" />
        Memuat daftar kota...
      </div>
      <select v-else :value="region" @change="emit('update:region', ($event.target as HTMLSelectElement).value)"
        class="input-dark">
        <option value="" disabled>Pilih kota/wilayah...</option>
        <option v-for="r in regions" :key="r.region_id" :value="r.region_name">
          {{ r.region_name }}
        </option>
      </select>
      <p class="text-slate-600 text-xs mt-1">Pilih kota terdekat dengan tempat tinggalmu</p>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface Region { region_id: number | string; region_name: string }

defineProps<{
  region: string
  regions: Region[]
  loading: boolean
}>()

const emit = defineEmits<{
  'update:region': [value: string]
}>()
</script>
