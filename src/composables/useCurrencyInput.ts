import { ref, computed } from 'vue'

/**
 * Auto-formats a numeric amount input with thousand separators (1000 → 1.000).
 * Returns `displayValue` (string for v-model on text input) and `numericValue` (number for API payload).
 */
export function useCurrencyInput(initial = 0) {
  const raw = ref(initial > 0 ? String(initial) : '')

  const displayValue = computed({
    get() {
      if (!raw.value) return ''
      const digits = raw.value.replace(/\D/g, '')
      return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    },
    set(val: string) {
      raw.value = val.replace(/\D/g, '')
    },
  })

  const numericValue = computed(() => {
    const n = parseInt(raw.value || '0', 10)
    return isNaN(n) ? 0 : n
  })

  function reset() {
    raw.value = ''
  }

  return { displayValue, numericValue, reset }
}
