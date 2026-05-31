<template>
  <div>
    <div style="margin-bottom: 16px">
      <n-h2 style="margin: 0 0 12px">อนุมัติเวลาทำงาน</n-h2>
      <n-tabs v-model:value="statusFilter" type="line" @update:value="loadTimesheets">
        <n-tab name="">ทั้งหมด</n-tab>
        <n-tab name="REQUESTED">รอดำเนินการ</n-tab>
        <n-tab name="APPROVED">อนุมัติแล้ว</n-tab>
        <n-tab name="REJECTED">ปฏิเสธแล้ว</n-tab>
      </n-tabs>
    </div>

    <n-card>
      <n-data-table
        :columns="columns"
        :data="timesheets"
        :loading="loading"
        :pagination="{ pageSize: 20 }"
        striped
        scroll-x="900"
      />
    </n-card>

    <!-- Reject reason modal -->
    <n-modal v-model:show="showRejectModal" preset="card" title="ระบุเหตุผลการปฏิเสธ" style="width: min(400px, calc(100vw - 16px))">
      <n-input v-model:value="rejectRemark" type="textarea" placeholder="เหตุผล..." :rows="3" />
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 8px">
          <n-button @click="showRejectModal = false">ยกเลิก</n-button>
          <n-button type="error" :loading="actionLoading" @click="confirmReject">ยืนยันการปฏิเสธ</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, h, onMounted } from 'vue'
import { useMessage, NTag, NButton, NSpace } from 'naive-ui'
import { getTimesheets, updateTimesheet, calcCompensation } from '@/services/timesheetService'

const message = useMessage()

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
  REQUESTED: { type: 'warning', label: 'รอดำเนินการ' },
  APPROVED: { type: 'success', label: 'อนุมัติแล้ว' },
  REJECTED: { type: 'error', label: 'ปฏิเสธแล้ว' },
}

function fmtDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('th-TH', {
    day: '2-digit', month: '2-digit', year: '2-digit',
  })
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
    message.success(`อนุมัติ ${row.requesterName} สำเร็จ`)
  } catch {
    message.error('ดำเนินการไม่สำเร็จ')
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
    message.success('ปฏิเสธคำขอสำเร็จ')
    showRejectModal.value = false
  } catch {
    message.error('ดำเนินการไม่สำเร็จ')
  } finally {
    actionLoading.value = false
  }
}

const columns = [
  {
    title: 'วันที่',
    key: 'date',
    width: 90,
    render: row => fmtDate(row.startAt),
  },
  {
    title: 'ผู้ขอ',
    key: 'requesterName',
    width: 110,
  },
  {
    title: 'ประเภท',
    key: 'type',
    width: 120,
    render: row => h(NTag, { size: 'small', type: 'info' }, { default: () => typeLabels[row.type] || row.type }),
  },
  {
    title: 'เริ่ม',
    key: 'startAt',
    width: 80,
    render: row => fmtTime(row.startAt),
  },
  {
    title: 'สิ้นสุด',
    key: 'endAt',
    width: 80,
    render: row => fmtTime(row.endAt),
  },
  {
    title: 'ค่าตอบแทน (ประมาณ)',
    key: 'compensation',
    width: 150,
    render: row => fmtCompensation(row),
  },
  {
    title: 'สถานะ',
    key: 'status',
    width: 120,
    render: row => {
      const cfg = statusConfig[row.status] || { type: 'default', label: row.status }
      return h(NTag, { type: cfg.type, size: 'small' }, { default: () => cfg.label })
    },
  },
  {
    title: 'การดำเนินการ',
    key: 'actions',
    width: 180,
    render: row => {
      if (row.status !== 'REQUESTED') return '-'
      return h(NSpace, { size: 'small' }, {
        default: () => [
          h(NButton, {
            size: 'small',
            type: 'success',
            loading: actionLoading.value,
            onClick: () => approve(row),
          }, { default: () => 'อนุมัติ' }),
          h(NButton, {
            size: 'small',
            type: 'error',
            ghost: true,
            onClick: () => openRejectModal(row),
          }, { default: () => 'ปฏิเสธ' }),
        ],
      })
    },
  },
]

async function loadTimesheets() {
  loading.value = true
  try {
    timesheets.value = await getTimesheets(statusFilter.value || undefined)
  } catch {
    message.error('โหลดข้อมูลไม่สำเร็จ')
  } finally {
    loading.value = false
  }
}

onMounted(loadTimesheets)
</script>
