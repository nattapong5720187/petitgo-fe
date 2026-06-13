<template>
  <div>
    <div style="margin-bottom: 16px">
      <h2 style="margin: 0 0 12px; font-size:20px; font-weight:700">อนุมัติเวลาทำงาน</h2>

      <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:12px">
        <label style="font-size:14px; font-weight:600">ช่วงวันที่:</label>
        <DatePicker
          v-model="dateFrom"
          dateFormat="dd/mm/yy"
          placeholder="วันเริ่มต้น"
          showIcon
          style="width:160px"
        />
        <span style="font-size:14px">ถึง</span>
        <DatePicker
          v-model="dateTo"
          dateFormat="dd/mm/yy"
          placeholder="วันสิ้นสุด"
          showIcon
          style="width:160px"
        />

        <label style="font-size:14px; font-weight:600; margin-left:8px">ผู้ใช้:</label>
        <Select
          v-model="userFilter"
          :options="userOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="ทุกคน"
          showClear
          style="width:180px"
        />
      </div>

      <Tabs v-model:value="statusFilter" @update:value="loadTimesheets">
        <TabList>
          <Tab value="">ทั้งหมด</Tab>
          <Tab value="REQUESTED">รอดำเนินการ</Tab>
          <Tab value="APPROVED">อนุมัติแล้ว</Tab>
          <Tab value="SETTLED">จ่ายแล้ว</Tab>
          <Tab value="REJECTED">ปฏิเสธแล้ว</Tab>
        </TabList>
      </Tabs>
    </div>

    <div v-if="showCompensationSummary" class="comp-summary">
      <div class="comp-summary-item">
        <span class="comp-summary-label">จำนวนรายการ</span>
        <span class="comp-summary-value">{{ filteredTimesheets.length }}</span>
      </div>
      <div class="comp-summary-divider"></div>
      <div class="comp-summary-item">
        <span class="comp-summary-label">
          รวมค่าตอบแทน · {{ statusConfig[statusFilter]?.label }}
          <template v-if="userFilter"> · {{ userFilter }}</template>
        </span>
        <span class="comp-summary-value primary">{{ fmtBaht(totalCompensation) }}</span>
      </div>
    </div>

    <Card style="border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06)">
      <template #content>
        <DataTable
          :value="filteredTimesheets"
          :loading="loading"
          :paginator="true"
          :rows="20"
          :stripedRows="true"
          :scrollable="true"
          scrollDirection="both"
          size="small"
        >
          <template #empty>
            <div style="text-align:center; padding:30px; color:#999">ไม่มีข้อมูล</div>
          </template>

          <Column field="date" header="วันที่" style="min-width:90px">
            <template #body="{ data }">{{ fmtDate(data.startAt) }}</template>
          </Column>

          <Column field="requesterName" header="ผู้ขอ" style="min-width:110px" />

          <Column field="type" header="ประเภท" style="min-width:130px">
            <template #body="{ data }">
              <Tag :value="typeLabels[data.type] || data.type" severity="info" />
            </template>
          </Column>

          <Column field="startAt" header="เริ่ม" style="min-width:80px">
            <template #body="{ data }">{{ fmtTime(data.startAt) }}</template>
          </Column>

          <Column field="endAt" header="สิ้นสุด" style="min-width:80px">
            <template #body="{ data }">{{ fmtTime(data.endAt) }}</template>
          </Column>

          <Column header="ค่าตอบแทน (ประมาณ)" style="min-width:160px">
            <template #body="{ data }">{{ fmtCompensation(data) }}</template>
          </Column>

          <Column field="status" header="สถานะ" style="min-width:130px">
            <template #body="{ data }">
              <Tag
                :value="statusConfig[data.status]?.label || data.status"
                :severity="statusConfig[data.status]?.severity || 'secondary'"
              />
            </template>
          </Column>

          <Column header="การดำเนินการ" style="min-width:200px">
            <template #body="{ data }">
              <div style="display:flex; gap:6px; flex-wrap:wrap">
                <template v-if="data.status === 'REQUESTED'">
                  <Button
                    label="อนุมัติ"
                    severity="success"
                    size="small"
                    :loading="actionLoading"
                    @click="approve(data)"
                  />
                  <Button
                    label="ปฏิเสธ"
                    severity="danger"
                    size="small"
                    outlined
                    @click="openRejectModal(data)"
                  />
                </template>
                <Button
                  v-else-if="data.status === 'APPROVED'"
                  label="จ่ายแล้ว"
                  severity="info"
                  size="small"
                  :loading="actionLoading"
                  @click="settle(data)"
                />
                <span v-else>-</span>
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Reject Modal -->
    <Dialog
      v-model:visible="showRejectModal"
      header="ระบุเหตุผลการปฏิเสธ"
      :style="{ width: 'min(400px, calc(100vw - 16px))' }"
      modal
    >
      <Textarea
        v-model="rejectRemark"
        placeholder="เหตุผล..."
        :rows="3"
        style="width:100%; resize:vertical"
      />
      <template #footer>
        <Button label="ยกเลิก" outlined @click="showRejectModal = false" />
        <Button
          label="ยืนยันการปฏิเสธ"
          severity="danger"
          :loading="actionLoading"
          @click="confirmReject"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { getTimesheets, updateTimesheet, calcCompensation } from '@/services/timesheetService'

