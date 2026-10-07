import api from './api'

export async function getCookies() {
  const res = await api.get('/bigseller/cookies')
  return res.data
}

export async function updateCookie(id, cookie) {
  const res = await api.put(`/bigseller/cookies/${id}`, { cookie })
  return res.data
}
