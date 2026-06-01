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
        >
          <template #empty>
            <div style="text-align:center; padding:30px; color:#999">ไม่มีข้อมูลผู้ใช้งาน</div>
          </template>

          <Column field="username" header="ชื่อผู้ใช้" />
          <Column field="name" header="ชื่อ-นามสกุล" />
          <Column field="role" header="Role" style="width:120px">
            <template #body="{ data }">
              <Tag
                :value="(data.role === 'admin' || data.role === 'ADMIN') ? 'Admin' : 'User'"
                :severity="(data.role === 'admin' || data.role === 'ADMIN') ? 'warn' : 'info'"
              />
            </template>
          </Column>
          <Column field="createdAt" header="วันที่สร้าง" style="width:140px">
            <template #body="{ data }">
              {{ data.createdAt ? new Date(data.createdAt).toLocaleDateString('th-TH') : '-' }}
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
import { getUsers } from '@/services/userService'

const toast = useToast()
const users = ref([])
const tableLoading = ref(false)

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
