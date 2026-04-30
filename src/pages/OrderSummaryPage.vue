<template>
  <div class="orders-page">
    <!-- Toolbar -->
    <n-card :bordered="false" style="margin-bottom: 16px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06)">
      <div class="toolbar">
        <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
          <!-- Search -->
          <n-input
            v-model:value="search"
            placeholder="ค้นหา Order No, ชื่อสินค้า..."
            clearable
            style="width: 260px"
          >
            <template #prefix><n-icon :component="SearchOutline" /></template>
          </n-input>

          <!-- Marketplace filter -->
          <n-select
            v-model:value="filterMarket"
            :options="marketplaceOptions"
            placeholder="ตลาด"
            clearable
            style="width: 140px"
          />

          <!-- Status filter -->
          <n-select
            v-model:value="filterStatus"
            :options="statusOptions"
            placeholder="สถานะ"
            clearable
            style="width: 140px"
          />
        </div>

        <div style="display: flex; gap: 8px;">
          <!-- Load from Google Sheets -->
          <n-button
            :loading="sheetsStore.loading.orders"
            @click="loadFromSheets"
            ghost
            type="primary"
            :disabled="!sheetsStore.apiKey"
          >
            <template #icon><n-icon :component="CloudDownloadOutline" /></template>
            โหลดจาก Sheets
          </n-button>

          <!-- Import Excel -->
          <n-upload
            :show-file-list="false"
            accept=".xlsx,.xls,.csv"
            @change="handleFileUpload"
          >
            <n-button type="primary">
              <template #icon><n-icon :component="DocumentOutline" /></template>
              Import Excel
            </n-button>
          </n-upload>

          <!-- Export -->
          <n-button @click="exportToExcel" ghost>
            <template #icon><n-icon :component="DownloadOutline" /></template>
            Export
          </n-button>
        </div>
      </div>
    </n-card>

    <!-- Stats bar -->
    <n-grid :cols="4" :x-gap="12" style="margin-bottom: 16px" responsive="screen" :collapsed-cols="2">
      <n-gi>
        <n-card size="small" :bordered="false" style="border-radius: 10px; background: #f0fdf4">
          <n-statistic label="จำนวน Order" :value="filteredOrders.length" />
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small" :bordered="false" style="border-radius: 10px; background: #eff6ff">
          <n-statistic label="รายรับรวม" :value="totalRevenue" :precision="0">
            <template #prefix>฿</template>
          </n-statistic>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small" :bordered="false" style="border-radius: 10px; background: #fefce8">
          <n-statistic label="กำไรรวม" :value="totalProfit" :precision="0">
            <template #prefix>฿</template>
          </n-statistic>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small" :bordered="false" style="border-radius: 10px; background: #fdf4ff">
          <n-statistic label="% กำไรเฉลี่ย" :value="avgProfitPct" :precision="2">
            <template #suffix>%</template>
          </n-statistic>
        </n-card>
      </n-gi>
    </n-grid>

    <!-- Error -->
    <n-alert v-if="sheetsStore.errors.orders" type="error" :bordered="false" style="margin-bottom: 16px">
      {{ sheetsStore.errors.orders }}
    </n-alert>

    <!-- Table -->
    <n-card :bordered="false" style="border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06)">
      <n-data-table
        :columns="columns"
        :data="filteredOrders"
        :pagination="pagination"
        :loading="sheetsStore.loading.orders"
        :scroll-x="1800"
        size="small"
        striped
        flex-height
        style="min-height: 400px"
        :row-key="row => row['Order No'] || row['order_no'] || Math.random()"
      />
    </n-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue'
import { NTag, NButton } from 'naive-ui'
import { useMessage } from 'naive-ui'
import {
  SearchOutline, CloudDownloadOutline, DocumentOutline,
  DownloadOutline,
} from '@vicons/ionicons5'
import * as XLSX from 'xlsx'
import { useSheetsStore } from '@/stores/sheets'

const sheetsStore = useSheetsStore()
const message = useMessage()

const search = ref('')
const filterMarket = ref(null)
const filterStatus = ref(null)

onMounted(() => {
  if (sheetsStore.apiKey && sheetsStore.orderData.length === 0) {
    loadFromSheets()
  }
})

function loadFromSheets() {
  sheetsStore.loadOrders()
}

