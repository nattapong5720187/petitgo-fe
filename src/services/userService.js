import api from '@/services/api'

export async function getUsers() {
  const { data } = await api.get('/users')
  return data
}

export async function updateUser(documentId, payload) {
  const { data } = await api.put(`/user/${documentId}`, payload)
  return data
}
