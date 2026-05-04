<template>
  <div class="login-container">
    <!-- Background decoration -->
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>

    <n-card class="login-card" :bordered="false">
      <!-- Logo -->
      <div class="login-logo">
        <div class="logo-icon">🐾</div>
        <h1 class="logo-title">Petitgo</h1>
        <p class="logo-subtitle">Management System</p>
      </div>

      <n-divider style="margin: 16px 0" />

      <!-- Login Form -->
      <n-form ref="formRef" :model="form" :rules="rules" @keydown.enter="handleLogin">
        <n-form-item path="username" label="ชื่อผู้ใช้">
          <n-input
            v-model:value="form.username"
            placeholder="กรอกชื่อผู้ใช้"
            size="large"
            :disabled="loading"
          >
            <template #prefix>
              <n-icon :component="PersonOutline" />
            </template>
          </n-input>
        </n-form-item>

        <n-form-item path="password" label="รหัสผ่าน">
          <n-input
            v-model:value="form.password"
            type="password"
            placeholder="กรอกรหัสผ่าน"
            size="large"
            show-password-on="click"
            :disabled="loading"
          >
            <template #prefix>
              <n-icon :component="LockClosedOutline" />
            </template>
          </n-input>
        </n-form-item>

        <n-alert v-if="errorMsg" type="error" :bordered="false" style="margin-bottom: 16px">
          {{ errorMsg }}
        </n-alert>

        <n-button
          type="primary"
          size="large"
          block
          :loading="loading"
          @click="handleLogin"
        >
          เข้าสู่ระบบ
        </n-button>
      </n-form>

      <div class="login-footer">
        <n-text depth="3" style="font-size: 12px">
          Petitgo Management System v1.0
        </n-text>
      </div>
    </n-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { PersonOutline, LockClosedOutline } from '@vicons/ionicons5'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const formRef = ref(null)
const loading = ref(false)
const errorMsg = ref('')

const form = reactive({
  username: '',
  password: '',
})

const rules = {
  username: { required: true, message: 'กรุณากรอกชื่อผู้ใช้', trigger: 'blur' },
  password: { required: true, message: 'กรุณากรอกรหัสผ่าน', trigger: 'blur' },
}

async function handleLogin() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  loading.value = true
  errorMsg.value = ''

  const ok = await authStore.login(form.username, form.password)
  loading.value = false

  if (ok) {
    router.push('/dashboard')
  } else {
    errorMsg.value = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.bg-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.15;
  background: white;
}

.circle-1 {
  width: 400px;
  height: 400px;
  top: -100px;
  right: -100px;
}

.circle-2 {
  width: 250px;
  height: 250px;
  bottom: -50px;
  left: -50px;
}

.circle-3 {
  width: 150px;
  height: 150px;
  bottom: 120px;
  right: 80px;
}

.login-card {
  width: 400px;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
}

.login-logo {
  text-align: center;
  margin-bottom: 8px;
}

.logo-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.logo-title {
  font-size: 28px;
  font-weight: 800;
  background: linear-gradient(135deg, #18a058, #36ad6a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}

.logo-subtitle {
  color: #999;
  font-size: 13px;
  margin: 4px 0 0;
}

.login-footer {
  text-align: center;
  margin-top: 20px;
}
</style>
