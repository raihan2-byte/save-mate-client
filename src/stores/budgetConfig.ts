import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api'

export interface SavingTypeRatio {
  save: number
  spend: number
}

export interface BudgetConfig {
  saving_types: Record<string, SavingTypeRatio>
  food_pct_of_spending: number
}

/**
 * The allocation ruleset, fetched from the server.
 *
 * These percentages used to be hardcoded here as well as in the Go service.
 * The two copies happened to agree, but nothing enforced it — changing one side
 * would have shown users a preview that quietly disagreed with the budget they
 * actually got. There is deliberately no local fallback: showing nothing beats
 * showing numbers the server does not stand behind.
 */
export const useBudgetConfigStore = defineStore('budgetConfig', () => {
  const config = ref<BudgetConfig | null>(null)
  const loading = ref(false)

  async function fetch() {
    if (config.value || loading.value) return
    loading.value = true
    try {
      const res = await api.get('/budget-config/')
      config.value = res.data.data ?? null
    } catch {
      config.value = null
    } finally {
      loading.value = false
    }
  }

  function ratioFor(savingType: string): SavingTypeRatio | null {
    const types = config.value?.saving_types
    if (!types) return null
    return types[savingType] ?? types.recommendation ?? null
  }

  return { config, loading, fetch, ratioFor }
})
