import {
  doc, getDoc, getDocs, collection,
} from 'firebase/firestore'
import { db } from '@/firebase'

const USERS_COL = 'users'

export async function getUsers() {
  const snap = await getDocs(collection(db, USERS_COL))
  return snap.docs.map(d => d.data())
}

export async function getUserByUid(uid) {
  const snap = await getDoc(doc(db, USERS_COL, uid))
  return snap.exists() ? snap.data() : null
}
