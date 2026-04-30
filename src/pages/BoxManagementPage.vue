<template>
  <div class="boxes-page">
    <!-- Header Actions -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
      <div style="display: flex; gap: 8px;">
        <n-button
          :loading="sheetsStore.loading.boxes"
          @click="loadFromSheets"
          type="primary"
          ghost
          :disabled="!sheetsStore.apiKey"
        >
          <template #icon><n-icon :component="CloudDownloadOutline" /></template>
          โหลดจาก Sheets
        </n-button>
        <n-button type="primary" @click="showAddModal = true">
          <template #icon><n-icon :component="AddOutline" /></template>
          บันทึกข้อมูลกล่อง
        </n-button>
      </div>
      <n-input v-model:value="search" placeholder="ค้นหา..." clearable style="width: 200px">
        <template #prefix><n-icon :component="SearchOutline" /></template>
      </n-input>
    </div>

    <!-- Error -->
    <n-alert v-if="sheetsStore.errors.boxes" type="error" :bordered="false" style="margin-bottom: 16px">
      {{ sheetsStore.errors.boxes }}
    </n-alert>

    <!-- Summary Cards -->
    <n-grid :cols="4" :x-gap="12" :y-gap="12" style="margin-bottom: 20px" responsive="screen" :collapsed-cols="2">
      <n-gi>
        <n-card size="small" :bordered="false" style="border-radius: 10px; background: linear-gradient(135deg, #667eea15, #764ba215)">
          <n-statistic label="ขนาดกล่องทั้งหมด" :value="boxData.length" />
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small" :bordered="false" style="border-radius: 10px; background: #f0fdf4">
          <n-statistic label="จำนวนกล่องรวม" :value="totalBoxCount">
            <template #suffix> ใบ</template>
          </n-statistic>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small" :bordered="false" style="border-radius: 10px; background: #eff6ff">
          <n-statistic label="มูลค่ารวม" :value="totalBoxValue" :precision="2">
            <template #prefix>฿</template>
          </n-statistic>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small" :bordered="false" style="border-radius: 10px; background: #fefce8">
          <n-statistic label="วันที่ตรวจล่าสุด" :value="latestDate" />
        </n-card>
      </n-gi>
    </n-grid>

    <n-grid :cols="2" :x-gap="16" :y-gap="16" responsive="screen" :collapsed-cols="1">
      <!-- Box Inventory Table -->
      <n-gi>
        <n-card title="สต็อกกล่อง" :bordered="false" style="border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06)">
          <template #header-extra>
            <n-tag size="small" type="success">{{ filteredBoxes.length }} ขนาด</n-tag>
          </template>

          <n-data-table
            :columns="boxColumns"
            :data="filteredBoxes"
            :loading="sheetsStore.loading.boxes"
            size="small"
            striped
            :bordered="false"
          />

          <!-- Total row -->
          <n-divider style="margin: 12px 0" />
          <div style="display: flex; justify-content: space-between; padding: 0 8px; font-weight: 600; color: #18a058">
            <span>รวมทั้งหมด</span>
            <div style="display: flex; gap: 32px;">
              <span>{{ totalBoxCount }} ใบ</span>
              <span>฿{{ totalBoxValue.toLocaleString('th-TH', { minimumFractionDigits: 2 }) }}</span>
            </div>
          </div>
        </n-card>
      </n-gi>

      <!-- Box Size Guide -->
      <n-gi>
        <n-card title="คู่มือขนาดกล่อง" :bordered="false" style="border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06)">
          <template #header-extra>
            <n-tag size="small">Reference</n-tag>
          </template>

          <n-data-table
            :columns="sizeGuideColumns"
            :data="boxSizeGuide"
            size="small"
            :bordered="false"
          />

          <n-divider style="margin: 16px 0" />
          <n-text depth="3" style="font-size: 12px">ราคากล่อง</n-text>
          <n-data-table
            :columns="pricingColumns"
            :data="boxPricing"
            size="small"
            :bordered="false"
            style="margin-top: 8px"
          />
        </n-card>
      </n-gi>
    </n-grid>

    <!-- Add/Edit Modal -->
    <n-modal v-model:show="showAddModal" preset="card" title="บันทึกข้อมูลกล่อง" style="width: 480px">
      <n-form :model="addForm" ref="addFormRef" label-placement="left" label-width="120">
        <n-form-item label="วันที่ตรวจ" path="date">
          <n-date-picker v-model:value="addForm.dateTs" type="date" format="d/M/yyyy" style="width: 100%" />
        </n-form-item>
        <n-form-item label="ขนาดกล่อง" path="size">
          <n-select
            v-model:value="addForm.size"
            :options="sizeOptions"
            filterable
            tag
            placeholder="เลือกหรือพิมพ์ขนาด"
          />
        </n-form-item>
        <n-form-item label="จำนวน (ใบ)" path="count">
          <n-input-number v-model:value="addForm.count" :min="0" style="width: 100%" />
        </n-form-item>
        <n-form-item label="ราคา/ใบ (฿)" path="unitPrice">
          <n-input-number v-model:value="addForm.unitPrice" :min="0" :precision="2" style="width: 100%" />
        </n-form-item>
        <n-form-item label="มูลค่ารวม">
          <n-input :value="`฿${(addForm.count * addForm.unitPrice).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`" readonly />
        </n-form-item>
      </n-form>

      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <n-button @click="showAddModal = false">ยกเลิก</n-button>
          <n-button type="primary" @click="saveBox">บันทึก</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue'
