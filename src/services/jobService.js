import api from './api'

export async function getJobs() {
  const res = await api.get('/jobs')
  return res.data
}
