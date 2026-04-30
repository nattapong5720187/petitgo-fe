import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('petitgo_user') || 'null'))

  const isLoggedIn = computed(() => !!user.value)

  function login(username, password) {
    if (username === 'admin' && password === '123456') {
      const userData = { username, role: 'admin', loginAt: new Date().toISOString() }
      user.value = userData
      localStorage.setItem('petitgo_user', JSON.stringify(userData))
      return true
    }
    return false
  }

  function logout() {
    user.value = null
    localStorage.removeItem('petitgo_user')
  }

  return { user, isLoggedIn, login, logout }
})
