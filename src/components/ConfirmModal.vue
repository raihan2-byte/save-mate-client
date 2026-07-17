<template>
  <Transition name="modal-fade">
    <div v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @click.self="$emit('update:modelValue', false)">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('update:modelValue', false)" />
      <Transition name="modal-slide">
        <div v-if="modelValue" class="relative w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-6 z-10">

        <div class="text-center mb-6">
          <div class="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-2xl mx-auto mb-4">
            {{ icon }}
          </div>
          <h2 class="font-black text-white text-lg mb-1">{{ title }}</h2>
          <p class="text-slate-400 text-sm">{{ message }}</p>
        </div>

        <div class="flex gap-3">
          <button @click="$emit('update:modelValue', false)"
            class="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-sm transition-colors">
            Batal
          </button>
          <button @click="onConfirm" :disabled="loading"
            class="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold text-sm transition-colors disabled:opacity-50">
            {{ loading ? 'Menghapus...' : confirmLabel }}
          </button>
        </div>
      </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  message?: string
  confirmLabel?: string
  icon?: string
  loading?: boolean
}>(), {
  title: 'Hapus Data',
  message: 'Tindakan ini tidak bisa dibatalkan.',
  confirmLabel: 'Hapus',
  icon: '🗑️',
  loading: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': []
}>()

function onConfirm() {
  emit('confirm')
}
</script>

<style scoped>
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.25s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

.modal-slide-enter-active, .modal-slide-leave-active { transition: transform 0.25s ease, opacity 0.25s ease; }
.modal-slide-enter-from, .modal-slide-leave-to { transform: scale(0.95); opacity: 0; }
</style>
