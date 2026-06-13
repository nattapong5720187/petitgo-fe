<template>
  <div class="slip-page">
    <div class="page-head">
      <h2 class="page-title">บันทึกสลิป (Slip Upload)</h2>
      <Button label="อัปโหลดสลิป" icon="pi pi-upload" @click="openModal" />
    </div>

    <Card style="border-radius: 12px; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06)">
      <template #content>
        <DataTable
          :value="slips"
          :loading="loading"
          paginator
          :rows="10"
          :rowsPerPageOptions="[10, 20, 50]"
          dataKey="id"
          stripedRows
          responsiveLayout="scroll"
        >
          <template #empty>
            <div class="empty-state">
              <i class="pi pi-receipt empty-icon" />
              <p>ยังไม่มีรายการสลิป</p>
            </div>
          </template>

          <Column header="วันที่อัปโหลด" sortable field="uploadDate" style="min-width: 160px">
            <template #body="{ data }">
              {{ fmtDate(data.uploadDate) }}
            </template>
          </Column>

          <Column header="รูปภาพ" style="width: 110px">
            <template #body="{ data }">
              <Image
                v-if="data.imageUrl"
                :src="data.imageUrl"
                alt="slip"
                width="64"
                preview
                imageClass="slip-thumb"
              />
              <span v-else class="muted">—</span>
            </template>
          </Column>

          <Column header="รายละเอียด" field="description" style="min-width: 220px">
            <template #body="{ data }">
              {{ data.description || '—' }}
            </template>
          </Column>

          <Column header="ยอดเงิน (บาท)" sortable field="totalAmount" style="min-width: 140px">
            <template #body="{ data }">
              <span v-if="data.totalAmount != null" class="amount">
                {{ fmtAmount(data.totalAmount) }}
              </span>
              <span v-else class="muted">—</span>
            </template>
          </Column>

          <Column header="เลขที่อ้างอิง" field="transRef" style="min-width: 180px">
            <template #body="{ data }">
              <span v-if="data.transRef" class="ref-text">{{ data.transRef }}</span>
              <span v-else class="muted">—</span>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Upload Slip Modal -->
    <Dialog
      v-model:visible="showModal"
      header="อัปโหลดสลิป"
      :style="{ width: 'min(480px, calc(100vw - 16px))' }"
      modal
    >
      <div class="form-grid">
        <!-- Upload date -->
        <div class="form-field">
          <label class="field-label">วันที่อัปโหลด <span class="req">*</span></label>
          <DatePicker
            v-model="form.uploadDate"
            showTime
            hourFormat="24"
            dateFormat="dd/mm/yy"
            style="width: 100%"
            :class="{ 'p-invalid': errors.uploadDate }"
          />
          <small v-if="errors.uploadDate" class="error-msg">{{ errors.uploadDate }}</small>
        </div>

        <!-- Image upload -->
        <div class="form-field">
          <label class="field-label">รูปสลิป <span class="req">*</span></label>
          <FileUpload
            mode="basic"
            customUpload
            :auto="false"
            accept="image/*"
            :maxFileSize="10485760"
            chooseLabel="เลือกรูปภาพ"
            chooseIcon="pi pi-image"
            @select="onFileSelect"
          />
          <small v-if="errors.image" class="error-msg">{{ errors.image }}</small>
          <div v-if="previewUrl" class="preview-wrap">
            <img :src="previewUrl" alt="preview" class="preview-img" />
          </div>
        </div>

        <!-- Amount -->
        <div class="form-field">
          <label class="field-label">ยอดเงิน (บาท) <span class="req">*</span></label>
          <InputNumber
            v-model="form.amount"
            mode="currency"
            currency="THB"
            locale="th-TH"
            :min="0"
            placeholder="0.00"
            style="width: 100%"
            :class="{ 'p-invalid': errors.amount }"
            :inputStyle="{ width: '100%' }"
          />
          <small v-if="errors.amount" class="error-msg">{{ errors.amount }}</small>
        </div>

        <!-- Description -->
        <div class="form-field">
          <label class="field-label">รายละเอียด <span class="req">*</span></label>
          <Textarea
            v-model="form.description"
            placeholder="รายละเอียดสลิป..."
            :rows="2"
            style="width: 100%; resize: vertical"
            :class="{ 'p-invalid': errors.description }"
          />
          <small v-if="errors.description" class="error-msg">{{ errors.description }}</small>
        </div>
      </div>

      <template #footer>
        <Button label="ยกเลิก" outlined :disabled="saving" @click="showModal = false" />
        <Button label="อัปโหลด" :loading="saving" @click="handleSave" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { getSlips, uploadSlipImage, createSlip } from '@/services/slipService'

