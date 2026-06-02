import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchSheetData } from '@/services/googleSheets'

export const useSheetsStore = defineStore('sheets', () => {
  const dashboardData = ref(null)
  const orderData = ref([])
  const boxData = ref([])
  const loading = ref({ dashboard: false, orders: false, boxes: false })
  const errors = ref({ dashboard: null, orders: null, boxes: null })

  const apiKey = ref(localStorage.getItem('petitgo_api_key') || '')
  const spreadsheetId = ref(
    localStorage.getItem('petitgo_sheet_id') ||
    '1qY3QwT1POdYhgE1jeTWsxqLlra2CsUdsXVa2E8wl60c'
  )

  function saveConfig(key, sheetId) {
    apiKey.value = key
    spreadsheetId.value = sheetId
    localStorage.setItem('petitgo_api_key', key)
    localStorage.setItem('petitgo_sheet_id', sheetId)
  }

  async function loadDashboard() {
    loading.value.dashboard = true
    errors.value.dashboard = null
    try {
      const data = await fetchSheetData(spreadsheetId.value, 'Dashboard', apiKey.value)
      dashboardData.value = parseDashboardData(data)
    } catch (e) {
      errors.value.dashboard = e.message
    } finally {
      loading.value.dashboard = false
    }
  }

  async function loadOrders() {
    loading.value.orders = true
    errors.value.orders = null
    try {
      const data = await fetchSheetData(spreadsheetId.value, 'Order Summary', apiKey.value)
      orderData.value = parseOrderData(data)
    } catch (e) {
      errors.value.orders = e.message
    } finally {
      loading.value.orders = false
    }
  }

  async function loadBoxes() {
    loading.value.boxes = true
    errors.value.boxes = null
    try {
      const data = await fetchSheetData(spreadsheetId.value, 'ทั่วไป', apiKey.value)
      boxData.value = parseBoxData(data)
    } catch (e) {
      errors.value.boxes = e.message
    } finally {
      loading.value.boxes = false
    }
  }

  function setOrderData(data) {
    orderData.value = data
  }

  function setBoxData(data) {
    boxData.value = data
  }

  return {
    dashboardData, orderData, boxData,
    loading, errors,
    apiKey, spreadsheetId,
    saveConfig, loadDashboard, loadOrders, loadBoxes,
    setOrderData, setBoxData,
  }
})

function parseThaiCurrency(value) {
  if (!value) return 0
  const str = String(value).replace(/[฿,\s]/g, '')
  if (str.startsWith('(') && str.endsWith(')')) {
    return -(parseFloat(str.slice(1, -1)) || 0)
  }
  return parseFloat(str) || 0
}

function parseThaiPercent(value) {
  if (!value) return 0
  return parseFloat(String(value).replace('%', '')) || 0
}

function parseDashboardData(rawData) {
  if (!rawData || !rawData.values) return null

  const rows = rawData.values
  const monthly = []
  const summary = []

  // Find the table: "Order Time - ปี-เดือน | Count | Revenue | ..."
  let headerIdx = -1
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (row.some(c => c && c.includes('Count') && c !== 'Count') ||
        (row.includes('Count') && row.some(c => c && c.includes('Revenue')))) {
      headerIdx = i
      break
    }
  }

  // Also scan for rows matching ปี-เดือน pattern (YYYY-THMONTH)
  const thMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
  const monthPattern = new RegExp(`\\d{4}-(${thMonths.join('|')})`)

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row || !row[0]) continue
    if (monthPattern.test(row[0])) {
      // Determine table type by header above
      const label = row[0]
      // Try to parse as monthly summary: month, count, revenue, profit_before, box, profit_after
      const count = parseInt(row[1]) || 0
      const revenue = parseThaiCurrency(row[2])
      const profitBefore = parseThaiCurrency(row[3])
      const boxCost = parseThaiCurrency(row[4])
      const netProfit = parseThaiCurrency(row[5])
      const avgPct = parseThaiPercent(row[6])

      // Only add if it looks like a real data row
      if (count > 0 || revenue !== 0) {
        monthly.push({ month: label, count, revenue, profitBefore, boxCost, netProfit, avgPct })
      } else {
        // Might be the detailed summary table
        const rev = parseThaiCurrency(row[1])
        const estProfit = parseThaiCurrency(row[2])
        const profit = parseThaiCurrency(row[3])
        const orders = parseInt(row[4]) || 0
        const varCost = parseThaiCurrency(row[5])
        const fixCost = parseThaiCurrency(row[6])
        const netP = parseThaiCurrency(row[7])
        const pctGross = parseThaiPercent(row[8])
        const pctNet = parseThaiPercent(row[9])

        if (rev > 0 || orders > 0) {
          summary.push({ month: label, revenue: rev, estProfit, profit, orders, varCost, fixCost, netProfit: netP, pctGross, pctNet })
        }
      }
    }
  }

  return { monthly, summary }
}

function parseOrderData(rawData) {
  if (!rawData || !rawData.values || rawData.values.length < 2) return []

  const rows = rawData.values
  // Find header row
  const headerIdx = rows.findIndex(row =>
    row.some(c => c && (c.includes('Order No') || c.includes('Marketplace') || c.includes('Order Time')))
  )
  if (headerIdx === -1) return []

  const headers = rows[headerIdx].map(h => String(h || '').trim())
  const orders = []

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || !row[0]) continue
    const obj = {}
    headers.forEach((h, idx) => {
      obj[h] = row[idx] || ''
    })
    orders.push(obj)
  }

  return orders
}

function parseBoxData(rawData) {
  if (!rawData || !rawData.values) return []

  const rows = rawData.values
  // Find box inventory section
  const headerIdx = rows.findIndex(row =>
    row.some(c => c && c.includes('วันที่ตรวจ')) &&
    row.some(c => c && c.includes('Size'))
  )
  if (headerIdx === -1) return []

  const DATE_RE = /^\d{1,2}\/\d{1,2}\/\d{2,4}/
  const VALID_SIZES = new Set(['0', 'A', 'B', '2B', 'C', 'C+8', 'D', 'E', '2E', 'F', 'F Tong', 'G', 'Reuse'])

  const boxes = []
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || !row[0]) continue
    const dateVal = String(row[0] || '')
    if (dateVal.includes('รวม') || dateVal.includes('ใบปะหน้า') || dateVal.includes('เทป')) break
    if (!DATE_RE.test(dateVal)) continue

    const size = String(row[1] || '').trim()
    if (!size || !VALID_SIZES.has(size)) continue

    boxes.push({
      date: dateVal,
      size,
      count: parseInt(row[2]) || 0,
      unitPrice: parseThaiCurrency(row[3]),
      totalValue: parseThaiCurrency(row[4]),
    })
  }

  return boxes
}
