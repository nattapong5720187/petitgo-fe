import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase'
import { usernameToEmail } from '@/services/userService'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const userProfile = ref(null)
  const loading = ref(true)

  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => userProfile.value?.role === 'admin')

  onAuthStateChanged(auth, async (firebaseUser) => {
    try {
      if (firebaseUser) {
        user.value = firebaseUser

        // 1. Try Firestore (source of truth)
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
          if (snap.exists()) {
            userProfile.value = snap.data()
            localStorage.setItem('petitgo_profile_' + firebaseUser.uid, JSON.stringify(snap.data()))
            return
          }
        } catch {
          // Firestore blocked — fall through to fallbacks
        }

        // 2. Use localStorage cache (for users who logged in before)
        const cached = localStorage.getItem('petitgo_profile_' + firebaseUser.uid)
        if (cached) {
          userProfile.value = JSON.parse(cached)
          return
        }

        // 3. Derive admin profile from email (ใช้เมื่อ Firestore ยังไม่พร้อม)
        const adminEmail = usernameToEmail('admin')
        if (firebaseUser.email === adminEmail) {
          const profileData = {
            uid: firebaseUser.uid,
            username: 'admin',
            firstName: 'Admin',
            lastName: 'Petitgo',
            phone: '',
            role: 'admin',
            email: adminEmail,
            createdAt: new Date().toISOString(),
          }
          userProfile.value = profileData
          localStorage.setItem('petitgo_profile_' + firebaseUser.uid, JSON.stringify(profileData))
          // Write to Firestore in background (จะสำเร็จเมื่อ rules พร้อม)
          setDoc(doc(db, 'users', firebaseUser.uid), profileData).catch(() => {})
        } else {
          userProfile.value = null
        }
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

  async function login(username, password) {
    const email = usernameToEmail(username)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return true
    } catch (err) {
      // สร้าง admin ครั้งแรกถ้ายังไม่มีใน Firebase Auth
      if (
        (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') &&
        username === 'admin' && password === '123456'
      ) {
        return await _seedAdmin()
      }
      return false
    }
  }

  async function _seedAdmin() {
    try {
      const email = usernameToEmail('admin')
      const { user: adminUser } = await createUserWithEmailAndPassword(auth, email, '123456')
      await setDoc(doc(db, 'users', adminUser.uid), {
        uid: adminUser.uid,
        username: 'admin',
        firstName: 'Admin',
        lastName: 'Petitgo',
        phone: '',
        role: 'admin',
        email,
        createdAt: new Date().toISOString(),
      })
      return true
    } catch (e) {
      console.error('[seedAdmin] error:', e.code, e.message)
      return false
    }
  }

  async function logout() {
    await signOut(auth)
  }

  return { user, userProfile, isLoggedIn, isAdmin, loading, login, logout }
})
