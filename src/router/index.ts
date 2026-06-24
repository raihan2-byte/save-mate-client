import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Landing page (public)
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { requiresGuest: true }
    },
    // Auth
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { requiresGuest: true }
    },
    // Onboarding
    {
      path: '/onboarding',
      name: 'onboarding',
      component: () => import('@/views/OnboardingView.vue'),
      meta: { requiresAuth: true }
    },
    // Main App
    {
      path: '/app',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue')
        },
        {
          path: 'transactions',
          name: 'transactions',
          component: () => import('@/views/TransactionsView.vue')
        },
        {
          path: 'budget',
          name: 'budget',
          component: () => import('@/views/BudgetView.vue')
        },
        {
          path: 'income',
          name: 'income',
          component: () => import('@/views/IncomeView.vue')
        },
{
          path: 'summary',
          name: 'summary',
          component: () => import('@/views/SummaryView.vue')
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/views/ProfileView.vue')
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/views/FinancialSettingsView.vue')
        },
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue')
    },
  ]
})

// Navigation guard
router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login' }
  }
  if (to.meta.requiresGuest && auth.isLoggedIn) {
    return '/app'
  }
  // Redirect to onboarding if logged in but no personal data yet
  if (auth.isLoggedIn && to.path.startsWith('/app')) {
    if (auth.hasPersonalData === null) {
      await auth.checkPersonalData()
    }
    if (auth.hasPersonalData === false) {
      return { name: 'onboarding' }
    }
  }
})

export default router
