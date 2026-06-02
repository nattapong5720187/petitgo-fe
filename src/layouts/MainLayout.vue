<template>
  <div class="app-layout">
    <!-- Desktop Sidebar -->
    <aside v-if="!isMobile" class="sidebar" :class="{ collapsed }">
      <div class="logo-area">
        <div class="logo-icon">🐾</div>
        <transition name="fade">
          <span v-if="!collapsed" class="logo-text">Petitgo</span>
        </transition>
      </div>

      <nav class="nav-menu">
        <button
          v-for="item in menuItems"
          :key="item.key"
          class="nav-item"
          :class="{ active: activeKey === item.key }"
          :title="collapsed ? item.label : ''"
          @click="handleMenuSelect(item.key)"
        >
          <i :class="['pi', item.icon, 'nav-icon']"></i>
          <span v-if="!collapsed" class="nav-label">{{ item.label }}</span>
        </button>
      </nav>

      <button class="collapse-btn" @click="collapsed = !collapsed">
        <i :class="['pi', collapsed ? 'pi-chevron-right' : 'pi-chevron-left']"></i>
      </button>
    </aside>

    <!-- Mobile Drawer -->
    <Drawer v-if="isMobile" v-model:visible="drawerOpen" position="left" style="width: 220px">
      <template #header>
        <div style="display: flex; align-items: center; gap: 10px">
          <span style="font-size: 22px">🐾</span>
          <span class="logo-text">Petitgo</span>
        </div>
      </template>
      <nav class="nav-menu" style="padding-top: 8px">
        <button
          v-for="item in menuItems"
          :key="item.key"
          class="nav-item"
          :class="{ active: activeKey === item.key }"
          @click="handleMenuSelect(item.key)"
        >
          <i :class="['pi', item.icon, 'nav-icon']"></i>
          <span class="nav-label">{{ item.label }}</span>
        </button>
      </nav>
    </Drawer>

    <!-- Main Area -->
    <div class="main-area">
      <!-- Header -->
      <header class="app-header">
        <div class="header-left">
          <Button v-if="isMobile" icon="pi pi-bars" text rounded @click="drawerOpen = true" />
          <span class="page-title">{{ pageTitle }}</span>
        </div>

        <div class="header-right">
          <div class="user-badge">
            <i class="pi pi-user" style="font-size: 13px"></i>
            <span class="user-name">{{ displayName }}</span>
            <Tag v-if="authStore.isAdmin" value="Admin" severity="warn" style="font-size: 11px; padding: 2px 6px" />
          </div>
          <Button icon="pi pi-ellipsis-v" text rounded @click="(e) => userMenuRef.toggle(e)" />
          <Menu ref="userMenuRef" :model="userMenuItems" popup />
        </div>
      </header>

      <!-- Content -->
      <main class="app-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from "@/stores/auth";
import { useToast } from "primevue/usetoast";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();
const toast = useToast();
const authStore = useAuthStore();

const collapsed = ref(false);
const drawerOpen = ref(false);
const isMobile = ref(window.innerWidth < 768);
const userMenuRef = ref();

function onResize() {
  isMobile.value = window.innerWidth < 768;
  if (!isMobile.value) drawerOpen.value = false;
}
onMounted(() => window.addEventListener("resize", onResize));
onUnmounted(() => window.removeEventListener("resize", onResize));

const baseMenuItems = [
  { label: "แดชบอร์ด", key: "dashboard", icon: "pi-chart-bar" },
  { label: "Order Summary", key: "orders", icon: "pi-list" },
  { label: "จัดการกล่อง", key: "boxes", icon: "pi-box" },
  { label: "ลงเวลาทำงาน", key: "timesheet", icon: "pi-clock" },
];

