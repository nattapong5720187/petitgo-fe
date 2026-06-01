<template>
  <Card style="border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); overflow: hidden; position: relative;">
    <template #content>
      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-title">{{ title }}</div>
          <div class="stat-value" :style="{ color }">
            <span v-if="prefix" class="stat-prefix">{{ prefix }}</span>
            {{ formattedValue }}
          </div>
          <div v-if="subtitle" class="stat-subtitle">{{ subtitle }}</div>
        </div>
        <div class="stat-icon" :style="{ background: `${color}18` }">
          <i :class="['pi', icon]" :style="{ color, fontSize: '28px' }"></i>
        </div>
      </div>
      <div class="stat-bar" :style="{ background: color }"></div>
    </template>
  </Card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: String,
  value: { type: Number, default: 0 },
  prefix: String,
  color: { type: String, default: '#18a058' },
  icon: { type: String, default: 'pi-chart-bar' },
  subtitle: String,
})

const formattedValue = computed(() => {
  if (props.value === null || props.value === undefined) return '-'
  return Number(props.value).toLocaleString('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
})
</script>

<style scoped>
.stat-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-content { flex: 1; }

.stat-title { font-size: 13px; color: #888; margin-bottom: 6px; }

.stat-value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-prefix {
  font-size: 16px;
  font-weight: 500;
  margin-right: 2px;
}

.stat-subtitle { font-size: 12px; color: #aaa; margin-top: 4px; }

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  opacity: 0.6;
}
</style>
