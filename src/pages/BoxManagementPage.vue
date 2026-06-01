<template>
  <div class="boxes-page">
    <!-- Header Actions -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px">
      <div style="display:flex; gap:8px">
        <Button
          icon="pi pi-cloud-download"
          label="โหลดจาก Sheets"
          :loading="sheetsStore.loading.boxes"
          outlined
          :disabled="!sheetsStore.apiKey"
          @click="loadFromSheets"
        />
        <Button icon="pi pi-plus" label="บันทึกข้อมูลกล่อง" @click="showAddModal = true" />
      </div>
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText v-model="search" placeholder="ค้นหา..." style="width:200px" />
      </IconField>
    </div>

    <!-- Error -->
    <Message v-if="sheetsStore.errors.boxes" severity="error" :closable="false" style="margin-bottom: 16px">
      {{ sheetsStore.errors.boxes }}
    </Message>

    <!-- Summary Stats -->
    <div class="stats-grid" style="margin-bottom: 20px">
      <Card class="stat-mini" style="background: linear-gradient(135deg, #667eea15, #764ba215)">
        <template #content>
          <div class="stat-mini-label">ขนาดกล่องทั้งหมด</div>
          <div class="stat-mini-value">{{ boxData.length }}</div>
        </template>
      </Card>
      <Card class="stat-mini" style="background: #f0fdf4">
        <template #content>
          <div class="stat-mini-label">จำนวนกล่องรวม</div>
          <div class="stat-mini-value">{{ totalBoxCount.toLocaleString('th-TH') }} <span style="font-size:14px;font-weight:400">ใบ</span></div>
        </template>
      </Card>
      <Card class="stat-mini" style="background: #eff6ff">
        <template #content>
          <div class="stat-mini-label">มูลค่ารวม</div>
          <div class="stat-mini-value">฿{{ totalBoxValue.toLocaleString('th-TH', { minimumFractionDigits: 2 }) }}</div>
        </template>
      </Card>
      <Card class="stat-mini" style="background: #fefce8">
        <template #content>
          <div class="stat-mini-label">วันที่ตรวจล่าสุด</div>
          <div class="stat-mini-value">{{ latestDate }}</div>
        </template>
      </Card>
    </div>

    <div class="two-col-grid">
      <!-- Box Inventory Table -->
      <Card style="border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06)">
        <template #title>
          <div style="display:flex; justify-content:space-between; align-items:center">
            <span>สต็อกกล่อง</span>
            <Tag :value="`${filteredBoxes.length} ขนาด`" severity="success" />
          </div>
        </template>
        <template #content>
          <DataTable
            :value="filteredBoxes"
            :loading="sheetsStore.loading.boxes"
            :stripedRows="true"
            size="small"
          >
            <Column field="date" header="วันที่ตรวจ" style="min-width:100px" />
            <Column field="size" header="Size" style="min-width:80px">
              <template #body="{ data }">
                <Tag :value="data.size" severity="info" />
              </template>
            </Column>
            <Column field="count" header="จำนวน (ใบ)" style="min-width:100px">
              <template #body="{ data }">
                <span :style="{ fontWeight: 600, color: data.count <= 10 ? '#d03050' : data.count <= 50 ? '#f0a020' : '#18a058' }">
                  {{ (data.count || 0).toLocaleString('th-TH') }}
                </span>
              </template>
            </Column>
            <Column field="unitPrice" header="ราคา/ใบ" style="min-width:90px">
              <template #body="{ data }">฿{{ (data.unitPrice || 0).toFixed(2) }}</template>
            </Column>
            <Column field="totalValue" header="มูลค่ารวม" style="min-width:110px">
              <template #body="{ data }">
                ฿{{ (data.totalValue || data.count * data.unitPrice || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 }) }}
              </template>
            </Column>
            <Column header="" style="min-width:60px; width:60px">
              <template #body="{ data }">
                <Button icon="pi pi-trash" text severity="danger" size="small" @click="deleteBox(data.size)" />
              </template>
            </Column>
          </DataTable>

          <Divider style="margin: 12px 0" />
          <div style="display:flex; justify-content:space-between; padding:0 8px; font-weight:600; color:#18a058">
            <span>รวมทั้งหมด</span>
            <div style="display:flex; gap:32px">
              <span>{{ totalBoxCount }} ใบ</span>
              <span>฿{{ totalBoxValue.toLocaleString('th-TH', { minimumFractionDigits: 2 }) }}</span>
            </div>
          </div>
        </template>
      </Card>

      <!-- Box Size Guide -->
      <Card style="border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06)">
        <template #title>
          <div style="display:flex; justify-content:space-between; align-items:center">
            <span>คู่มือขนาดกล่อง</span>
            <Tag value="Reference" severity="secondary" />
          </div>
        </template>
        <template #content>
          <DataTable :value="boxSizeGuide" size="small" :stripedRows="true">
            <Column field="weight" header="น้ำหนักสินค้า" style="min-width:140px" />
            <Column field="size" header="ไซส์กล่อง" style="min-width:90px">
              <template #body="{ data }">
                <Tag :value="data.size" severity="primary" />
              </template>
            </Column>
            <Column field="note" header="หมายเหตุ" />
          </DataTable>

          <Divider style="margin: 16px 0" />
          <p style="font-size:12px; color:#999; margin-bottom:8px">ราคากล่อง</p>
          <DataTable :value="boxPricing" size="small">
            <Column field="weight" header="น้ำหนัก" style="min-width:80px" />
            <Column field="size" header="ไซส์" style="min-width:70px" />
            <Column field="price" header="ราคากล่อง" style="min-width:90px" />
            <Column field="tape" header="เทป+ปะหน้า" style="min-width:100px" />
          </DataTable>
        </template>
      </Card>
    </div>

    <!-- Add Modal -->
    <Dialog
      v-model:visible="showAddModal"
      header="บันทึกข้อมูลกล่อง"
      :style="{ width: 'min(480px, calc(100vw - 16px))' }"
      modal
    >
      <div class="form-grid">
        <div class="form-field">
          <label class="field-label">วันที่ตรวจ</label>
          <DatePicker v-model="addForm.date" dateFormat="d/m/yy" style="width:100%" />
        </div>
        <div class="form-field">
          <label class="field-label">ขนาดกล่อง</label>
          <Select
            v-model="addForm.size"
            :options="sizeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="เลือกหรือพิมพ์ขนาด"
            editable
            style="width:100%"
          />
        </div>
        <div class="form-field">
          <label class="field-label">จำนวน (ใบ)</label>
          <InputNumber v-model="addForm.count" :min="0" style="width:100%" />
        </div>
        <div class="form-field">
          <label class="field-label">ราคา/ใบ (฿)</label>
          <InputNumber v-model="addForm.unitPrice" :min="0" :minFractionDigits="2" :maxFractionDigits="2" style="width:100%" />
        </div>
        <div class="form-field">
          <label class="field-label">มูลค่ารวม</label>
          <InputText :value="`฿${(addForm.count * addForm.unitPrice).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`" readonly style="width:100%" />
        </div>
      </div>

      <template #footer>
        <Button label="ยกเลิก" outlined @click="showAddModal = false" />
        <Button label="บันทึก" @click="saveBox" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useSheetsStore } from '@/stores/sheets'