const menuItems = computed(() => {
  const items = [...baseMenuItems];
  if (authStore.isAdmin) {
    items.push({ label: "อนุมัติเวลาทำงาน", key: "timesheetapproval", icon: "pi-check-circle" });
    items.push({ label: "จัดการผู้ใช้", key: "users", icon: "pi-users" });
    items.push({ label: "ตั้งค่า", key: "settings", icon: "pi-cog" });
  }
  return items;
});

const userMenuItems = [{ label: "ออกจากระบบ", icon: "pi pi-sign-out", command: handleLogout }];

const activeKey = computed(() => route.name?.toLowerCase() || "dashboard");

const displayName = computed(() => {
  const p = authStore.userProfile;
  return p?.name || p?.firstName || p?.username || "";
});

const pageTitles = {
  dashboard: "แดชบอร์ด",
  orders: "Order Summary",
  boxes: "จัดการกล่อง",
  timesheet: "ลงเวลาทำงาน",
  timesheetapproval: "อนุมัติเวลาทำงาน",
  settings: "ตั้งค่า",
  users: "จัดการผู้ใช้งาน",
};

const pageTitle = computed(() => pageTitles[route.name?.toLowerCase()] || "Petitgo");

const routeMap = {
  dashboard: "/dashboard",
  orders: "/orders",
  boxes: "/boxes",
  timesheet: "/timesheet",
  timesheetapproval: "/timesheet-approval",
  settings: "/settings",
  users: "/users",
};

function handleMenuSelect(key) {
  if (routeMap[key]) router.push(routeMap[key]);
  if (isMobile.value) drawerOpen.value = false;
}

async function handleLogout() {
  await authStore.logout();
  toast.add({ severity: "success", summary: "สำเร็จ", detail: "ออกจากระบบสำเร็จ", life: 3000 });
  router.push("/login");
}
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* ── Sidebar ── */
.sidebar {
  width: 220px;
  height: 100vh;
  background: var(--p-surface-0);
  border-right: 1px solid var(--p-surface-200);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width 0.25s ease;
  overflow: hidden;
}
.sidebar.collapsed {
  width: 64px;
}

.logo-area {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 18px;
  gap: 10px;
  border-bottom: 1px solid var(--p-surface-200);
  flex-shrink: 0;
  overflow: hidden;
}
.sidebar.collapsed .logo-area {
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
  color: var(--p-primary-500);
  white-space: nowrap;
}

.nav-menu {
  flex: 1;
  padding: 8px 0;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 10px 18px;
  gap: 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--p-text-muted-color);
  font-size: 14px;
  font-family: inherit;
  transition:
    background 0.15s,
    color 0.15s;
  text-align: left;
  white-space: nowrap;
}
.nav-item:hover {
  background: var(--p-surface-100);
  color: var(--p-text-color);
}
.nav-item.active {
  background: var(--p-primary-50);
  color: var(--p-primary-500);
  font-weight: 600;
}
.sidebar.collapsed .nav-item {
  padding: 10px;
  justify-content: center;
}

.nav-icon {
  font-size: 18px;
  flex-shrink: 0;
}
.nav-label {
  white-space: nowrap;
  overflow: hidden;
}

.collapse-btn {
  padding: 12px;
  border: none;
  border-top: 1px solid var(--p-surface-200);
  background: transparent;
  cursor: pointer;
  color: var(--p-text-muted-color);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  transition: background 0.15s;
}
.sidebar.collapsed .collapse-btn {
  justify-content: center;
}
.collapse-btn:hover {
  background: var(--p-surface-100);
}

/* ── Main area ── */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.app-header {
  height: 56px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--p-surface-0);
  border-bottom: 1px solid var(--p-surface-200);
  flex-shrink: 0;
  gap: 8px;
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
  gap: 6px;
  flex-shrink: 0;
}

.user-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--p-surface-100);
  border-radius: 20px;
  font-size: 13px;
  color: var(--p-text-color);
}

.user-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--p-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

@media (max-width: 768px) {
  .app-content {
    padding: 12px;
  }
  .user-name {
    max-width: 80px;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
