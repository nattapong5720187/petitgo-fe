<template>
  <div class="timesheet-page">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
      <h2 style="margin:0; font-size:20px; font-weight:700">ลงเวลาทำงาน</h2>
      <Tag value="คลิกที่วันที่เพื่อบันทึกเวลา" severity="info" />
    </div>

    <Card style="border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06)">
      <template #content>
        <!-- Calendar Navigation -->
        <div class="cal-nav">
          <Button icon="pi pi-chevron-left" text rounded @click="prevMonth" />
          <span class="cal-title">{{ calendarTitle }}</span>
          <Button icon="pi pi-chevron-right" text rounded @click="nextMonth" />
        </div>

        <!-- Weekday Headers -->
        <div class="cal-week-header">
          <div v-for="d in ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']" :key="d">{{ d }}</div>
        </div>

        <!-- Calendar Grid -->
        <div class="cal-grid">
          <div
            v-for="(cell, i) in calendarCells"
            :key="i"
            class="cal-cell"
            :class="{
              'other-month': !cell.currentMonth,
              'today': cell.isToday,
              'clickable': cell.currentMonth,
            }"
            @click="cell.currentMonth && onCellClick(cell)"
          >
            <span class="cal-day-num">{{ cell.day }}</span>
            <div class="cal-entries">
              <div
                v-for="entry in cell.entries"
                :key="entry.id"
                class="entry-badge"
                :class="entry.status?.toLowerCase()"
                :title="`${entry.type} · ${fmtHours(entry.startAt, entry.endAt)} · ${entry.status}`"
              >
                {{ entry.type }} {{ fmtHours(entry.startAt, entry.endAt) }}
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Log Timesheet Modal -->
    <Dialog
      v-model:visible="showModal"
      header="บันทึกเวลาทำงาน"
      :style="{ width: 'min(480px, calc(100vw - 16px))' }"
      modal
    >
      <div class="form-grid">
        <!-- Type -->
        <div class="form-field">
          <label class="field-label">ประเภท <span class="req">*</span></label>
          <Select
            v-model="form.type"
            :options="typeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="เลือกประเภท"
            style="width:100%"
            :class="{ 'p-invalid': errors.type }"
          />
          <small v-if="errors.type" class="error-msg">{{ errors.type }}</small>
        </div>

        <!-- Start time -->
        <div class="form-field">
          <label class="field-label">เวลาเริ่ม <span class="req">*</span></label>
          <DatePicker
            v-model="form.startAt"
            showTime
            hourFormat="24"
            dateFormat="dd/mm/yy"
            style="width:100%"
            :class="{ 'p-invalid': errors.startAt }"
          />
          <small v-if="errors.startAt" class="error-msg">{{ errors.startAt }}</small>
        </div>

        <!-- End time -->
        <div class="form-field">
          <label class="field-label">เวลาสิ้นสุด <span class="req">*</span></label>
          <DatePicker
            v-model="form.endAt"
            showTime
            hourFormat="24"
            dateFormat="dd/mm/yy"
            :minDate="endMinDate"
            style="width:100%"
            :class="{ 'p-invalid': errors.endAt }"
          />
          <small v-if="errors.endAt" class="error-msg">{{ errors.endAt }}</small>
        </div>

        <!-- Remark -->
        <div class="form-field">
          <label class="field-label">หมายเหตุ (ถ้ามี)</label>
          <Textarea v-model="form.remark" placeholder="หมายเหตุ..." :rows="2" style="width:100%; resize:vertical" />
        </div>
      </div>

      <template #footer>
        <Button label="ยกเลิก" outlined @click="showModal = false" />
        <Button label="บันทึก" :loading="saving" @click="handleSave" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { createTimesheet, getTimesheets } from '@/services/timesheetService'

const toast = useToast()

const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth()) // 0-indexed

const showModal = ref(false)
const saving = ref(false)
const timesheets = ref([])
const errors = ref({})

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

const calendarTitle = computed(() => {
  const d = new Date(currentYear.value, currentMonth.value, 1)
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long' })
})

const endMinDate = computed(() => {
  if (!form.value.startAt) return undefined
  const d = new Date(form.value.startAt)
  d.setHours(0, 0, 0, 0)
  return d
})

function prevMonth() {
  if (currentMonth.value === 0) { currentMonth.value = 11; currentYear.value-- }
  else currentMonth.value--
}

function nextMonth() {
  if (currentMonth.value === 11) { currentMonth.value = 0; currentYear.value++ }
  else currentMonth.value++
}

