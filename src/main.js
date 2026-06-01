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

  // On every page load, restore the user profile from the backend if a token exists.
  // If the token is invalid/expired, fetchMe clears state and we redirect to login.
  if (authStore.isLoggedIn) {
    const ok = await authStore.fetchMe()
    if (!ok) {
      await router.replace('/login')
    }
  }

  app.mount('#app')
})()
