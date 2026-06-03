<template>
  <div>
    <h2 style="margin: 0 0 20px; font-size:20px; font-weight:700; color:var(--p-text-color)">จัดการผู้ใช้งาน</h2>

    <Card style="border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06)">
      <template #content>
        <DataTable
          :value="users"
          :loading="tableLoading"
          :paginator="true"
          :rows="10"
          :stripedRows="true"
          size="small"
          scrollable
        >
          <template #empty>
            <div style="text-align:center; padding:30px; color:#999">ไม่มีข้อมูลผู้ใช้งาน</div>
          </template>

          <Column header="#" style="width:56px; text-align:center">
            <template #body="{ index }">
              {{ index + 1 }}
            </template>
          </Column>
          <Column field="username" header="ชื่อผู้ใช้" style="min-width:130px" />
          <Column field="name" header="ชื่อ-นามสกุล" style="min-width:140px" />
          <Column field="role" header="Role" style="width:110px">
            <template #body="{ data }">
              <Tag
                :value="isAdmin(data.role) ? 'Admin' : 'User'"
                :severity="isAdmin(data.role) ? 'warn' : 'info'"
              />
            </template>
          </Column>
          <Column field="createdAt" header="วันที่สร้าง" style="width:130px">
            <template #body="{ data }">
              {{ data.createdAt ? formatDate(data.createdAt) : '-' }}
            </template>
          </Column>
          <Column header="" style="width:70px; text-align:center">
            <template #body="{ data }">
              <Button
                icon="pi pi-pencil"
                size="small"
                text
                rounded
                @click="openEdit(data)"
              />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Edit Modal -->
    <Dialog
      v-model:visible="editVisible"
      header="แก้ไขข้อมูลผู้ใช้"
      :style="{ width: '480px' }"
      :modal="true"
      :closable="!saving"
    >
      <div class="edit-form">
        <div class="edit-field">
          <label class="edit-label">ชื่อผู้ใช้ (username)</label>
          <InputText v-model="editForm.username" style="width:100%" />
        </div>
        <div class="edit-field">
          <label class="edit-label">ชื่อ-นามสกุล (name)</label>
          <InputText v-model="editForm.name" style="width:100%" />
        </div>
        <div class="edit-field">
          <label class="edit-label">Google UID</label>
          <InputText v-model="editForm.uid" style="width:100%" />
        </div>
        <div class="edit-field">
          <label class="edit-label">LINE User ID</label>
          <InputText v-model="editForm.lineUserId" placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" style="width:100%" />
        </div>
        <div class="edit-field">
          <label class="edit-label">Role</label>
          <Select
            v-model="editForm.role"
            :options="roleOptions"
            optionLabel="label"
            optionValue="value"
            style="width:100%"
          />
        </div>
      </div>

      <template #footer>
        <Button label="ยกเลิก" text :disabled="saving" @click="editVisible = false" />
        <Button label="บันทึก" icon="pi pi-save" :loading="saving" @click="saveEdit" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { getUsers, updateUser } from '@/services/userService'

const toast = useToast()
const users = ref([])
const tableLoading = ref(false)

const editVisible = ref(false)
const saving = ref(false)
const editDocId = ref(null)
const editForm = ref({ username: '', name: '', uid: '', lineUserId: '', role: 'user' })

const roleOptions = [
  { label: 'User', value: 'USER' },
  { label: 'Admin', value: 'ADMIN' },
]

function formatDate(iso) {
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function isAdmin(role) {
  return role === 'admin' || role === 'ADMIN'
}

function openEdit(data) {
  editDocId.value = data.documentId
  editForm.value = {
    username: data.username ?? '',
    name: data.name ?? '',
    uid: data.uid ?? '',
    lineUserId: data.lineUserId ?? '',
    role: isAdmin(data.role) ? 'ADMIN' : 'USER',
  }
  editVisible.value = true
}

async function saveEdit() {
  saving.value = true
  try {
    const updated = await updateUser(editDocId.value, editForm.value)
    const idx = users.value.findIndex(u => u.documentId === editDocId.value)
    if (idx !== -1) users.value[idx] = updated
    editVisible.value = false
    toast.add({ severity: 'success', summary: 'สำเร็จ', detail: 'อัปเดตข้อมูลผู้ใช้เรียบร้อย', life: 3000 })
  } catch {
    toast.add({ severity: 'error', summary: 'ผิดพลาด', detail: 'บันทึกข้อมูลไม่สำเร็จ', life: 3000 })
  } finally {
    saving.value = false
  }
}

async function loadUsers() {
  tableLoading.value = true
  try {
    users.value = await getUsers()
  } catch {
    toast.add({ severity: 'error', summary: 'ผิดพลาด', detail: 'โหลดข้อมูลผู้ใช้ไม่สำเร็จ', life: 3000 })
  } finally {
    tableLoading.value = false
  }
}

onMounted(loadUsers)
</script>

<style scoped>
.mono-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  color: var(--p-text-muted-color);
  word-break: break-all;
}

.edit-form { display: flex; flex-direction: column; gap: 14px; }

.edit-field { display: flex; flex-direction: column; gap: 5px; }

.edit-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--p-text-muted-color);
}
</style>
