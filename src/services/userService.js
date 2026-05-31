import {
  doc, getDoc,
} from 'firebase/firestore'
import { db } from '@/firebase'
import api from '@/services/api'

const USERS_COL = 'users'

export async function getUsers() {
  const { data } = await api.get('/users')
  return data
}

export async function getUserByUid(uid) {
  const snap = await getDoc(doc(db, USERS_COL, uid))
  return snap.exists() ? snap.data() : null
}
