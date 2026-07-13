import { ref } from 'vue'

export function useApiState<T>() {
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function execute(fn: () => Promise<T>) {
    loading.value = true
    error.value = null
    try {
      data.value = await fn()
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Terjadi kesalahan'
    } finally {
      loading.value = false
    }
  }

  function reset() {
    data.value = null
    error.value = null
    loading.value = false
  }

  return { data, loading, error, execute, reset }
}