// ---- File Upload ----
function handleFileUpload({ file }) {
  const f = file.file
  if (!f) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
      sheetsStore.setOrderData(jsonData)
      message.success(`Import สำเร็จ: ${jsonData.length} รายการ`)
    } catch (err) {
      message.error('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + err.message)
    }
  }
  reader.readAsArrayBuffer(f)
  return false
}

// ---- Export ----
function exportToExcel() {
  if (filteredOrders.value.length === 0) {
    message.warning('ไม่มีข้อมูลสำหรับ Export')
    return
  }
  const ws = XLSX.utils.json_to_sheet(filteredOrders.value)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Order Summary')
  XLSX.writeFile(wb, `order_summary_${new Date().toISOString().slice(0, 10)}.xlsx`)
  message.success('Export สำเร็จ')
}

// ---- Filters ----
const orders = computed(() => sheetsStore.orderData)

const marketplaceOptions = computed(() => {
  const markets = [...new Set(orders.value.map(o => o['Marketplace'] || o['marketplace']).filter(Boolean))]
  return markets.map(m => ({ label: m, value: m }))
})

const statusOptions = computed(() => {
  const statuses = [...new Set(orders.value.map(o => o['Status'] || o['status']).filter(Boolean))]
  return statuses.map(s => ({ label: s, value: s }))
})

const filteredOrders = computed(() => {
  let data = orders.value
  if (search.value) {
    const q = search.value.toLowerCase()
    data = data.filter(o =>
      Object.values(o).some(v => String(v || '').toLowerCase().includes(q))
    )
  }
  if (filterMarket.value) {
    data = data.filter(o => (o['Marketplace'] || o['marketplace']) === filterMarket.value)
  }
  if (filterStatus.value) {
    data = data.filter(o => (o['Status'] || o['status']) === filterStatus.value)
  }
  return data
})

// ---- Stats ----
const totalRevenue = computed(() => {
  return filteredOrders.value.reduce((sum, o) => {
    const v = parseFloat(String(o['Revenue'] || o['revenue'] || '0').replace(/[฿,\s]/g, '')) || 0
    return sum + v
  }, 0)
})

const totalProfit = computed(() => {
  return filteredOrders.value.reduce((sum, o) => {
    const v = parseFloat(String(o['E. Profit'] || o['profit'] || '0').replace(/[฿,(),-\s]/g, '').replace('(', '-')) || 0
    return sum + v
  }, 0)
})

const avgProfitPct = computed(() => {
  if (!totalRevenue.value) return 0
  return (totalProfit.value / totalRevenue.value) * 100
})

// ---- Table Columns ----
const allHeaders = computed(() => {
  if (orders.value.length === 0) return []
  return Object.keys(orders.value[0])
})

function statusTag(status) {
  const map = {
    'Shipped': 'success',
    'Completed': 'success',
    'Cancelled': 'error',
    'Returned': 'warning',
    'Processing': 'info',
  }
  return h(NTag, { type: map[status] || 'default', size: 'small', round: true }, { default: () => status || '-' })
}

const priorityColumns = ['Order No', 'Marketplace', 'Status', 'Ordered Time', 'Product Name', 'Variation Name', 'Price', 'Quantity', 'Revenue', 'E. Profit', 'Cost']

const columns = computed(() => {
  if (allHeaders.value.length === 0) {
    return [
      { title: 'ยังไม่มีข้อมูล', key: 'empty', render: () => '-' }
    ]
  }

  // Sort headers: priority first, then rest
  const sortedHeaders = [
    ...priorityColumns.filter(p => allHeaders.value.includes(p)),
    ...allHeaders.value.filter(h => !priorityColumns.includes(h)),
  ]

  return sortedHeaders.slice(0, 20).map(key => ({
    title: key,
    key,
    width: key === 'Product Name' ? 200 : key === 'Ordered Time' ? 150 : 120,
    ellipsis: { tooltip: true },
    render: (row) => {
      const val = row[key]
      if (key === 'Status' || key === 'status') return statusTag(val)
      if (key === 'Marketplace') return h(NTag, { size: 'tiny', type: val === 'Shopee' ? 'warning' : val === 'Lazada' ? 'info' : 'default' }, { default: () => val || '-' })
      return val || '-'
    },
  }))
})

const pagination = ref({
  page: 1,
  pageSize: 20,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  showQuickJumper: true,
  prefix: ({ itemCount }) => `ทั้งหมด ${itemCount} รายการ`,
})
</script>

<style scoped>
.orders-page {
  max-width: 1400px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
</style>
