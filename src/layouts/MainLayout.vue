<template>
  <n-layout :has-sider="!isMobile" style="height: 100vh">
    <!-- Desktop Sidebar -->
    <n-layout-sider
      v-if="!isMobile"
      bordered
      collapse-mode="width"
      :collapsed-width="64"
      :width="220"
      :collapsed="collapsed"
      show-trigger
      @collapse="collapsed = true"
      @expand="collapsed = false"
    >
      <div class="logo-area" :class="{ collapsed }">
        <div class="logo-icon">🐾</div>
        <transition name="fade">
          <span v-if="!collapsed" class="logo-text">Petitgo</span>
        </transition>
      </div>
      <n-menu
        :collapsed="collapsed"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        :options="menuOptions"
        :value="activeKey"
        @update:value="handleMenuSelect"
      />
    </n-layout-sider>

    <!-- Mobile Drawer -->
    <n-drawer v-if="isMobile" v-model:show="drawerOpen" placement="left" :width="220">
      <div class="logo-area">
        <div class="logo-icon">🐾</div>
        <span class="logo-text">Petitgo</span>
      </div>
      <n-menu
        :options="menuOptions"
        :value="activeKey"
        @update:value="handleMenuSelect"
      />
    </n-drawer>

    <!-- Main Content Area -->
    <n-layout>
      <n-layout-header bordered class="app-header">
        <div class="header-left">
          <n-button v-if="isMobile" quaternary size="small" @click="drawerOpen = true">
            <template #icon><n-icon :component="MenuOutline" /></template>
          </n-button>
          <div class="page-title">{{ pageTitle }}</div>
        </div>

        <div class="header-right">
          <n-tag type="success" size="small">
            <template #icon><n-icon :component="PersonOutline" /></template>
            <span class="user-name">{{ displayName }}</span>
            <n-tag v-if="authStore.isAdmin" type="warning" size="small" style="margin-left: 4px">Admin</n-tag>
          </n-tag>

          <n-dropdown :options="userMenuOptions" @select="handleUserMenu" trigger="click">
            <n-button quaternary size="small">
              <template #icon><n-icon :component="EllipsisVerticalOutline" /></template>
            </n-button>
          </n-dropdown>
        </div>
      </n-layout-header>

      <n-layout-content class="app-content">
        <router-view />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup>
import { ref, computed, h, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import { NIcon } from 'naive-ui'
import {
  BarChartOutline,
  ListOutline,
  CubeOutline,
  SettingsOutline,
  PersonOutline,
  PeopleOutline,
  LogOutOutline,
  EllipsisVerticalOutline,
  MenuOutline,
} from '@vicons/ionicons5'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const authStore = useAuthStore()
const collapsed = ref(false)
const drawerOpen = ref(false)
const isMobile = ref(window.innerWidth < 768)

function onResize() {
  isMobile.value = window.innerWidth < 768
  if (!isMobile.value) drawerOpen.value = false
}

onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

function renderIcon(icon) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const menuOptions = computed(() => {
  const base = [
    { label: 'แดชบอร์ด', key: 'dashboard', icon: renderIcon(BarChartOutline) },
    { label: 'Order Summary', key: 'orders', icon: renderIcon(ListOutline) },
    { label: 'จัดการกล่อง', key: 'boxes', icon: renderIcon(CubeOutline) },
    { label: 'ตั้งค่า', key: 'settings', icon: renderIcon(SettingsOutline) },
  ]
  if (authStore.isAdmin) {
    base.push({ label: 'จัดการผู้ใช้', key: 'users', icon: renderIcon(PeopleOutline) })
  }
  return base
})

const userMenuOptions = [
  { label: 'ออกจากระบบ', key: 'logout', icon: renderIcon(LogOutOutline) },
]

const activeKey = computed(() => route.name?.toLowerCase() || 'dashboard')

const displayName = computed(() => {
  const p = authStore.userProfile
  return p?.name || p?.firstName || p?.username || ''
})

const pageTitle = computed(() => {
  const titles = {
    dashboard: 'แดชบอร์ด',
    orders: 'Order Summary',
    boxes: 'จัดการกล่อง',
    settings: 'ตั้งค่า',
    users: 'จัดการผู้ใช้งาน',
  }
  return titles[route.name?.toLowerCase()] || 'Petitgo'
})

const routeMap = {
  dashboard: '/dashboard',
  orders: '/orders',
  boxes: '/boxes',
  settings: '/settings',
  users: '/users',
}

function handleMenuSelect(key) {
  if (routeMap[key]) router.push(routeMap[key])
  if (isMobile.value) drawerOpen.value = false
}

async function handleUserMenu(key) {
  if (key === 'logout') {
    await authStore.logout()
    message.success('ออกจากระบบสำเร็จ')
    router.push('/login')
  }
}
</script>

<style scoped>
.app-header {
  height: 56px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.user-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-content {
  padding: 24px;
  overflow-y: auto;
  height: calc(100vh - 56px);
}

@media (max-width: 768px) {
  .app-content {
    padding: 12px;
  }

  .user-name {
    max-width: 80px;
  }
}

.logo-area {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 18px;
  gap: 10px;
  border-bottom: 1px solid #efeff5;
  overflow: hidden;
  transition: padding 0.3s;
}

.logo-area.collapsed {
  padding: 0;
  justify-content: center;
}

.logo-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #18a058;
  white-space: nowrap;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