const sheetsStore = useSheetsStore()
const toast = useToast()
const search = ref('')
const showAddModal = ref(false)

const addForm = ref({
  date: new Date(),
  size: null,
  count: 0,
  unitPrice: 0,
})

onMounted(() => {
  if (sheetsStore.apiKey && sheetsStore.boxData.length === 0) loadFromSheets()
})

function loadFromSheets() { sheetsStore.loadBoxes() }

const localBoxes = ref([])

const boxData = computed(() => {
  const fromSheets = sheetsStore.boxData
  return fromSheets.length > 0 ? fromSheets : localBoxes.value
})

const filteredBoxes = computed(() => {
  if (!search.value) return boxData.value
  const q = search.value.toLowerCase()
  return boxData.value.filter(b =>
    String(b.size || '').toLowerCase().includes(q) || String(b.date || '').includes(q)
  )
})

const totalBoxCount = computed(() => boxData.value.reduce((s, b) => s + (b.count || 0), 0))
const totalBoxValue = computed(() => boxData.value.reduce((s, b) => s + (b.totalValue || b.count * b.unitPrice || 0), 0))
const latestDate = computed(() => {
  const dates = boxData.value.map(b => b.date).filter(Boolean)
  return dates[dates.length - 1] || '-'
})

const sizeOptions = ['0', 'A', 'B', '2B', 'C', 'C+8', 'D', 'E', '2E', 'F', 'G', 'Reuse']
  .map(s => ({ label: s, value: s }))

function saveBox() {
  const dateStr = addForm.value.date
    ? addForm.value.date.toLocaleDateString('th-TH', { day: 'numeric', month: 'numeric', year: '2-digit' })
    : ''
  const entry = {
    date: dateStr,
    size: addForm.value.size,
    count: addForm.value.count,
    unitPrice: addForm.value.unitPrice,
    totalValue: addForm.value.count * addForm.value.unitPrice,
  }
  const idx = localBoxes.value.findIndex(b => b.size === entry.size)
  if (idx >= 0) {
    localBoxes.value[idx] = { ...entry }
    toast.add({ severity: 'success', summary: 'สำเร็จ', detail: `อัปเดตกล่อง Size ${entry.size} แล้ว`, life: 3000 })
  } else {
    localBoxes.value.push(entry)
    toast.add({ severity: 'success', summary: 'สำเร็จ', detail: `เพิ่มกล่อง Size ${entry.size} แล้ว`, life: 3000 })
  }
  showAddModal.value = false
  addForm.value = { date: new Date(), size: null, count: 0, unitPrice: 0 }
}

function deleteBox(size) {
  localBoxes.value = localBoxes.value.filter(b => b.size !== size)
  toast.add({ severity: 'success', summary: 'สำเร็จ', detail: 'ลบรายการแล้ว', life: 2000 })
}

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

const boxPricing = [
  { weight: '500g', size: 'B', price: '฿4', tape: '฿3' },
  { weight: '1–1.5kg', size: 'C', price: '฿5', tape: '฿3' },
  { weight: '2–3kg', size: 'E, C8', price: '฿8', tape: '฿3' },
  { weight: '7kg', size: 'F', price: '฿10', tape: '฿4' },
]
</script>

<style scoped>
.boxes-page { }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-mini { border-radius: 10px !important; box-shadow: none !important; border: 1px solid var(--p-surface-200) !important; }
.stat-mini-label { font-size: 12px; color: #666; margin-bottom: 4px; }
.stat-mini-value { font-size: 18px; font-weight: 700; }

.two-col-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-grid { display: flex; flex-direction: column; gap: 12px; }
.form-field { display: flex; flex-direction: column; gap: 4px; }
.field-label { font-size: 14px; font-weight: 500; }

@media (max-width: 900px) {
  .two-col-grid { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .stats-grid { grid-template-columns: 1fr; }
}
</style>
