import {
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import {
  doc, setDoc, getDoc, getDocs, collection,
} from 'firebase/firestore'
import { auth, db, secondaryAuth } from '@/firebase'

const USERS_COL = 'users'

export function usernameToEmail(username) {
  return `${username}@petitgo-erp.local`
}

export async function createUser({ username, password, firstName, lastName, phone, role }) {
  const email = usernameToEmail(username)
  const { user } = await createUserWithEmailAndPassword(secondaryAuth, email, password)
  await signOut(secondaryAuth)

  await setDoc(doc(db, USERS_COL, user.uid), {
    uid: user.uid,
    username,
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim(),
    phone: phone || '',
    role,
    email,
    createdAt: new Date().toISOString(),
  })

  return user.uid
}

export async function getUsers() {
  const snap = await getDocs(collection(db, USERS_COL))
  return snap.docs.map(d => d.data())
}

export async function getUserByUid(uid) {
  const snap = await getDoc(doc(db, USERS_COL, uid))
  return snap.exists() ? snap.data() : null
}

export function generatePassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
