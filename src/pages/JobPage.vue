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
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { getJobs } from '@/services/jobService'

const toast = useToast()
const jobs = ref([])
const tableLoading = ref(false)

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

onMounted(loadJobs)
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
