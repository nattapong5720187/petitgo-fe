import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db, googleProvider } from '@/firebase'

const TOKEN_KEY = 'petitgo_access_token'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const userProfile = ref(null)
  const loading = ref(true)

  const isLoggedIn = computed(() => !!user.value && !!localStorage.getItem(TOKEN_KEY))
  const isAdmin = computed(() => userProfile.value?.role === 'ADMIN' || userProfile.value?.role === 'admin')

  onAuthStateChanged(auth, async (firebaseUser) => {
    try {
      if (firebaseUser) {
        user.value = firebaseUser

        // 1. Firestore is source of truth for profile (query by uid field, not doc ID)
        try {
          const q = query(collection(db, 'users'), where('uid', '==', firebaseUser.uid))
          const snap = await getDocs(q)
          if (!snap.empty) {
            const data = snap.docs[0].data()
            userProfile.value = data
            localStorage.setItem('petitgo_profile_' + firebaseUser.uid, JSON.stringify(data))
            return
          }
        } catch {
          // Firestore unavailable — fall through to cache
        }

        // 2. localStorage profile cache (offline fallback)
        const cached = localStorage.getItem('petitgo_profile_' + firebaseUser.uid)
        if (cached) {
          userProfile.value = JSON.parse(cached)
          return
        }

        userProfile.value = null
      } else {
        user.value = null
        userProfile.value = null
      }
    } catch (e) {
      console.error('[onAuthStateChanged]', e.code, e.message)
    } finally {
      loading.value = false
    }
  })

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
      // Set profile immediately so isAdmin is correct before onAuthStateChanged finishes
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

  async function logout() {
    localStorage.removeItem(TOKEN_KEY)
    await signOut(auth)
  }

  return { user, userProfile, isLoggedIn, isAdmin, loading, loginWithGoogle, logout }
})
