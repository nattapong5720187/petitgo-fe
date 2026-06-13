import api from './api'

export async function getSlips() {
  const res = await api.get('/slip')
  return res.data
}

export async function uploadSlipImage(file) {
  const formData = new FormData()
  formData.append('image', file)
  const res = await api.post('/slip/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data // { image_url, path }
}

export async function createSlip(data) {
  const res = await api.post('/slip', data)
  return res.data
}
