<template>
  <button
    :type="type as 'button' | 'submit' | 'reset'"
    :disabled="disabled || loading"
    :class="[baseClasses, variantClasses, sizeClasses, { 'opacity-70 cursor-not-allowed': disabled || loading }]"
    @click="emit('click', $event)"
  >
    <!-- Spinner -->
    <svg
      v-if="loading"
      class="animate-spin -ml-1 mr-2 h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  type?: string
}>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  type: 'button',
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none'

const variantClasses = computed(() => ({
  primary: 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500',
  danger:  'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30',
  ghost:   'text-white/60 hover:text-white',
  outline: 'border border-white/20 text-white/80 hover:bg-white/5',
}[props.variant]))

const sizeClasses = computed(() => ({
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}[props.size]))
</script>
