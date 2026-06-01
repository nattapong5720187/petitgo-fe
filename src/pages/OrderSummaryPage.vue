<template>
  <div class="orders-page">
    <!-- Toolbar Card -->
    <Card style="margin-bottom: 16px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06)">
      <template #content>
        <div class="toolbar">
          <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center">
            <!-- Search -->
            <IconField>
              <InputIcon class="pi pi-search" />
              <InputText v-model="search" placeholder="ค้นหา Order No, ชื่อสินค้า..." class="search-input" />
            </IconField>

            <!-- Marketplace filter -->
            <Select
              v-model="filterMarket"
              :options="marketplaceOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="ตลาด"
              showClear
              style="width: 140px"
            />

            <!-- Status filter -->
            <Select
              v-model="filterStatus"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="สถานะ"
              showClear
              style="width: 140px"
            />
          </div>

          <div class="toolbar-actions">
            <Button
              icon="pi pi-cloud-download"
              label="โหลดจาก Sheets"
              :loading="sheetsStore.loading.orders"
              outlined
              :disabled="!sheetsStore.apiKey"
              @click="loadFromSheets"
            />
            <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" style="display:none" @change="handleFileChange" />
            <Button icon="pi pi-file" label="Import Excel" @click="fileInput.click()" />
            <Button icon="pi pi-download" label="Export" outlined @click="exportToExcel" />
          </div>
        </div>
      </template>
    </Card>

    <!-- Stats bar -->
    <div class="stats-bar" style="margin-bottom: 16px">
      <Card class="mini-stat" style="background: #f0fdf4">
        <template #content>
          <div class="mini-stat-label">จำนวน Order</div>
          <div class="mini-stat-value">{{ filteredOrders.length.toLocaleString('th-TH') }}</div>
        </template>
      </Card>
      <Card class="mini-stat" style="background: #eff6ff">
        <template #content>
          <div class="mini-stat-label">รายรับรวม</div>
          <div class="mini-stat-value">฿{{ totalRevenue.toLocaleString('th-TH', { maximumFractionDigits: 0 }) }}</div>
        </template>
      </Card>
      <Card class="mini-stat" style="background: #fefce8">
        <template #content>
          <div class="mini-stat-label">กำไรรวม</div>
          <div class="mini-stat-value">฿{{ totalProfit.toLocaleString('th-TH', { maximumFractionDigits: 0 }) }}</div>
        </template>
      </Card>
      <Card class="mini-stat" style="background: #fdf4ff">
        <template #content>
          <div class="mini-stat-label">% กำไรเฉลี่ย</div>
          <div class="mini-stat-value">{{ avgProfitPct.toFixed(2) }}%</div>
        </template>
      </Card>
    </div>

    <!-- Error -->
    <Message v-if="sheetsStore.errors.orders" severity="error" :closable="false" style="margin-bottom: 16px">
      {{ sheetsStore.errors.orders }}
    </Message>

    <!-- Table -->
    <Card style="border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06)">
      <template #content>
        <DataTable
          :value="filteredOrders"
          :loading="sheetsStore.loading.orders"
          :paginator="true"
          :rows="pagination.pageSize"
          :rowsPerPageOptions="[10, 20, 50, 100]"
          :stripedRows="true"
          :scrollable="true"
          scrollDirection="both"
          scrollHeight="500px"
          size="small"
          style="min-height: 400px"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
          currentPageReportTemplate="แสดง {first}-{last} จากทั้งหมด {totalRecords} รายการ"
        >
          <template #empty>
            <div style="text-align:center; padding: 40px; color:#999">
              <i class="pi pi-inbox" style="font-size:32px; margin-bottom:8px; display:block"></i>
              ยังไม่มีข้อมูล — โหลดจาก Sheets หรือ Import Excel
            </div>
          </template>

          <Column
            v-for="col in displayColumns"
            :key="col.key"
            :field="col.key"
            :header="col.title"
            :style="`min-width: ${col.width || 120}px`"
          >
            <template #body="{ data }">
              <Tag
                v-if="col.key === 'Status' || col.key === 'status'"
                :value="data[col.key] || '-'"
                :severity="getStatusSeverity(data[col.key])"
                rounded
              />
              <Tag
                v-else-if="col.key === 'Marketplace'"
                :value="data[col.key] || '-'"
                :severity="data[col.key] === 'Shopee' ? 'warn' : data[col.key] === 'Lazada' ? 'info' : 'secondary'"
              />
              <span v-else>{{ data[col.key] || '-' }}</span>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import * as XLSX from 'xlsx'
import { useSheetsStore } from '@/stores/sheets'