const calendarCells = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  const lastDayNum = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
  const today = new Date()
  const startPad = firstDay.getDay() // 0=Sun

  const cells = []

  // Previous month fill
  for (let i = startPad - 1; i >= 0; i--) {
    const date = new Date(currentYear.value, currentMonth.value, -i)
    cells.push({ day: date.getDate(), date, currentMonth: false, isToday: false, entries: [] })
  }

  // Current month days
  for (let d = 1; d <= lastDayNum; d++) {
    const date = new Date(currentYear.value, currentMonth.value, d)
    const isToday = date.toDateString() === today.toDateString()
    cells.push({
      day: d,
      date,
      currentMonth: true,
      isToday,
      entries: entriesOnDate(currentYear.value, currentMonth.value + 1, d),
    })
  }

  // Next month fill
  let nextDay = 1
  while (cells.length < 42) {
    const date = new Date(currentYear.value, currentMonth.value + 1, nextDay)
    cells.push({ day: nextDay, date, currentMonth: false, isToday: false, entries: [] })
    nextDay++
  }

  return cells
})

function entriesOnDate(year, month, date) {
  return timesheets.value.filter(t => {
    const d = new Date(t.startAt)
    return d.getFullYear() === year && d.getMonth() + 1 === month && d.getDate() === date
  })
}

function fmtHours(startIso, endIso) {
  if (!startIso || !endIso) return ''
  const h = (new Date(endIso) - new Date(startIso)) / 3_600_000
  return `${+h.toFixed(1)}h`
}

function onCellClick(cell) {
  const d = new Date(cell.date)
  d.setHours(18, 30, 0, 0)
  const endD = new Date(cell.date)
  endD.setHours(19, 30, 0, 0)
  form.value = { type: null, startAt: d, endAt: endD, remark: '' }
  errors.value = {}
  showModal.value = true
}

function validateForm() {
  const e = {}
  if (!form.value.type) e.type = 'กรุณาเลือกประเภท'
  if (!form.value.startAt) e.startAt = 'กรุณาเลือกเวลาเริ่ม'
  if (!form.value.endAt) e.endAt = 'กรุณาเลือกเวลาสิ้นสุด'
  else if (form.value.startAt && form.value.endAt <= form.value.startAt) e.endAt = 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม'
  errors.value = e
  return Object.keys(e).length === 0
}

async function handleSave() {
  if (!validateForm()) return

  saving.value = true
  try {
    const payload = {
      type: form.value.type,
      startAt: form.value.startAt.toISOString(),
      endAt: form.value.endAt.toISOString(),
      remark: form.value.remark,
    }
    const entry = await createTimesheet(payload)
    timesheets.value.unshift(entry)
    toast.add({ severity: 'success', summary: 'สำเร็จ', detail: 'บันทึกเวลาทำงานสำเร็จ', life: 3000 })
    showModal.value = false
  } catch {
    toast.add({ severity: 'error', summary: 'ผิดพลาด', detail: 'บันทึกไม่สำเร็จ กรุณาลองใหม่', life: 3000 })
  } finally {
    saving.value = false
  }
}

async function loadTimesheets() {
  try {
    timesheets.value = await getTimesheets()
  } catch {
    toast.add({ severity: 'error', summary: 'ผิดพลาด', detail: 'โหลดข้อมูลไม่สำเร็จ', life: 3000 })
  }
}

onMounted(loadTimesheets)
</script>

<style scoped>
.timesheet-page { }

.cal-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
}

.cal-title {
  font-size: 16px;
  font-weight: 600;
  min-width: 180px;
  text-align: center;
}

.cal-week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--p-text-muted-color);
  padding-bottom: 4px;
  border-bottom: 1px solid var(--p-surface-200);
  margin-bottom: 4px;
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.cal-cell {
  min-height: 80px;
  padding: 4px 6px;
  border-radius: 6px;
  transition: background 0.15s;
  position: relative;
}

.cal-cell.clickable { cursor: pointer; }
.cal-cell.clickable:hover { background: var(--p-surface-100); }
.cal-cell.today { background: var(--p-primary-50); }
.cal-cell.today .cal-day-num { color: var(--p-primary-500); font-weight: 700; }
.cal-cell.other-month { opacity: 0.35; }

.cal-day-num { font-size: 13px; display: block; margin-bottom: 2px; }

.cal-entries { display: flex; flex-direction: column; gap: 2px; }

.entry-badge {
  font-size: 10px;
  font-weight: 600;
  line-height: 1.4;
  padding: 1px 4px;
  border-radius: 3px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.entry-badge.requested { background: #f0a020; }
.entry-badge.approved { background: #18a058; }
.entry-badge.rejected { background: #d03050; }

/* Form */
.form-grid { display: flex; flex-direction: column; gap: 14px; }
.form-field { display: flex; flex-direction: column; gap: 4px; }
.field-label { font-size: 14px; font-weight: 500; }
.req { color: #d03050; }
.error-msg { color: #d03050; font-size: 12px; }

@media (max-width: 600px) {
  .cal-cell { min-height: 50px; }
  .entry-badge { display: none; }
}
</style>