const toast = useToast()

const timesheets = ref([])
const loading = ref(false)
const actionLoading = ref(false)
const statusFilter = ref('')
const userFilter = ref('')
const showRejectModal = ref(false)
const rejectRemark = ref('')
const rejectTarget = ref(null)

const now = new Date()
const dateFrom = ref(new Date(now.getFullYear(), now.getMonth(), 1))
const dateTo = ref(new Date(now.getFullYear(), now.getMonth() + 1, 0))

const typeLabels = {
  'OT-WD': 'OT วันทำงาน',
  'OT-DO': 'OT วันหยุด',
  'LIVE': 'Live',
  'CS-FINANCE': 'CS-Finance',
}

const statusConfig = {
  REQUESTED: { severity: 'warn', label: 'รอดำเนินการ' },
  APPROVED: { severity: 'success', label: 'อนุมัติแล้ว' },
  SETTLED: { severity: 'info', label: 'จ่ายแล้ว' },
  REJECTED: { severity: 'danger', label: 'ปฏิเสธแล้ว' },
}

const userOptions = computed(() => {
  const names = [...new Set(timesheets.value.map(r => r.requesterName).filter(Boolean))]
  names.sort((a, b) => a.localeCompare(b, 'th'))
  return [{ label: 'ทุกคน', value: '' }, ...names.map(n => ({ label: n, value: n }))]
})

const filteredTimesheets = computed(() => {
  return timesheets.value.filter(row => {
    if (!row.startAt) return false
    if (userFilter.value && row.requesterName !== userFilter.value) return false
    const t = new Date(row.startAt).getTime()
    const from = dateFrom.value ? new Date(dateFrom.value).setHours(0, 0, 0, 0) : null
    const to = dateTo.value ? new Date(dateTo.value).setHours(23, 59, 59, 999) : null
    if (from && t < from) return false
    if (to && t > to) return false
    return true
  })
})

// Compensation summary is only meaningful once entries are approved/settled.
const showCompensationSummary = computed(
  () => statusFilter.value === 'APPROVED' || statusFilter.value === 'SETTLED',
)

const totalCompensation = computed(() =>
  filteredTimesheets.value.reduce(
    (sum, row) => sum + calcCompensation(row.type, row.startAt, row.endAt),
    0,
  ),
)

function fmtDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function fmtTime(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}

function fmtBaht(amount) {
  return `฿${Number(amount).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function fmtCompensation(row) {
  return fmtBaht(calcCompensation(row.type, row.startAt, row.endAt))
}

async function approve(row) {
  actionLoading.value = true
  try {
    const updated = await updateTimesheet(row.id, { status: 'APPROVED' })
    Object.assign(row, updated)
    toast.add({ severity: 'success', summary: 'สำเร็จ', detail: `อนุมัติ ${row.requesterName} สำเร็จ`, life: 3000 })
  } catch {
    toast.add({ severity: 'error', summary: 'ผิดพลาด', detail: 'ดำเนินการไม่สำเร็จ', life: 3000 })
  } finally {
    actionLoading.value = false
  }
}

async function settle(row) {
  actionLoading.value = true
  try {
    const updated = await updateTimesheet(row.id, { status: 'SETTLED' })
    Object.assign(row, updated)
    toast.add({ severity: 'success', summary: 'สำเร็จ', detail: `บันทึกจ่ายแล้วสำเร็จ`, life: 3000 })
  } catch {
    toast.add({ severity: 'error', summary: 'ผิดพลาด', detail: 'ดำเนินการไม่สำเร็จ', life: 3000 })
  } finally {
    actionLoading.value = false
  }
}

function openRejectModal(row) {
  rejectTarget.value = row
  rejectRemark.value = ''
  showRejectModal.value = true
}

async function confirmReject() {
  if (!rejectTarget.value) return
  actionLoading.value = true
  try {
    const updated = await updateTimesheet(rejectTarget.value.id, {
      status: 'REJECTED',
      remark: rejectRemark.value,
    })
    Object.assign(rejectTarget.value, updated)
    toast.add({ severity: 'success', summary: 'สำเร็จ', detail: 'ปฏิเสธคำขอสำเร็จ', life: 3000 })
    showRejectModal.value = false
  } catch {
    toast.add({ severity: 'error', summary: 'ผิดพลาด', detail: 'ดำเนินการไม่สำเร็จ', life: 3000 })
  } finally {
    actionLoading.value = false
  }
}

async function loadTimesheets() {
  loading.value = true
  try {
    timesheets.value = await getTimesheets(statusFilter.value || undefined)
  } catch {
    toast.add({ severity: 'error', summary: 'ผิดพลาด', detail: 'โหลดข้อมูลไม่สำเร็จ', life: 3000 })
  } finally {
    loading.value = false
  }
}

onMounted(loadTimesheets)
</script>

<style scoped>
.comp-summary {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  padding: 14px 20px;
  margin-bottom: 12px;
  border-radius: 12px;
  background: var(--p-primary-50);
  border: 1px solid var(--p-primary-200);
}
.comp-summary-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.comp-summary-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--p-text-muted-color);
}
.comp-summary-value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--p-text-color);
}
.comp-summary-value.primary {
  color: var(--p-primary-600);
}
.comp-summary-divider {
  width: 1px;
  align-self: stretch;
  background: var(--p-primary-200);
}
</style>
