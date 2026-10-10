import api from './api'

export async function getJobs() {
  const res = await api.get('/jobs')
  return res.data
}

export async function runJob(id) {
  const res = await api.post(`/jobs/${id}/run`)
  return res.data // { triggeredAt }
}
