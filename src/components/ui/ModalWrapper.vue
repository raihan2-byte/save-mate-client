<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm"
        @click.self="close"
      >
        <Transition name="modal-slide">
          <div
            v-if="modelValue"
            :class="['w-full rounded-3xl border border-white/10 bg-slate-900 p-5 mx-4 md:mx-0', maxWidth]"
          >
            <!-- Mobile drag handle -->
            <div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5 md:hidden" />
            <slot />
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: boolean
  maxWidth?: string
}>(), {
  maxWidth: 'max-w-md',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function close() {
  emit('update:modelValue', false)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.modelValue) close()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
/* Overlay fade */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Mobile: slide up / Desktop: scale */
.modal-slide-enter-active,
.modal-slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

/* Mobile default */
.modal-slide-enter-from,
.modal-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

@media (min-width: 768px) {
  .modal-slide-enter-from,
  .modal-slide-leave-to {
    transform: scale(0.95);
    opacity: 0;
  }
}
</style>