import { NTag, NButton, NIcon, useMessage } from 'naive-ui'
import { CloudDownloadOutline, AddOutline, SearchOutline, CreateOutline, TrashOutline } from '@vicons/ionicons5'
import { useSheetsStore } from '@/stores/sheets'

const sheetsStore = useSheetsStore()
const message = useMessage()
const search = ref('')
const showAddModal = ref(false)

const addForm = ref({
  dateTs: Date.now(),
  size: null,
  count: 0,
  unitPrice: 0,
})

onMounted(() => {
  if (sheetsStore.apiKey && sheetsStore.boxData.length === 0) {
    loadFromSheets()
  }
})

function loadFromSheets() {
  sheetsStore.loadBoxes()
}

// ---- Local box data management ----
const localBoxes = ref([])

const boxData = computed(() => {
  const fromSheets = sheetsStore.boxData
  if (fromSheets.length > 0) return fromSheets
  return localBoxes.value
})

const filteredBoxes = computed(() => {
  if (!search.value) return boxData.value
  const q = search.value.toLowerCase()
  return boxData.value.filter(b =>
    String(b.size || '').toLowerCase().includes(q) ||
    String(b.date || '').includes(q)
  )
})

// Stats
const totalBoxCount = computed(() => boxData.value.reduce((s, b) => s + (b.count || 0), 0))
const totalBoxValue = computed(() => boxData.value.reduce((s, b) => s + (b.totalValue || b.count * b.unitPrice || 0), 0))
const latestDate = computed(() => {
  const dates = boxData.value.map(b => b.date).filter(Boolean)
  return dates[dates.length - 1] || '-'
})

// Size options for select
const sizeOptions = [
  '0', 'A', 'B', '2B', 'C', 'C+8', 'D', 'E', '2E', 'F', 'G', 'Reuse',
].map(s => ({ label: s, value: s }))

// Save new box entry
function saveBox() {
  const dateStr = addForm.value.dateTs
    ? new Date(addForm.value.dateTs).toLocaleDateString('th-TH', { day: 'numeric', month: 'numeric', year: '2-digit' })
    : ''
  const entry = {
    date: dateStr,
    size: addForm.value.size,
    count: addForm.value.count,
    unitPrice: addForm.value.unitPrice,
    totalValue: addForm.value.count * addForm.value.unitPrice,
  }

  // Update existing or add new
  const existingIdx = localBoxes.value.findIndex(b => b.size === entry.size)
  if (existingIdx >= 0) {
    localBoxes.value[existingIdx] = { ...entry }
    message.success(`อัปเดตกล่อง Size ${entry.size} แล้ว`)
  } else {
    localBoxes.value.push(entry)
    message.success(`เพิ่มกล่อง Size ${entry.size} แล้ว`)
  }

  showAddModal.value = false
  addForm.value = { dateTs: Date.now(), size: null, count: 0, unitPrice: 0 }
}

