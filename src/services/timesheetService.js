import api from './api'

export async function createTimesheet(data) {
  const res = await api.post('/timesheet', data)
  return res.data
}

export async function getTimesheets(status) {
  const params = status ? { status } : {}
  const res = await api.get('/timesheet', { params })
  return res.data
}

export async function updateTimesheet(id, data) {
  const res = await api.put(`/timesheet/${id}`, data)
  return res.data
}

export async function deleteTimesheet(id) {
  const res = await api.delete(`/timesheet/${id}`)
  return res.data
}

export function calcCompensation(type, startAt, endAt) {
  const hours = (new Date(endAt) - new Date(startAt)) / 3_600_000
  if (type === 'OT-WD') return 40 * 1.5 * hours
  if (type === 'OT-DO') return 40 * 1 * hours
  if (type === 'LIVE') return hours >= 2 ? 400 : 300
  if (type === 'CS-FINANCE') return 1000
  return 0
}