const toast = useToast()

const slips = ref([])
const loading = ref(false)

const showModal = ref(false)
const saving = ref(false)
const errors = ref({})
const selectedFile = ref(null)
const previewUrl = ref('')

const form = ref({
  uploadDate: new Date(),
  amount: null,
  description: '',
})

function openModal() {
  form.value = { uploadDate: new Date(), amount: null, description: '' }
  selectedFile.value = null
  previewUrl.value = ''
  errors.value = {}
  showModal.value = true
}

function onFileSelect(event) {
  const file = event.files?.[0]
  if (!file) return
  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
  errors.value = { ...errors.value, image: undefined }
}

function validate() {
  const e = {}
  if (!form.value.uploadDate) e.uploadDate = 'กรุณาเลือกวันที่'
  if (!selectedFile.value) e.image = 'กรุณาเลือกรูปสลิป'
  if (form.value.amount == null || form.value.amount < 0) e.amount = 'กรุณากรอกยอดเงิน'
  if (!form.value.description?.trim()) e.description = 'กรุณากรอกรายละเอียด'
  errors.value = e
  return Object.keys(e).length === 0
}

async function handleSave() {
  if (!validate()) return

  saving.value = true
  try {
    const { imageUrl } = await uploadSlipImage(selectedFile.value)
    const entry = await createSlip({
      imageUrl,
      description: form.value.description.trim(),
      uploadDate: form.value.uploadDate.toISOString(),
      totalAmount: form.value.amount,
    })
    slips.value.unshift(entry)
    toast.add({ severity: 'success', summary: 'สำเร็จ', detail: 'อัปโหลดสลิปสำเร็จ', life: 3000 })
    showModal.value = false
  } catch {
    toast.add({ severity: 'error', summary: 'ผิดพลาด', detail: 'อัปโหลดไม่สำเร็จ กรุณาลองใหม่', life: 3000 })
  } finally {
    saving.value = false
  }
}

async function loadSlips() {
  loading.value = true
  try {
    slips.value = await getSlips()
  } catch {
    toast.add({ severity: 'error', summary: 'ผิดพลาด', detail: 'โหลดข้อมูลไม่สำเร็จ', life: 3000 })
  } finally {
    loading.value = false
  }
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtAmount(value) {
  return Number(value).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

onMounted(loadSlips)
</script>

<style scoped>
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
}
.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 0;
  color: var(--p-text-muted-color);
}
.empty-icon {
  font-size: 36px;
}
.empty-state p {
  margin: 0;
  font-size: 15px;
}

.muted {
  color: var(--p-text-muted-color);
}
.amount {
  font-weight: 600;
  color: var(--p-primary-600);
}
.ref-text {
  font-family: monospace;
  font-size: 12px;
  color: var(--p-text-muted-color);
}

:deep(.slip-thumb) {
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid var(--p-surface-200);
}

/* Form */
.form-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.field-label {
  font-size: 14px;
  font-weight: 500;
}
.req {
  color: #d03050;
}
.error-msg {
  color: #d03050;
  font-size: 12px;
}

.preview-wrap {
  margin-top: 8px;
}
.preview-img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  border: 1px solid var(--p-surface-200);
}
</style>
