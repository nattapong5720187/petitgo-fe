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

  // Boot the auth store before the first navigation so the router guard
  // never sees an uninitialised loading state.
  useAuthStore()
  await authReady

  app.mount('#app')
})()
