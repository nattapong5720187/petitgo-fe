import axios from 'axios'

const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets'

export async function fetchSheetData(spreadsheetId, sheetName, apiKey) {
  if (!apiKey) {
    throw new Error('กรุณาตั้งค่า Google Sheets API Key ในหน้า Settings ก่อน')
  }

  const range = encodeURIComponent(sheetName)
  const url = `${BASE_URL}/${spreadsheetId}/values/${range}`

  const response = await axios.get(url, {
    params: { key: apiKey },
  })

  return response.data
}

export function formatThaiCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) return '-'
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatNumber(value) {
  if (value === null || value === undefined || isNaN(value)) return '-'
  return new Intl.NumberFormat('th-TH').format(value)
}
