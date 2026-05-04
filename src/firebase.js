import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAaVJ2tKrovakENIgMrUjkhn0UKIEuFxmQ',
  authDomain: 'pet-it-go.firebaseapp.com',
  projectId: 'pet-it-go',
  storageBucket: 'pet-it-go.appspot.com',
  messagingSenderId: '895634110868',
  appId: '1:895634110868:web:cca265638d7650b9de3781',
  measurementId: 'G-XBT3642LRP',
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

// Firestore — default database (ID: petitgo-erp ต้องสร้างใน Firebase Console ก่อน)
// ถ้าใช้ named database: getFirestore(app, 'petitgo-erp')
export const db = getFirestore(app)

// Secondary app สำหรับสร้าง user โดยไม่ logout admin ออก
export const secondaryApp = initializeApp(firebaseConfig, 'secondary')
export const secondaryAuth = getAuth(secondaryApp)

// Promise ที่ resolve เมื่อ Firebase Auth พร้อมใช้งาน
export const authReady = new Promise(resolve => {
  const unsub = onAuthStateChanged(auth, () => {
    unsub()
    resolve()
  })
})
