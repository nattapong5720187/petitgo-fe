<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
      <n-h2 style="margin: 0">จัดการผู้ใช้งาน</n-h2>
      <n-button type="primary" @click="openCreateModal">
        <template #icon><n-icon :component="PersonAddOutline" /></template>
        สร้าง User ใหม่
      </n-button>
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

    <!-- Create User Modal -->
    <n-modal v-model:show="showModal" preset="card" title="สร้างผู้ใช้งานใหม่" style="width: min(500px, calc(100vw - 16px))">
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
        <n-form-item label="ชื่อผู้ใช้" path="username">
          <n-input v-model:value="form.username" placeholder="กรอกชื่อผู้ใช้" />
        </n-form-item>

        <n-form-item label="รหัสผ่าน" path="password">
          <n-input-group>
            <n-input
              v-model:value="form.password"
              placeholder="รหัสผ่าน"
              style="flex: 1"
            />
            <n-button @click="handleGenPassword" title="สุ่มรหัสผ่าน">
              <template #icon><n-icon :component="RefreshOutline" /></template>
            </n-button>
            <n-button @click="copyPassword" title="คัดลอก">
              <template #icon><n-icon :component="CopyOutline" /></template>
            </n-button>
          </n-input-group>
        </n-form-item>

        <n-form-item label="ชื่อ" path="firstName">
          <n-input v-model:value="form.firstName" placeholder="กรอกชื่อ" />
        </n-form-item>

        <n-form-item label="นามสกุล" path="lastName">
          <n-input v-model:value="form.lastName" placeholder="กรอกนามสกุล" />
        </n-form-item>

        <n-form-item label="เบอร์โทร" path="phone">
          <n-input v-model:value="form.phone" placeholder="กรอกเบอร์โทร" />
        </n-form-item>

        <n-form-item label="Role" path="role">
          <n-select
            v-model:value="form.role"
            :options="roleOptions"
            placeholder="เลือก Role"
          />
        </n-form-item>
      </n-form>

      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 8px">
          <n-button @click="showModal = false">ยกเลิก</n-button>
          <n-button type="primary" :loading="createLoading" @click="handleCreateUser">
            สร้างผู้ใช้
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, reactive, h, onMounted } from 'vue'
import { useMessage, NTag, NButton, NIcon } from 'naive-ui'
import { PersonAddOutline, RefreshOutline, CopyOutline } from '@vicons/ionicons5'
import { getUsers, createUser, generatePassword } from '@/services/userService'

const message = useMessage()

const users = ref([])
const tableLoading = ref(false)
const showModal = ref(false)
const createLoading = ref(false)
const formRef = ref(null)

const form = reactive({
  username: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  role: null,
})

const rules = {
  username: { required: true, message: 'กรุณากรอกชื่อผู้ใช้', trigger: 'blur' },
  password: { required: true, message: 'กรุณากรอกรหัสผ่าน', trigger: 'blur' },
  firstName: { required: true, message: 'กรุณากรอกชื่อ', trigger: 'blur' },
  lastName: { required: true, message: 'กรุณากรอกนามสกุล', trigger: 'blur' },
  role: { required: true, message: 'กรุณาเลือก Role', trigger: 'change' },
}

const roleOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'User', value: 'user' },
]

const columns = [
  { title: 'ชื่อผู้ใช้', key: 'username', width: 130 },
  {
    title: 'ชื่อ-นามสกุล',
    key: 'fullName',
    render: row => `${row.firstName} ${row.lastName}`,
  },
  { title: 'เบอร์โทร', key: 'phone', render: row => row.phone || '-' },
  {
    title: 'Role',
    key: 'role',
    width: 100,
    render: row =>
      h(NTag, { type: row.role === 'admin' ? 'warning' : 'info', size: 'small' }, () =>
        row.role === 'admin' ? 'Admin' : 'User',
      ),
  },
  {
    title: 'วันที่สร้าง',
    key: 'createdAt',
    render: row => new Date(row.createdAt).toLocaleDateString('th-TH'),
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

function openCreateModal() {
  Object.assign(form, { username: '', password: generatePassword(), firstName: '', lastName: '', phone: '', role: null })
  showModal.value = true
}

function handleGenPassword() {
  form.password = generatePassword()
}

async function copyPassword() {
  try {
    await navigator.clipboard.writeText(form.password)
    message.success('คัดลอกรหัสผ่านแล้ว')
  } catch {
    message.error('ไม่สามารถคัดลอกได้')
  }
}

async function handleCreateUser() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  createLoading.value = true
  try {
    await createUser({ ...form })
    message.success(`สร้างผู้ใช้ "${form.username}" สำเร็จ`)
    showModal.value = false
    await loadUsers()
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      message.error('ชื่อผู้ใช้นี้มีอยู่แล้ว')
    } else {
      message.error('สร้างผู้ใช้ไม่สำเร็จ: ' + (err.message || ''))
    }
  } finally {
    createLoading.value = false
  }
}

onMounted(loadUsers)
</script>
