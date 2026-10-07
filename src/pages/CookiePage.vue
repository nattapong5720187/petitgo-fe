<template>
  <div>
    <h2 style="margin: 0 0 20px; font-size:20px; font-weight:700; color:var(--p-text-color)">BigSeller Cookie</h2>

    <div v-if="loading" style="text-align:center; padding:30px">
      <ProgressSpinner style="width:36px; height:36px" />
    </div>

    <Card v-else-if="!cookies.length" style="border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06)">
      <template #content>
        <div style="text-align:center; padding:30px; color:#999">ไม่มีข้อมูล cookie</div>
      </template>
    </Card>

    <div v-else class="cookie-list">
      <Card
        v-for="item in cookies"
        :key="item.id"
        style="border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06)"
      >
        <template #title>
          <span class="mono-text">{{ item.id }}</span>
        </template>
        <template #content>
          <div class="info-list">
            <div class="info-row">
              <span class="info-label">อัปเดตล่าสุด</span>
              <span>{{ formatDate(item.updatedAt) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">แจ้งเตือนล่าสุด</span>
              <span>{{ formatDate(item.latestNotifiedAt) }}</span>
            </div>
          </div>

          <div class="edit-field">
            <label class="edit-label">Cookie</label>
            <Textarea
              v-model="drafts[item.id]"
              rows="5"
              autoResize
              class="mono-input"
              style="width:100%"
            />
          </div>

          <div class="actions">
            <Button
              label="คืนค่า"
              text
              :disabled="savingId === item.id || drafts[item.id] === item.cookie"
              @click="drafts[item.id] = item.cookie"
            />
            <Button
              label="บันทึก"
              icon="pi pi-save"
              :loading="savingId === item.id"
              :disabled="!drafts[item.id]?.trim() || drafts[item.id] === item.cookie"
              @click="save(item)"
            />
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { getCookies, updateCookie } from '@/services/cookieService'

const toast = useToast()
const cookies = ref([])
const drafts = ref({})
const loading = ref(false)
const savingId = ref(null)

function formatDate(iso) {
  if (!iso) return '-'
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

async function save(item) {
  savingId.value = item.id
  try {
    const updated = await updateCookie(item.id, drafts.value[item.id])
    const idx = cookies.value.findIndex(c => c.id === item.id)
    if (idx !== -1) cookies.value[idx] = updated
    drafts.value[item.id] = updated.cookie
    toast.add({ severity: 'success', summary: 'สำเร็จ', detail: 'บันทึก cookie เรียบร้อย', life: 3000 })
  } catch {
    toast.add({ severity: 'error', summary: 'ผิดพลาด', detail: 'บันทึก cookie ไม่สำเร็จ', life: 3000 })
  } finally {
    savingId.value = null
  }
}

async function loadCookies() {
  loading.value = true
  try {
    cookies.value = await getCookies()
    drafts.value = Object.fromEntries(cookies.value.map(c => [c.id, c.cookie]))
  } catch {
    toast.add({ severity: 'error', summary: 'ผิดพลาด', detail: 'โหลดข้อมูล cookie ไม่สำเร็จ', life: 3000 })
  } finally {
    loading.value = false
  }
}

onMounted(loadCookies)
</script>

<style scoped>
.cookie-list { display: flex; flex-direction: column; gap: 16px; }

.mono-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 14px;
  word-break: break-all;
}

.mono-input {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  word-break: break-all;
}

.info-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }

.info-row { display: flex; align-items: center; gap: 12px; font-size: 14px; }

.info-label { min-width: 110px; color: var(--p-text-muted-color); font-size: 13px; }

.edit-field { display: flex; flex-direction: column; gap: 5px; }

.edit-label { font-size: 13px; font-weight: 500; color: var(--p-text-muted-color); }

.actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
</style>
