<template>
  <div class="dashboard">
    <!-- No API key warning -->
    <n-alert v-if="!sheetsStore.apiKey" type="warning" :bordered="false" style="margin-bottom: 20px">
      ยังไม่ได้ตั้งค่า Google Sheets API Key
      <n-button text type="warning" @click="$router.push('/settings')" style="margin-left: 8px">
        ไปที่หน้าตั้งค่า →
      </n-button>
    </n-alert>

    <!-- Refresh Button -->
    <div style="display: flex; justify-content: flex-end; margin-bottom: 16px;">
      <n-button
        :loading="sheetsStore.loading.dashboard"
        @click="loadData"
        type="primary"
        ghost
      >
        <template #icon><n-icon :component="RefreshOutline" /></template>
        โหลดข้อมูล
      </n-button>
    </div>

    <!-- Error -->
    <n-alert v-if="sheetsStore.errors.dashboard" type="error" :bordered="false" style="margin-bottom: 20px">
      {{ sheetsStore.errors.dashboard }}
    </n-alert>

    <!-- Summary Cards -->
    <n-grid :cols="4" :x-gap="16" :y-gap="16" style="margin-bottom: 24px" responsive="screen" :collapsed-cols="2">
      <n-gi>
        <StatCard
          title="รายรับรวม (ล่าสุด)"
          :value="latestRevenue"
          prefix="฿"
          color="#18a058"
          :icon="CashOutline"
          :subtitle="latestMonth"
        />
      </n-gi>
      <n-gi>
        <StatCard
          title="กำไรสุทธิ (ล่าสุด)"
          :value="latestProfit"
          prefix="฿"
          color="#2080f0"
          :icon="TrendingUpOutline"
          :subtitle="latestMonth"
        />
      </n-gi>
      <n-gi>
        <StatCard
          title="จำนวน Order (ล่าสุด)"
          :value="latestOrders"
          color="#f0a020"
          :icon="CartOutline"
          :subtitle="latestMonth"
        />
      </n-gi>
      <n-gi>
        <StatCard
          title="กำไรเฉลี่ยต่อ Order"
          :value="avgProfitPerOrder"
          prefix="฿"
          color="#8a2be2"
          :icon="AnalyticsOutline"
          :subtitle="latestMonth"
        />
      </n-gi>
    </n-grid>

    <!-- Charts Row 1 -->
    <n-grid :cols="2" :x-gap="16" :y-gap="16" style="margin-bottom: 20px" responsive="screen" :collapsed-cols="1">
      <n-gi>
        <n-card title="รายรับรายเดือน" :bordered="false" style="border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06)">
          <template #header-extra>
            <n-tag size="small" type="success">Revenue</n-tag>
          </template>
          <div v-if="sheetsStore.loading.dashboard" style="height: 300px; display: flex; align-items: center; justify-content: center;">
            <n-spin />
          </div>
          <v-chart v-else :option="revenueChartOption" style="height: 300px" autoresize />
        </n-card>
      </n-gi>

      <n-gi>
        <n-card title="กำไรสุทธิรายเดือน" :bordered="false" style="border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06)">
          <template #header-extra>
            <n-tag size="small" type="info">Profit</n-tag>
          </template>
          <div v-if="sheetsStore.loading.dashboard" style="height: 300px; display: flex; align-items: center; justify-content: center;">
            <n-spin />
          </div>
          <v-chart v-else :option="profitChartOption" style="height: 300px" autoresize />
        </n-card>
      </n-gi>
    </n-grid>

    <!-- Charts Row 2 -->
    <n-grid :cols="2" :x-gap="16" :y-gap="16" responsive="screen" :collapsed-cols="1">
      <n-gi>
        <n-card title="จำนวน Order รายเดือน" :bordered="false" style="border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06)">
          <template #header-extra>
            <n-tag size="small" type="warning">Orders</n-tag>
          </template>
          <div v-if="sheetsStore.loading.dashboard" style="height: 280px; display: flex; align-items: center; justify-content: center;">
            <n-spin />
          </div>
          <v-chart v-else :option="ordersChartOption" style="height: 280px" autoresize />
        </n-card>
      </n-gi>

      <n-gi>
        <n-card title="% กำไรสุทธิรายเดือน" :bordered="false" style="border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06)">
          <template #header-extra>
            <n-tag size="small">%Net Profit</n-tag>
          </template>
          <div v-if="sheetsStore.loading.dashboard" style="height: 280px; display: flex; align-items: center; justify-content: center;">
            <n-spin />
          </div>
          <v-chart v-else :option="profitPctChartOption" style="height: 280px" autoresize />
        </n-card>
      </n-gi>
    </n-grid>
  </div>
</template>

