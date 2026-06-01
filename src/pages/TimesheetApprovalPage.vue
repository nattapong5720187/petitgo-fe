<template>
  <div>
    <div style="margin-bottom: 16px">
      <h2 style="margin: 0 0 12px; font-size:20px; font-weight:700">อนุมัติเวลาทำงาน</h2>

      <Tabs v-model:value="statusFilter" @update:value="loadTimesheets">
        <TabList>
          <Tab value="">ทั้งหมด</Tab>
          <Tab value="REQUESTED">รอดำเนินการ</Tab>
          <Tab value="APPROVED">อนุมัติแล้ว</Tab>
          <Tab value="REJECTED">ปฏิเสธแล้ว</Tab>
        </TabList>
      </Tabs>
    </div>

    <Card style="border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06)">
      <template #content>
        <DataTable
          :value="timesheets"
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

          <Column header="การดำเนินการ" style="min-width:180px">
            <template #body="{ data }">
              <div v-if="data.status === 'REQUESTED'" style="display:flex; gap:6px">
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
              </div>
              <span v-else>-</span>
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
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { getTimesheets, updateTimesheet, calcCompensation } from '@/services/timesheetService'

const toast = useToast()

const timesheets = ref([])
const loading = ref(false)
const actionLoading = ref(false)
const statusFilter = ref('')
const showRejectModal = ref(false)
const rejectRemark = ref('')
const rejectTarget = ref(null)

const typeLabels = {
  'OT-WD': 'OT วันทำงาน',
  'OT-DO': 'OT วันหยุด',
  'LIVE': 'Live',
  'CS-FINANCE': 'CS-Finance',
}

const statusConfig = {
  REQUESTED: { severity: 'warn', label: 'รอดำเนินการ' },
  APPROVED: { severity: 'success', label: 'อนุมัติแล้ว' },
  REJECTED: { severity: 'danger', label: 'ปฏิเสธแล้ว' },
}

function fmtDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function fmtTime(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}

function fmtCompensation(row) {
  const rate = calcCompensation(row.type, row.startAt, row.endAt)
  return `฿${rate.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
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
