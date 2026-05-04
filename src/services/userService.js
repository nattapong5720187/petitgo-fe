import {
  createUserWithEmailAndPassword,
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
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

export async function changePassword(currentPassword, newPassword) {
  const user = auth.currentUser
  if (!user) throw new Error('ไม่พบผู้ใช้งาน')
  const credential = EmailAuthProvider.credential(user.email, currentPassword)
  await reauthenticateWithCredential(user, credential)
  await updatePassword(user, newPassword)
}

export function generatePassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
