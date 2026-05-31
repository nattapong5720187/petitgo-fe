import { createRouter, createWebHistory } from 'vue-router'
import { watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/pages/DashboardPage.vue'),
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/pages/OrderSummaryPage.vue'),
      },
      {
        path: 'boxes',
        name: 'Boxes',
        component: () => import('@/pages/BoxManagementPage.vue'),
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/pages/SettingsPage.vue'),
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/pages/UserManagementPage.vue'),
        meta: { requiresAdmin: true },
      },
      {
        path: 'timesheet',
        name: 'Timesheet',
        component: () => import('@/pages/TimesheetPage.vue'),
      },
      {
        path: 'timesheet-approval',
        name: 'TimesheetApproval',
        component: () => import('@/pages/TimesheetApprovalPage.vue'),
        meta: { requiresAdmin: true },
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // รอให้ Firebase Auth โหลดเสร็จก่อนตรวจ route
  if (authStore.loading) {
    await new Promise(resolve => {
      const stop = watch(() => authStore.loading, val => {
        if (!val) { stop(); resolve() }
      })
    })
  }

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return next('/login')
  }
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return next('/dashboard')
  }
  if (to.path === '/login' && authStore.isLoggedIn) {
    return next('/dashboard')
  }
  next()
})

export default router
