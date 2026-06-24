import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<any>(null)
  const hasPersonalData = ref<boolean | null>(null)

  const isLoggedIn = computed(() => !!token.value)

  async function login(email: string, password: string) {
    const res = await api.post('/user/login', { email, password })
    token.value = res.data.data.token
    localStorage.setItem('token', token.value!)
    await fetchMe()
    await checkPersonalData()
  }

  async function register(email: string, password: string, username: string) {
    await api.post('/user/register', { email, password, username })
  }

  async function fetchMe() {
    const res = await api.get('/user/me')
    user.value = res.data.data
  }

  async function checkPersonalData() {
    try {
      await api.get('/personal-data/')
      hasPersonalData.value = true
    } catch {
      hasPersonalData.value = false
    }
  }

  function logout() {
    token.value = null
    user.value = null
    hasPersonalData.value = null
    localStorage.removeItem('token')
  }

  return { token, user, isLoggedIn, hasPersonalData, login, register, fetchMe, checkPersonalData, logout }
})
