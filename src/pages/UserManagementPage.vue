<template>
  <div>
    <div style="margin-bottom: 20px">
      <n-h2 style="margin: 0">จัดการผู้ใช้งาน</n-h2>
    </div>

    <n-card>
      <n-data-table
        :columns="columns"
        :data="users"
        :loading="tableLoading"
        :pagination="{ pageSize: 10 }"
        striped
      />
    </n-card>
  </div>
</template>

<script setup>
import { ref, h, onMounted } from 'vue'
import { useMessage, NTag } from 'naive-ui'
import { getUsers } from '@/services/userService'

const message = useMessage()

const users = ref([])
const tableLoading = ref(false)

const columns = [
  { title: 'ชื่อผู้ใช้', key: 'username' },
  {
    title: 'ชื่อ-นามสกุล',
    key: 'name'
  },
  {
    title: 'Role',
    key: 'role',
    width: 100,
    render: row =>
      h(NTag, { type: row.role === 'admin' || row.role === 'ADMIN' ? 'warning' : 'info', size: 'small' }, () =>
        row.role === 'admin' || row.role === 'ADMIN' ? 'Admin' : 'User',
      ),
  },
  {
    title: 'วันที่สร้าง',
    key: 'createdAt',
    render: row =>
      row.createdAt ? new Date(row.createdAt).toLocaleDateString('th-TH') : '-',
  },
]

async function loadUsers() {
  tableLoading.value = true
  try {
    users.value = await getUsers()
  } catch {
    message.error('โหลดข้อมูลผู้ใช้ไม่สำเร็จ')
  } finally {
    tableLoading.value = false
  }
}

onMounted(loadUsers)
</script>
