<template>
  <button
    :type="type as 'button' | 'submit' | 'reset'"
    :disabled="disabled || loading"
    :class="[baseClasses, variantClasses, sizeClasses, { 'opacity-70 cursor-not-allowed': disabled || loading }]"
    @click="emit('click', $event)"
  >
    <Loader2 v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4" />
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'

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
