<template>
  <div>
    <div class="page-header">
      <h2 style="margin: 0; font-size:20px; font-weight:700; color:var(--p-text-color)">Scheduler Jobs</h2>
      <Button icon="pi pi-refresh" text rounded :loading="tableLoading" @click="loadJobs" />
    </div>

    <Card style="border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06)">
      <template #content>
        <DataTable :value="jobs" :loading="tableLoading" :stripedRows="true" size="small" scrollable>
          <template #empty>
            <div style="text-align:center; padding:30px; color:#999">ไม่มีข้อมูล job</div>
          </template>

          <Column field="name" header="Job" style="min-width:160px">
            <template #body="{ data }">
              <span class="mono-text">{{ data.name || '-' }}</span>
            </template>
          </Column>
          <Column field="executedAt" header="รันล่าสุด" style="min-width:170px">
            <template #body="{ data }">
              {{ formatDate(data.executedAt) }}
            </template>
          </Column>
          <Column header="สถานะ" style="width:120px">
            <template #body="{ data }">
              <Tag
                :value="isToday(data.executedAt) ? 'วันนี้' : 'ยังไม่รันวันนี้'"
                :severity="isToday(data.executedAt) ? 'success' : 'warn'"
              />
            </template>
          </Column>
          <Column header="" style="width:130px; text-align:right">
            <template #body="{ data }">
              <Button
                label="Run now"
                icon="pi pi-play"
                size="small"
                outlined
                :loading="runningId === data.id"
                :disabled="!!runningId"
                @click="confirmJob = data"
              />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <Dialog
      :visible="!!confirmJob"
      header="ยืนยันการรัน job"
      :style="{ width: '420px' }"
      :modal="true"
      @update:visible="v => { if (!v) confirmJob = null }"
    >
      <p style="margin:0; line-height:1.6">
        รัน <span class="mono-text">{{ confirmJob?.name }}</span> ทันที?
        job จะทำงานจริง (เช่น ส่งข้อความเข้า LINE / Discord) แม้วันนี้จะรันไปแล้วก็ตาม
      </p>
      <template #footer>
        <Button label="ยกเลิก" text @click="confirmJob = null" />
        <Button label="Run now" icon="pi pi-play" @click="startRun(confirmJob)" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { getJobs, runJob } from '@/services/jobService'

const POLL_INTERVAL_MS = 3000
const POLL_TIMEOUT_MS = 90000

const toast = useToast()
const jobs = ref([])
const tableLoading = ref(false)
const confirmJob = ref(null)
const runningId = ref(null)
let pollTimer = null

function formatDate(iso) {
  if (!iso) return '-'
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function isToday(iso) {
  return !!iso && new Date(iso).toDateString() === new Date().toDateString()
}

async function loadJobs() {
  tableLoading.value = true
  try {
    jobs.value = await getJobs()
  } catch {
    toast.add({ severity: 'error', summary: 'ผิดพลาด', detail: 'โหลดข้อมูล job ไม่สำเร็จ', life: 3000 })
  } finally {
    tableLoading.value = false
  }
}

async function startRun(job) {
  confirmJob.value = null
  runningId.value = job.id
  try {
    const { triggeredAt } = await runJob(job.id)
    toast.add({ severity: 'info', summary: 'กำลังรัน', detail: `สั่งรัน ${job.name} แล้ว`, life: 3000 })
    pollUntilExecuted(job, triggeredAt)
  } catch (err) {
    runningId.value = null
    const detail = err.response?.data?.message || 'สั่งรัน job ไม่สำเร็จ'
    toast.add({ severity: 'error', summary: 'ผิดพลาด', detail, life: 5000 })
  }
}

// the job runs asynchronously in Cloud Functions; wait for it to record executedAt
function pollUntilExecuted(job, triggeredAt) {
  const deadline = Date.now() + POLL_TIMEOUT_MS
  const tick = async () => {
    try {
      jobs.value = await getJobs()
    } catch {
      // keep polling until the deadline
    }
    const current = jobs.value.find(j => j.id === job.id)
    if (current?.executedAt && new Date(current.executedAt) >= new Date(triggeredAt)) {
      runningId.value = null
      toast.add({ severity: 'success', summary: 'สำเร็จ', detail: `${job.name} รันเสร็จแล้ว`, life: 3000 })
      return
    }
    if (Date.now() > deadline) {
      runningId.value = null
      toast.add({
        severity: 'warn',
        summary: 'ยังไม่เสร็จ',
        detail: `${job.name} ยังไม่บันทึกเวลารัน ลองตรวจ log ของ function`,
        life: 6000,
      })
      return
    }
    pollTimer = setTimeout(tick, POLL_INTERVAL_MS)
  }
  pollTimer = setTimeout(tick, POLL_INTERVAL_MS)
}

onMounted(loadJobs)
onUnmounted(() => clearTimeout(pollTimer))
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.mono-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
}
</style>
