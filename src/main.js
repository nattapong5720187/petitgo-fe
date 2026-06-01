import { createApp } from 'vue'
import { createPinia } from 'pinia'
import naive from 'naive-ui'
import App from './App.vue'
import router from './router'
import { authReady } from './firebase'
import { useAuthStore } from './stores/auth'

;(async () => {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(router)
  app.use(naive)

  const authStore = useAuthStore()
  await authReady

  const liffId = import.meta.env.VITE_LIFF_ID
  const { isLiffBrowser, initLiff, liff } = liffId
    ? await import('./liff')
    : { isLiffBrowser: () => false, initLiff: async () => {}, liff: null }

  if (liffId && isLiffBrowser()) {
    await initLiff()
    if (!authStore.isLoggedIn) {
      // Not logged in inside LINE browser — auto-login via LIFF
      if (!liff.isLoggedIn()) {
        liff.login() // redirects to LINE auth, execution stops here
        return
      }
      await authStore.loginWithLiff()
    } else {
      // Already have a token — validate it; if stale, re-authenticate via LIFF
      const ok = await authStore.fetchMe()
      if (!ok && liff.isLoggedIn()) {
        await authStore.loginWithLiff()
      }
    }
  } else {
    if (authStore.isLoggedIn) {
      const ok = await authStore.fetchMe()
      if (!ok) await router.replace('/login')
    }
  }

  app.mount('#app')
})()