function deleteBox(size) {
  localBoxes.value = localBoxes.value.filter(b => b.size !== size)
  message.success('ลบรายการแล้ว')
}

// ---- Table Columns ----
const boxColumns = [
  {
    title: 'วันที่ตรวจ',
    key: 'date',
    width: 100,
  },
  {
    title: 'Size',
    key: 'size',
    width: 80,
    render: (row) => h(NTag, { type: 'info', size: 'small' }, { default: () => row.size }),
  },
  {
    title: 'จำนวน (ใบ)',
    key: 'count',
    width: 100,
    render: (row) => h('span', {
      style: { fontWeight: '600', color: row.count <= 10 ? '#d03050' : row.count <= 50 ? '#f0a020' : '#18a058' }
    }, row.count?.toLocaleString('th-TH') || '0'),
  },
  {
    title: 'ราคา/ใบ',
    key: 'unitPrice',
    width: 90,
    render: (row) => `฿${(row.unitPrice || 0).toFixed(2)}`,
  },
  {
    title: 'มูลค่ารวม',
    key: 'totalValue',
    width: 110,
    render: (row) => {
      const val = row.totalValue || (row.count * row.unitPrice) || 0
      return `฿${val.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`
    },
  },
  {
    title: '',
    key: 'actions',
    width: 60,
    render: (row) => h(NButton, {
      size: 'tiny',
      quaternary: true,
      type: 'error',
      onClick: () => deleteBox(row.size),
    }, { icon: () => h(NIcon, { component: TrashOutline }) }),
  },
]

// ---- Box Size Guide ----
const boxSizeGuide = [
  { weight: '0.3–0.5 kg × 1', size: 'B', note: '' },
  { weight: '0.3–0.5 kg × 2', size: '2B, C', note: '' },
  { weight: '1.2–1.5 kg × 1', size: 'C', note: '' },
  { weight: '1.2–1.5 kg × 2', size: 'C8', note: '' },
  { weight: '1.2–1.5 kg × 3', size: 'E', note: 'เฉพาะสุญญากาศ' },
  { weight: '2.7–3 kg × 1', size: 'E', note: '' },
  { weight: '2.7–3+ kg × 2', size: '2E', note: '' },
  { weight: '7–8 kg × 1', size: 'F', note: '' },
]

const sizeGuideColumns = [
  { title: 'น้ำหนักสินค้า', key: 'weight', width: 140 },
  {
    title: 'ไซส์กล่อง',
    key: 'size',
    width: 90,
    render: (row) => h(NTag, { type: 'primary', size: 'small' }, { default: () => row.size }),
  },
  { title: 'หมายเหตุ', key: 'note' },
]

const boxPricing = [
  { weight: '500g', size: 'B', price: '฿4', tape: '฿3' },
  { weight: '1–1.5kg', size: 'C', price: '฿5', tape: '฿3' },
  { weight: '2–3kg', size: 'E, C8', price: '฿8', tape: '฿3' },
  { weight: '7kg', size: 'F', price: '฿10', tape: '฿4' },
]

const pricingColumns = [
  { title: 'น้ำหนัก', key: 'weight', width: 80 },
  { title: 'ไซส์', key: 'size', width: 70 },
  { title: 'ราคากล่อง', key: 'price', width: 90 },
  { title: 'เทป+ปะหน้า', key: 'tape', width: 100 },
]
</script>

<style scoped>
.boxes-page {
  max-width: 1400px;
}
</style>
