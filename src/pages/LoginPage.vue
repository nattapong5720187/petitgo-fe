<template>
  <div class="login-container">
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>

    <Card class="login-card" style="border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3)">
      <template #content>
        <div class="login-logo">
          <div class="logo-icon">🐾</div>
          <h1 class="logo-title">Petitgo</h1>
          <p class="logo-subtitle">Management System</p>
        </div>

        <Divider style="margin: 20px 0" />

        <Message v-if="errorMsg" severity="error" :closable="false" style="margin-bottom: 16px">
          {{ errorMsg }}
        </Message>

        <!-- LIFF (LINE) login — shown only inside LINE app -->
        <button v-if="isLiffBrowser" class="line-btn" :disabled="loading" @click="handleLiffLogin">
          <span v-if="loading" class="btn-spinner btn-spinner--white" />
          <span v-else class="line-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
            </svg>
          </span>
          <span>{{ loading ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบด้วย LINE' }}</span>
        </button>

        <!-- Google login — shown in regular browser -->
        <button v-else class="google-btn" :disabled="loading" @click="handleGoogleLogin">
          <span v-if="loading" class="btn-spinner" />
          <span v-else class="google-icon">
            <svg viewBox="0 0 48 48" width="20" height="20">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
          </span>
          <span>{{ loading ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบด้วย Google' }}</span>
        </button>

        <div class="login-footer">
          <span style="font-size: 12px; color: #999">Petitgo Management System v1.0</span>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { initLiff, isInLiff } from '@/services/liff'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const errorMsg = ref('')

// Pre-detect LINE in-app browser via UA before LIFF init completes
const isLiffBrowser = ref(/Line\//i.test(navigator.userAgent))

onMounted(async () => {
  if (!isLiffBrowser.value) return

  loading.value = true
  errorMsg.value = ''

  try {
    await initLiff()
    isLiffBrowser.value = isInLiff()
  } catch (err) {
    console.error('[LIFF init]', err)
    loading.value = false
    errorMsg.value = `LIFF เริ่มต้นไม่สำเร็จ: ${err?.message ?? err}`
    return
  }

  if (isLiffBrowser.value) {
    await handleLiffLogin()
  } else {
    loading.value = false
  }
})

async function handleLiffLogin() {
  loading.value = true
  errorMsg.value = ''

  const result = await authStore.loginWithLiff()

  loading.value = false

  if (result.ok) {
    router.push('/dashboard')
  } else if (result.error === 'user_not_registered') {
    errorMsg.value = 'บัญชี LINE นี้ไม่มีสิทธิ์เข้าถึงระบบ กรุณาติดต่อผู้ดูแล'
  } else {
    errorMsg.value = `เข้าสู่ระบบไม่สำเร็จ: ${result.error}`
  }
}

async function handleGoogleLogin() {
  loading.value = true
  errorMsg.value = ''

  const result = await authStore.loginWithGoogle()

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
  position: relative;
  z-index: 1;
}

.login-logo { text-align: center; margin-bottom: 8px; }
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
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
}
.google-btn:disabled { opacity: 0.7; cursor: not-allowed; }
.google-icon { display: flex; align-items: center; }

.login-footer { text-align: center; margin-top: 20px; }

.line-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 12px 16px;
  background: #06C755;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s;
  font-family: inherit;
}
.line-btn:hover:not(:disabled) {
  background: #05b34b;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
}
.line-btn:disabled { opacity: 0.7; cursor: not-allowed; }
.line-icon { display: flex; align-items: center; }

.btn-spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-top-color: #555;
  animation: btn-spin 0.7s linear infinite;
  flex-shrink: 0;
}
.btn-spinner--white {
  border-color: rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
}
@keyframes btn-spin {
  to { transform: rotate(360deg); }
}
</style>
