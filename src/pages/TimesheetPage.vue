<template>
  <div class="timesheet-page">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px">
      <n-h2 style="margin: 0">ลงเวลาทำงาน</n-h2>
      <n-tag type="info" size="small">คลิกที่วันที่เพื่อบันทึกเวลา</n-tag>
    </div>

    <n-card>
      <n-calendar v-model:value="calValue" @update:value="onDateClick">
        <template #default="{ year, month, date }">
          <div class="cell-inner">
            <div
              v-for="entry in entriesOnDate(year, month, date)"
              :key="entry.id"
              class="entry-badge"
              :class="entry.status.toLowerCase()"
              :title="`${entry.type} · ${fmtHours(entry.startAt, entry.endAt)} · ${entry.status}`"
            >
              {{ entry.type }} {{ fmtHours(entry.startAt, entry.endAt) }}
            </div>
          </div>
        </template>
      </n-calendar>
    </n-card>

    <!-- Log timesheet modal -->
    <n-modal v-model:show="showModal" preset="card" title="บันทึกเวลาทำงาน" style="width: min(480px, calc(100vw - 16px))">
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
        <n-form-item label="ประเภท" path="type">
          <n-select v-model:value="form.type" :options="typeOptions" placeholder="เลือกประเภท" />
        </n-form-item>

        <n-form-item label="เวลาเริ่ม" path="startAt">
          <n-date-picker
            v-model:value="form.startAt"
            type="datetime"
            :format="'dd/MM/yyyy HH:mm'"
            style="width: 100%"
          />
        </n-form-item>

        <n-form-item label="เวลาสิ้นสุด" path="endAt">
          <n-date-picker
            v-model:value="form.endAt"
            type="datetime"
            :format="'dd/MM/yyyy HH:mm'"
            :is-date-disabled="disableEndDate"
            style="width: 100%"
          />
        </n-form-item>

        <n-form-item label="หมายเหตุ (ถ้ามี)" path="remark">
          <n-input v-model:value="form.remark" type="textarea" placeholder="หมายเหตุ..." :rows="2" />
        </n-form-item>
      </n-form>

      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 8px">
          <n-button @click="showModal = false">ยกเลิก</n-button>
          <n-button type="primary" :loading="saving" @click="handleSave">บันทึก</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { createTimesheet, getTimesheets } from '@/services/timesheetService'

const message = useMessage()

const calValue = ref(Date.now())
const showModal = ref(false)
const saving = ref(false)
const formRef = ref(null)
const timesheets = ref([])

const form = ref({
  type: null,
  startAt: null,
  endAt: null,
  remark: '',
})

const typeOptions = [
  { label: 'OT วันทำงาน (OT-WD)', value: 'OT-WD' },
  { label: 'OT วันหยุด (OT-DO)', value: 'OT-DO' },
  { label: 'Live', value: 'LIVE' },
  { label: 'CS-Finance', value: 'CS-FINANCE' },
]

const rules = {
  type: { required: true, message: 'กรุณาเลือกประเภท', trigger: 'change' },
  startAt: {
    required: true,
    type: 'number',
    message: 'กรุณาเลือกเวลาเริ่ม',
    trigger: 'change',
  },
  endAt: [
    { required: true, type: 'number', message: 'กรุณาเลือกเวลาสิ้นสุด', trigger: 'change' },
    {
      validator: (_, value) => !form.value.startAt || value > form.value.startAt,
      message: 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม',
      trigger: 'change',
    },
  ],
}

function disableEndDate(ts) {
  if (!form.value.startAt) return false
  const startDay = new Date(form.value.startAt)
  startDay.setHours(0, 0, 0, 0)
  return ts < startDay.getTime()
}

function fmtHours(startIso, endIso) {
  if (!startIso || !endIso) return ''
  const h = (new Date(endIso) - new Date(startIso)) / 3_600_000
  return `${+h.toFixed(1)}h`
}

function entriesOnDate(year, month, date) {
  return timesheets.value.filter(t => {
    const d = new Date(t.startAt)
    return d.getFullYear() === year && d.getMonth() + 1 === month && d.getDate() === date
  })
}

function onDateClick(ts) {
  const d = new Date(ts)
  d.setHours(18, 30, 0, 0)
  const endD = new Date(ts)
  endD.setHours(19, 30, 0, 0)

  form.value = { type: null, startAt: d.getTime(), endAt: endD.getTime(), remark: '' }
  showModal.value = true
}

async function handleSave() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  saving.value = true
  try {
    const payload = {
      type: form.value.type,
      startAt: new Date(form.value.startAt).toISOString(),
      endAt: new Date(form.value.endAt).toISOString(),
      remark: form.value.remark,
    }
    const entry = await createTimesheet(payload)
    timesheets.value.unshift(entry)
    message.success('บันทึกเวลาทำงานสำเร็จ')
    showModal.value = false
  } catch {
    message.error('บันทึกไม่สำเร็จ กรุณาลองใหม่')
  } finally {
    saving.value = false
  }
}

async function loadTimesheets() {
  try {
    timesheets.value = await getTimesheets()
  } catch {
    message.error('โหลดข้อมูลไม่สำเร็จ')
  }
}

onMounted(loadTimesheets)
</script>

<style scoped>
.timesheet-page {
  max-width: 1000px;
}

.cell-inner {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 2px 0;
}

.entry-badge {
  font-size: 11px;
  font-weight: 600;
  line-height: 1.4;
  padding: 1px 5px;
  border-radius: 4px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: default;
}

.entry-badge.requested { background: #f0a020; }
.entry-badge.approved  { background: #18a058; }
.entry-badge.rejected  { background: #d03050; }
</style>
