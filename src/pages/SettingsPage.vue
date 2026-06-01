<template>
  <div class="settings-page">
    <div class="settings-grid">
      <!-- Google Sheets Config -->
      <Card style="border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06)">
        <template #title>
          <div style="display:flex; justify-content:space-between; align-items:center">
            <span>การตั้งค่า Google Sheets API</span>
            <i class="pi pi-google" style="font-size:20px; color:#4285F4"></i>
          </div>
        </template>
        <template #content>
          <Message severity="info" :closable="false" style="margin-bottom: 16px">
            <p style="font-weight:600; margin-bottom:6px">วิธีรับ API Key:</p>
            <ol style="margin: 0 0 0 16px; font-size: 13px; line-height: 1.8">
              <li>ไปที่ <a href="https://console.cloud.google.com" target="_blank">Google Cloud Console</a></li>
              <li>สร้าง Project ใหม่หรือเลือก Project ที่มีอยู่</li>
              <li>เปิดใช้งาน <strong>Google Sheets API</strong></li>
              <li>สร้าง API Key ใน Credentials</li>
              <li>ตั้งค่า Sheet ให้ Share เป็น "Anyone with the link (Viewer)"</li>
            </ol>
          </Message>

          <div class="form-field">
            <label class="field-label">Google Sheets API Key</label>
            <div class="p-inputgroup">
              <InputText
                v-model="form.apiKey"
                :type="showKey ? 'text' : 'password'"
                placeholder="AIza..."
                style="flex:1"
              />
              <Button
                :icon="showKey ? 'pi pi-eye-slash' : 'pi pi-eye'"
                outlined
                @click="showKey = !showKey"
              />
            </div>
          </div>

          <div class="form-field">
            <label class="field-label">Spreadsheet ID</label>
            <InputText
              v-model="form.spreadsheetId"
              placeholder="1qY3QwT1POdYhgE1jeTWsxqLlra2CsUdsXVa2E8wl60c"
              style="width:100%"
            />
            <small class="field-hint">
              ค้นหาจาก URL: docs.google.com/spreadsheets/d/<strong>SPREADSHEET_ID</strong>/edit
            </small>
          </div>

          <div style="display:flex; gap:8px; margin-top:16px; flex-wrap:wrap">
            <Button
              icon="pi pi-save"
              label="บันทึกการตั้งค่า"
              :loading="testing"
              @click="saveConfig"
            />
            <Button
              icon="pi pi-bolt"
              label="ทดสอบการเชื่อมต่อ"
              :loading="testing"
              outlined
              @click="testConnection"
            />
          </div>

          <Message
            v-if="testResult"
            :severity="testResult.type"
            :closable="false"
            style="margin-top: 16px"
          >
            {{ testResult.message }}
          </Message>
        </template>
      </Card>

      <!-- Account Info -->
      <Card style="border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06)">
        <template #title>ข้อมูลบัญชี</template>
        <template #content>
          <div class="info-list">
            <div class="info-row">
              <span class="info-label">ชื่อผู้ใช้</span>
              <Tag :value="authStore.user?.username" severity="success" />
            </div>
            <div class="info-row">
              <span class="info-label">สิทธิ์</span>
              <Tag :value="authStore.user?.role" />
            </div>
            <div class="info-row">
              <span class="info-label">เข้าสู่ระบบเมื่อ</span>
              <span class="info-value">{{ formatLoginTime }}</span>
            </div>
          </div>
          <Divider />
          <Button
            icon="pi pi-sign-out"
            label="ออกจากระบบ"
            severity="danger"
            outlined
            @click="handleLogout"
          />
        </template>
      </Card>

      <!-- Sheet Info -->
      <Card style="border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06)">
        <template #title>ข้อมูล Spreadsheet</template>
        <template #content>
          <div class="info-list">
            <div class="info-row">
              <span class="info-label">Dashboard Tab</span>
              <Tag value="Dashboard" severity="secondary" />
            </div>
            <div class="info-row">
              <span class="info-label">Order Summary Tab</span>
              <Tag value="Order Summary" severity="secondary" />
            </div>
            <div class="info-row">
              <span class="info-label">กล่อง Tab</span>
              <Tag value="ทั่วไป" severity="secondary" />
            </div>
            <div class="info-row">
              <span class="info-label">Spreadsheet</span>
              <a
                :href="`https://docs.google.com/spreadsheets/d/${sheetsStore.spreadsheetId}`"
                target="_blank"
                class="sheets-link"
              >
                เปิดใน Google Sheets ↗
              </a>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useSheetsStore } from '@/stores/sheets'
import { useAuthStore } from '@/stores/auth'
import { fetchSheetData } from '@/services/googleSheets'

const sheetsStore = useSheetsStore()
const authStore = useAuthStore()
const router = useRouter()
const toast = useToast()

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
  toast.add({ severity: 'success', summary: 'สำเร็จ', detail: 'บันทึกการตั้งค่าสำเร็จ', life: 3000 })
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
    testResult.value = { type: 'success', message: 'เชื่อมต่อสำเร็จ! สามารถอ่านข้อมูลจาก Google Sheets ได้' }
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
.settings-page { }

.settings-grid { display: flex; flex-direction: column; gap: 16px; }

.form-field { margin-bottom: 16px; }

.field-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--p-text-color);
  margin-bottom: 6px;
}

.field-hint {
  display: block;
  font-size: 11px;
  color: var(--p-text-muted-color);
  margin-top: 4px;
}

.info-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }

.info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.info-label {
  min-width: 130px;
  color: var(--p-text-muted-color);
  font-size: 13px;
}

.info-value { color: var(--p-text-color); }

.sheets-link {
  color: var(--p-primary-500);
  text-decoration: none;
  font-size: 13px;
}
.sheets-link:hover { text-decoration: underline; }
</style>
