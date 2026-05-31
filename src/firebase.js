import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

// Firestore — default database (ID: petitgo-erp ต้องสร้างใน Firebase Console ก่อน)
// ถ้าใช้ named database: getFirestore(app, 'petitgo-erp')
export const db = getFirestore(app)

// Promise ที่ resolve เมื่อ Firebase Auth พร้อมใช้งาน
export const authReady = new Promise(resolve => {
  const unsub = onAuthStateChanged(auth, () => {
    unsub()
    resolve()
  })
})