<script setup>
import { computed, onMounted, h } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import {
  GridComponent, TooltipComponent, LegendComponent,
  DataZoomComponent, MarkLineComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import {
  RefreshOutline, CashOutline, TrendingUpOutline,
  CartOutline, AnalyticsOutline,
} from '@vicons/ionicons5'
import { useSheetsStore } from '@/stores/sheets'
import StatCard from '@/components/StatCard.vue'

use([CanvasRenderer, LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, MarkLineComponent])

const sheetsStore = useSheetsStore()

onMounted(() => {
  if (sheetsStore.apiKey && !sheetsStore.dashboardData) {
    loadData()
  }
})

function loadData() {
  sheetsStore.loadDashboard()
}

const monthlyData = computed(() => sheetsStore.dashboardData?.monthly || [])
const summaryData = computed(() => sheetsStore.dashboardData?.summary || [])

// Use monthly data if available, else fall back to summary
const chartData = computed(() => {
  if (monthlyData.value.length > 0) return monthlyData.value
  return summaryData.value.map(d => ({
    month: d.month,
    count: d.orders,
    revenue: d.revenue,
    netProfit: d.netProfit || d.profit,
    avgPct: d.pctNet,
  }))
})

const latestItem = computed(() => chartData.value[chartData.value.length - 1] || {})
const latestMonth = computed(() => latestItem.value.month || '-')
const latestRevenue = computed(() => latestItem.value.revenue || 0)
const latestProfit = computed(() => latestItem.value.netProfit || 0)
const latestOrders = computed(() => latestItem.value.count || 0)
const avgProfitPerOrder = computed(() => {
  const c = latestItem.value.count
  const p = latestItem.value.netProfit
  return c && p ? Math.round(p / c) : 0
})

const months = computed(() => chartData.value.map(d => d.month))
const revenues = computed(() => chartData.value.map(d => d.revenue))
const profits = computed(() => chartData.value.map(d => d.netProfit))
const orders = computed(() => chartData.value.map(d => d.count))
const profitPcts = computed(() => chartData.value.map(d => d.avgPct || 0))

const commonGrid = { left: '3%', right: '4%', bottom: '12%', containLabel: true }
const commonDataZoom = [{ type: 'slider', start: Math.max(0, 100 - (12 / (chartData.value.length || 1)) * 100), end: 100 }]

const revenueChartOption = computed(() => ({
  tooltip: { trigger: 'axis', formatter: (params) => {
    const d = params[0]
    return `${d.name}<br/>${d.marker} รายรับ: ฿${Number(d.value).toLocaleString('th-TH')}`
  }},
  grid: commonGrid,
  xAxis: { type: 'category', data: months.value, axisLabel: { rotate: 30, fontSize: 10 } },
  yAxis: { type: 'value', axisLabel: { formatter: v => '฿' + (v >= 1000 ? (v/1000).toFixed(0) + 'K' : v) } },
  dataZoom: commonDataZoom,
  series: [{
    name: 'รายรับ',
    type: 'line',
    data: revenues.value,
    smooth: true,
    lineStyle: { color: '#18a058', width: 2 },
    itemStyle: { color: '#18a058' },
    areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(24,160,88,0.3)' }, { offset: 1, color: 'rgba(24,160,88,0)' }] } },
  }],
}))

const profitChartOption = computed(() => ({
  tooltip: { trigger: 'axis', formatter: (params) => {
    const d = params[0]
    return `${d.name}<br/>${d.marker} กำไร: ฿${Number(d.value).toLocaleString('th-TH')}`
  }},
  grid: commonGrid,
  xAxis: { type: 'category', data: months.value, axisLabel: { rotate: 30, fontSize: 10 } },
  yAxis: { type: 'value', axisLabel: { formatter: v => '฿' + (v >= 1000 ? (v/1000).toFixed(1) + 'K' : v) } },
  dataZoom: commonDataZoom,
  series: [{
    name: 'กำไร',
    type: 'bar',
    data: profits.value,
    itemStyle: {
      color: (params) => params.value >= 0 ? '#2080f0' : '#d03050',
      borderRadius: [4, 4, 0, 0],
    },
  }],
}))

const ordersChartOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: commonGrid,
  xAxis: { type: 'category', data: months.value, axisLabel: { rotate: 30, fontSize: 10 } },
  yAxis: { type: 'value' },
  dataZoom: commonDataZoom,
  series: [{
    name: 'Orders',
    type: 'bar',
    data: orders.value,
    itemStyle: { color: '#f0a020', borderRadius: [4, 4, 0, 0] },
  }],
}))

const profitPctChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    formatter: (params) => `${params[0].name}<br/>${params[0].marker} ${Number(params[0].value).toFixed(2)}%`
  },
  grid: commonGrid,
  xAxis: { type: 'category', data: months.value, axisLabel: { rotate: 30, fontSize: 10 } },
  yAxis: { type: 'value', axisLabel: { formatter: v => v + '%' } },
  dataZoom: commonDataZoom,
  series: [{
    name: '% กำไร',
    type: 'line',
    data: profitPcts.value,
    smooth: true,
    lineStyle: { color: '#8a2be2' },
    itemStyle: { color: '#8a2be2' },
    markLine: {
      data: [{ type: 'average', name: 'เฉลี่ย' }],
      lineStyle: { color: '#f0a020', type: 'dashed' },
    },
  }],
}))
</script>

<style scoped>
.dashboard {
  max-width: 1400px;
}
</style>
