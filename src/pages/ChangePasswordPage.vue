<template>
  <div style="max-width: 480px; margin: 0 auto">
    <n-card title="เปลี่ยนรหัสผ่าน">
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="150px">
        <n-form-item label="รหัสผ่านปัจจุบัน" path="currentPassword">
          <n-input
            v-model:value="form.currentPassword"
            type="password"
            show-password-on="click"
            placeholder="กรอกรหัสผ่านปัจจุบัน"
          />
        </n-form-item>

        <n-form-item label="รหัสผ่านใหม่" path="newPassword">
          <n-input
            v-model:value="form.newPassword"
            type="password"
            show-password-on="click"
            placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัว)"
          />
        </n-form-item>

        <n-form-item label="ยืนยันรหัสผ่านใหม่" path="confirmPassword">
          <n-input
            v-model:value="form.confirmPassword"
            type="password"
            show-password-on="click"
            placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
          />
        </n-form-item>

        <n-alert v-if="errorMsg" type="error" :bordered="false" style="margin-bottom: 16px">
          {{ errorMsg }}
        </n-alert>

        <div style="display: flex; justify-content: flex-end; gap: 8px">
          <n-button @click="resetForm">ล้างข้อมูล</n-button>
          <n-button type="primary" :loading="loading" @click="handleSubmit">
            บันทึกรหัสผ่าน
          </n-button>
        </div>
      </n-form>
    </n-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useMessage } from 'naive-ui'
import { changePassword } from '@/services/userService'

const message = useMessage()
const formRef = ref(null)
const loading = ref(false)
const errorMsg = ref('')

const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const rules = {
  currentPassword: { required: true, message: 'กรุณากรอกรหัสผ่านปัจจุบัน', trigger: 'blur' },
  newPassword: [
    { required: true, message: 'กรุณากรอกรหัสผ่านใหม่', trigger: 'blur' },
    { min: 6, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: 'กรุณายืนยันรหัสผ่านใหม่', trigger: 'blur' },
    {
      validator: (_, value) => value === form.newPassword,
      message: 'รหัสผ่านไม่ตรงกัน',
      trigger: 'blur',
    },
  ],
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  loading.value = true
  errorMsg.value = ''

  try {
    await changePassword(form.currentPassword, form.newPassword)
    message.success('เปลี่ยนรหัสผ่านสำเร็จ')
    resetForm()
  } catch (err) {
    if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      errorMsg.value = 'รหัสผ่านปัจจุบันไม่ถูกต้อง'
    } else {
      errorMsg.value = 'เกิดข้อผิดพลาด: ' + (err.message || '')
    }
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(form, { currentPassword: '', newPassword: '', confirmPassword: '' })
  errorMsg.value = ''
}
</script>
