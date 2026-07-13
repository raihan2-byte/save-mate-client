import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api'
import type { PersonalData } from '@/types'

export const usePersonalDataStore = defineStore('personalData', () => {
  const data = ref<PersonalData | null>(null)
  const loading = ref(false)

  async function fetch() {
    if (loading.value) return
    loading.value = true
    try {
      const res = await api.get('/personal-data/')
      data.value = res.data.data
    } catch {
      data.value = null
    } finally {
      loading.value = false
    }
  }

  function invalidate() {
    data.value = null
  }

  return { data, loading, fetch, invalidate }
})
