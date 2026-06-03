<template>
  <div class="settings-page">
    <div class="settings-grid">
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
import { useSheetsStore } from '@/stores/sheets'

const sheetsStore = useSheetsStore()
</script>

<style scoped>
.settings-page { }

.settings-grid { display: flex; flex-direction: column; gap: 16px; }

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

.sheets-link {
  color: var(--p-primary-500);
  text-decoration: none;
  font-size: 13px;
}
.sheets-link:hover { text-decoration: underline; }
</style>
