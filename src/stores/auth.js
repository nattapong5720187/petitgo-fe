import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { signInWithPopup, signOut } from 'firebase/auth'
import { auth, googleProvider } from '@/firebase'
import api from '@/services/api'
import { initLiff, isLiffLoggedIn, liffLogin, getLiffAccessToken } from '@/services/liff'

const TOKEN_KEY = 'petitgo_access_token'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const userProfile = ref(null)
  const loading = ref(false)
  const token = ref(localStorage.getItem(TOKEN_KEY))

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => userProfile.value?.role === 'ADMIN' || userProfile.value?.role === 'admin')

  async function loginWithGoogle() {
    try {
      // 1. Google popup
      const { user: googleUser } = await signInWithPopup(auth, googleProvider)

      // 2. Get Firebase ID token
      const idToken = await googleUser.getIdToken()

      // 3. Exchange with backend — backend verifies token + checks Firestore role
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })

      if (!res.ok) {
        // User authenticated with Google but not registered / not allowed
        await signOut(auth)
        if (res.status === 403) return { ok: false, error: 'user_not_registered' }
        return { ok: false, error: 'backend_error' }
      }

      const { accessToken, user: backendUser } = await res.json()
      localStorage.setItem(TOKEN_KEY, accessToken)
      token.value = accessToken
      userProfile.value = backendUser

      return { ok: true }
    } catch (err) {
      if (
        err.code === 'auth/popup-closed-by-user' ||
        err.code === 'auth/cancelled-popup-request'
      ) {
        return { ok: false, cancelled: true }
      }
      console.error('[loginWithGoogle]', err.code || err.message)
      return { ok: false, error: 'unknown' }
    }
  }

  async function loginWithLiff() {
    try {
      await initLiff()

      if (!isLiffLoggedIn()) {
        liffLogin(window.location.href)
        // liff.login() redirects the page — nothing after this executes
        return { ok: false, redirecting: true }
      }

      const lineAccessToken = getLiffAccessToken()
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/liff-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: lineAccessToken }),
      })

      if (!res.ok) {
        if (res.status === 403) return { ok: false, error: 'user_not_registered' }
        return { ok: false, error: 'backend_error' }
      }

      const { accessToken, user: backendUser } = await res.json()
      localStorage.setItem(TOKEN_KEY, accessToken)
      token.value = accessToken
      userProfile.value = backendUser

      return { ok: true }
    } catch (err) {
      console.error('[loginWithLiff]', err)
      return { ok: false, error: 'unknown' }
    }
  }

  async function fetchMe() {
    if (!token.value) return false
    try {
      const { data } = await api.get('/user/me')
      userProfile.value = data
      return true
    } catch {
      token.value = null
      userProfile.value = null
      localStorage.removeItem(TOKEN_KEY)
      return false
    }
  }

  async function logout() {
    localStorage.removeItem(TOKEN_KEY)
    token.value = null
    userProfile.value = null
    await signOut(auth)
  }

  return { user, userProfile, isLoggedIn, isAdmin, loading, loginWithGoogle, loginWithLiff, logout, fetchMe }
})
