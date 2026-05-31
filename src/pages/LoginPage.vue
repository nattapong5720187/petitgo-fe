<template>
  <div class="login-container">
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>

    <n-card class="login-card" :bordered="false">
      <div class="login-logo">
        <div class="logo-icon">🐾</div>
        <h1 class="logo-title">Petitgo</h1>
        <p class="logo-subtitle">Management System</p>
      </div>

      <n-divider style="margin: 20px 0" />

      <n-alert v-if="errorMsg" type="error" :bordered="false" style="margin-bottom: 16px">
        {{ errorMsg }}
      </n-alert>

      <button class="google-btn" :disabled="loading" @click="handleGoogleLogin">
        <span class="google-icon" v-if="!loading">
          <svg viewBox="0 0 48 48" width="20" height="20">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
        </span>
        <n-spin v-else size="small" style="margin-right: 8px" />
        <span>{{ loading ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบด้วย Google' }}</span>
      </button>

      <div class="login-footer">
        <n-text depth="3" style="font-size: 12px">
          Petitgo Management System v1.0
        </n-text>
      </div>
    </n-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const errorMsg = ref('')

// Handle result after redirect-based sign-in returns to this page
onMounted(async () => {
  loading.value = true
  const result = await authStore.handleRedirectResult()
  loading.value = false
  if (result?.ok) {
    router.push('/dashboard')
  } else if (result?.error === 'user_not_registered') {
    errorMsg.value = 'บัญชีนี้ไม่มีสิทธิ์เข้าถึงระบบ กรุณาติดต่อผู้ดูแล'
  }
})

async function handleGoogleLogin() {
  loading.value = true
  errorMsg.value = ''

  const result = await authStore.loginWithGoogle()

  if (result?.redirecting) {
    // Page will redirect to Google — keep spinner showing
    return
  }

  loading.value = false

  if (result.ok) {
    router.push('/dashboard')
  } else if (!result.cancelled) {
    if (result.error === 'user_not_registered') {
      errorMsg.value = 'บัญชีนี้ไม่มีสิทธิ์เข้าถึงระบบ กรุณาติดต่อผู้ดูแล'
    } else {
      errorMsg.value = 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
    }
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

.circle-1 { width: 400px; height: 400px; top: -100px; right: -100px; }
.circle-2 { width: 250px; height: 250px; bottom: -50px; left: -50px; }
.circle-3 { width: 150px; height: 150px; bottom: 120px; right: 80px; }

.login-card {
  width: min(400px, calc(100vw - 32px));
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
}

.login-logo {
  text-align: center;
  margin-bottom: 8px;
}

.logo-icon { font-size: 48px; margin-bottom: 8px; }

.logo-title {
  font-size: 28px;
  font-weight: 800;
  background: linear-gradient(135deg, #18a058, #36ad6a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}

.logo-subtitle { color: #999; font-size: 13px; margin: 4px 0 0; }

.google-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 12px 16px;
  background: #fff;
  border: 1px solid #dadce0;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  color: #3c4043;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s;
  font-family: inherit;
}

.google-btn:hover:not(:disabled) {
  background: #f8f9fa;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}

.google-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.google-icon { display: flex; align-items: center; }

.login-footer {
  text-align: center;
  margin-top: 20px;
}
</style>