const sheetsStore = useSheetsStore()
const toast = useToast()

const search = ref('')
const filterMarket = ref(null)
const filterStatus = ref(null)
const fileInput = ref()

const pagination = ref({ pageSize: 20 })

onMounted(() => {
  if (sheetsStore.apiKey && sheetsStore.orderData.length === 0) loadFromSheets()
})

function loadFromSheets() {
  sheetsStore.loadOrders()
}

// ── File Import ──
function handleFileChange(e) {
  const f = e.target.files?.[0]
  if (!f) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const data = new Uint8Array(ev.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const ws = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(ws, { defval: '' })
      sheetsStore.setOrderData(jsonData)
      toast.add({ severity: 'success', summary: 'Import สำเร็จ', detail: `${jsonData.length} รายการ`, life: 3000 })
    } catch (err) {
      toast.add({ severity: 'error', summary: 'ผิดพลาด', detail: 'เกิดข้อผิดพลาดในการอ่านไฟล์: ' + err.message, life: 4000 })
    }
  }
  reader.readAsArrayBuffer(f)
  e.target.value = ''
}

// ── Export ──
function exportToExcel() {
  if (filteredOrders.value.length === 0) {
    toast.add({ severity: 'warn', summary: 'แจ้งเตือน', detail: 'ไม่มีข้อมูลสำหรับ Export', life: 3000 })
    return
  }
  const ws = XLSX.utils.json_to_sheet(filteredOrders.value)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Order Summary')
  XLSX.writeFile(wb, `order_summary_${new Date().toISOString().slice(0, 10)}.xlsx`)
  toast.add({ severity: 'success', summary: 'Export สำเร็จ', life: 2000 })
}

// ── Filters ──
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
    data = data.filter(o => Object.values(o).some(v => String(v || '').toLowerCase().includes(q)))
  }
  if (filterMarket.value) data = data.filter(o => (o['Marketplace'] || o['marketplace']) === filterMarket.value)
  if (filterStatus.value) data = data.filter(o => (o['Status'] || o['status']) === filterStatus.value)
  return data
})

// ── Stats ──
const totalRevenue = computed(() =>
  filteredOrders.value.reduce((sum, o) => {
    return sum + (parseFloat(String(o['Revenue'] || o['revenue'] || '0').replace(/[฿,\s]/g, '')) || 0)
  }, 0)
)
const totalProfit = computed(() =>
  filteredOrders.value.reduce((sum, o) => {
    return sum + (parseFloat(String(o['E. Profit'] || o['profit'] || '0').replace(/[฿,()\-\s]/g, '')) || 0)
  }, 0)
)
const avgProfitPct = computed(() => (!totalRevenue.value ? 0 : (totalProfit.value / totalRevenue.value) * 100))

// ── Columns ──
const allHeaders = computed(() => (orders.value.length === 0 ? [] : Object.keys(orders.value[0])))

const priorityColumns = ['Order No', 'Marketplace', 'Status', 'Ordered Time', 'Product Name', 'Variation Name', 'Price', 'Quantity', 'Revenue', 'E. Profit', 'Cost']

const displayColumns = computed(() => {
  if (allHeaders.value.length === 0) return [{ key: 'empty', title: 'ยังไม่มีข้อมูล', width: 200 }]
  const sorted = [
    ...priorityColumns.filter(p => allHeaders.value.includes(p)),
    ...allHeaders.value.filter(h => !priorityColumns.includes(h)),
  ]
  return sorted.slice(0, 20).map(key => ({
    key,
    title: key,
    width: key === 'Product Name' ? 200 : key === 'Ordered Time' ? 150 : 120,
  }))
})

function getStatusSeverity(status) {
  const map = { Shipped: 'success', Completed: 'success', Cancelled: 'danger', Returned: 'warn', Processing: 'info' }
  return map[status] || 'secondary'
}
</script>

<style scoped>
.orders-page { }

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
}

.search-input { width: 260px; }

.toolbar-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.stats-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.mini-stat {
  border-radius: 10px !important;
  box-shadow: none !important;
  border: 1px solid var(--p-surface-200);
}

.mini-stat-label { font-size: 12px; color: #666; margin-bottom: 4px; }
.mini-stat-value { font-size: 18px; font-weight: 700; color: var(--p-text-color); }

@media (max-width: 900px) {
  .stats-bar { grid-template-columns: repeat(2, 1fr); }
  .search-input { width: 100%; }
  .toolbar > div:first-child { width: 100%; }
  .toolbar-actions { width: 100%; }
}

@media (max-width: 480px) {
  .stats-bar { grid-template-columns: 1fr; }
}
</style>
