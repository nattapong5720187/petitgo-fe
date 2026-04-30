<template>
  <div class="settings-page">
    <n-grid :cols="1" :y-gap="16" style="max-width: 640px">
      <!-- Google Sheets Config -->
      <n-gi>
        <n-card title="การตั้งค่า Google Sheets API" :bordered="false" style="border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06)">
          <template #header-extra>
            <n-icon :component="LogoGoogle" size="20" color="#4285F4" />
          </template>

          <n-alert type="info" :bordered="false" style="margin-bottom: 16px">
            <p>วิธีรับ API Key:</p>
            <ol style="margin: 8px 0 0 16px; font-size: 13px; line-height: 1.8">
              <li>ไปที่ <a href="https://console.cloud.google.com" target="_blank">Google Cloud Console</a></li>
              <li>สร้าง Project ใหม่หรือเลือก Project ที่มีอยู่</li>
              <li>เปิดใช้งาน <strong>Google Sheets API</strong></li>
              <li>สร้าง API Key ใน Credentials</li>
              <li>ตั้งค่า Sheet ให้ Share เป็น "Anyone with the link (Viewer)"</li>
            </ol>
          </n-alert>

          <n-form :model="form" label-placement="top">
            <n-form-item label="Google Sheets API Key">
              <n-input
                v-model:value="form.apiKey"
                placeholder="AIza..."
                :type="showKey ? 'text' : 'password'"
              >
                <template #suffix>
                  <n-button text @click="showKey = !showKey">
                    <n-icon :component="showKey ? EyeOffOutline : EyeOutline" />
                  </n-button>
                </template>
              </n-input>
            </n-form-item>

            <n-form-item label="Spreadsheet ID">
              <n-input
                v-model:value="form.spreadsheetId"
                placeholder="1qY3QwT1POdYhgE1jeTWsxqLlra2CsUdsXVa2E8wl60c"
              />
              <template #feedback>
                <n-text depth="3" style="font-size: 11px">
                  ค้นหาจาก URL: docs.google.com/spreadsheets/d/<strong>SPREADSHEET_ID</strong>/edit
                </n-text>
              </template>
            </n-form-item>
          </n-form>

          <n-space style="margin-top: 8px">
            <n-button type="primary" @click="saveConfig" :loading="testing">
              <template #icon><n-icon :component="SaveOutline" /></template>
              บันทึกการตั้งค่า
            </n-button>
            <n-button @click="testConnection" :loading="testing" ghost>
              <template #icon><n-icon :component="FlashOutline" /></template>
              ทดสอบการเชื่อมต่อ
            </n-button>
          </n-space>

          <n-alert v-if="testResult" :type="testResult.type" :bordered="false" style="margin-top: 16px">
            {{ testResult.message }}
          </n-alert>
        </n-card>
      </n-gi>

      <!-- Account Info -->
      <n-gi>
        <n-card title="ข้อมูลบัญชี" :bordered="false" style="border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06)">
          <n-descriptions :column="1" label-placement="left">
            <n-descriptions-item label="ชื่อผู้ใช้">
              <n-tag type="success">{{ authStore.user?.username }}</n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="สิทธิ์">
              <n-tag>{{ authStore.user?.role }}</n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="เข้าสู่ระบบเมื่อ">
              {{ formatLoginTime }}
            </n-descriptions-item>
          </n-descriptions>

          <n-divider />

          <n-button type="error" ghost @click="handleLogout">
            <template #icon><n-icon :component="LogOutOutline" /></template>
            ออกจากระบบ
          </n-button>
        </n-card>
      </n-gi>

      <!-- Sheet Info -->
      <n-gi>
        <n-card title="ข้อมูล Spreadsheet" :bordered="false" style="border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06)">
          <n-descriptions :column="1" label-placement="left">
            <n-descriptions-item label="Dashboard Tab">
              <n-tag size="small">Dashboard</n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="Order Summary Tab">
              <n-tag size="small">Order Summary</n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="กล่อง Tab">
              <n-tag size="small">ทั่วไป</n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="Spreadsheet">
              <n-button
                text
                type="primary"
                tag="a"
                :href="`https://docs.google.com/spreadsheets/d/${sheetsStore.spreadsheetId}`"
                target="_blank"
              >
                เปิดใน Google Sheets ↗
              </n-button>
            </n-descriptions-item>
          </n-descriptions>
        </n-card>
      </n-gi>
    </n-grid>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import {
  SaveOutline, FlashOutline, EyeOutline, EyeOffOutline,
  LogOutOutline, LogoGoogle,
} from '@vicons/ionicons5'
import { useSheetsStore } from '@/stores/sheets'
import { useAuthStore } from '@/stores/auth'
import { fetchSheetData } from '@/services/googleSheets'

const sheetsStore = useSheetsStore()
const authStore = useAuthStore()
const router = useRouter()
const message = useMessage()

const showKey = ref(false)
const testing = ref(false)
const testResult = ref(null)

const form = reactive({
  apiKey: sheetsStore.apiKey,
  spreadsheetId: sheetsStore.spreadsheetId,
})

const formatLoginTime = computed(() => {
  if (!authStore.user?.loginAt) return '-'
  return new Date(authStore.user.loginAt).toLocaleString('th-TH')
})

function saveConfig() {
  sheetsStore.saveConfig(form.apiKey, form.spreadsheetId)
  message.success('บันทึกการตั้งค่าสำเร็จ')
}

async function testConnection() {
  if (!form.apiKey) {
    testResult.value = { type: 'error', message: 'กรุณากรอก API Key ก่อน' }
    return
  }

  testing.value = true
  testResult.value = null

  try {
    await fetchSheetData(form.spreadsheetId, 'Dashboard', form.apiKey)
    testResult.value = {
      type: 'success',
      message: 'เชื่อมต่อสำเร็จ! สามารถอ่านข้อมูลจาก Google Sheets ได้',
    }
    // Auto save on success
    sheetsStore.saveConfig(form.apiKey, form.spreadsheetId)
  } catch (err) {
    testResult.value = {
      type: 'error',
      message: `เชื่อมต่อไม่สำเร็จ: ${err.response?.data?.error?.message || err.message}`,
    }
  } finally {
    testing.value = false
  }
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.settings-page {
  max-width: 700px;
}
</style>
