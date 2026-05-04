<template>
  <div class="app-shell" :class="{ 'sidebar-open': sidebarOpen }">
    <!-- Overlay mobile -->
    <div class="sidebar-overlay" @click="sidebarOpen = false" />

    <!-- Sidebar -->
    <nav class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <span class="logo-icon">🥐</span>
          <span class="logo-text">Bachanetto</span>
        </div>
        <button class="sidebar-close" @click="sidebarOpen = false">✕</button>
      </div>

      <div class="sidebar-user">
        <div class="user-avatar">{{ userInitials }}</div>
        <div class="user-info">
          <span class="user-name">{{ usuario?.nombre }}</span>
          <span class="user-role">{{ rolLabel }}</span>
        </div>
      </div>

      <ul class="nav-list">
        <li v-for="item in navItems" :key="item.name">
          <RouterLink
            :to="item.to"
            class="nav-item"
            active-class="nav-item--active"
            @click="sidebarOpen = false"
          >
            <span class="nav-label">{{ item.label }}</span>
          </RouterLink>
        </li>
      </ul>

      <div class="sidebar-footer">
        <button class="btn-logout" @click="handleLogout">Cerrar sesión</button>
      </div>
    </nav>

    <!-- Contenido -->
    <div class="main-area">
      <header class="top-bar">
        <button class="menu-toggle" @click="sidebarOpen = true">☰</button>
        <span class="top-bar-title">{{ currentTitle }}</span>
        <div class="top-avatar">{{ userInitials }}</div>
      </header>
      <main class="page-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const sidebarOpen = ref(false); // ← agregar esta línea
const usuario = computed(() => auth.usuario);
const isAdmin = computed(() => auth.isAdmin);
const currentTitle = computed(() => (route.meta.title as string) ?? "Bachanetto");

const userInitials = computed(() => {
  const name = usuario.value?.nombre ?? "";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
});

const rolLabel = computed(() => (usuario.value?.rol === "ADMIN" ? "Administrador" : "Repartidor"));

const navItems = computed(() => {
  const items = [
    { name: "dashboard", to: "/", label: "Dashboard" },
    { name: "entregas", to: "/entregas", label: "Entregas" },
    { name: "pagos", to: "/pagos", label: "Pagos" },
  ];
  if (isAdmin.value) {
    items.splice(
      1,
      0,
      { name: "pedidos", to: "/pedidos", label: "Pedidos" },
      { name: "clientes", to: "/clientes", label: "Clientes" },
      { name: "productos", to: "/productos", label: "Productos" },
    );
  }
  return items;
});

function handleLogout() {
  auth.logout();
  router.push("/login");
}
</script>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100dvh;
}

/* ─── Overlay mobile ─────────────────────────────────────── */
.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(28, 17, 10, 0.5);
  z-index: 40;
}

.sidebar-open .sidebar-overlay {
  display: block;
}

/* ─── Sidebar ────────────────────────────────────────────── */
.sidebar {
  position: fixed;
  inset-block: 0;
  left: 0;
  width: 240px;
  background: var(--c-bg-sidebar);
  display: flex;
  flex-direction: column;
  z-index: 50;
  transform: translateX(-100%);
  transition: transform 250ms ease;
  overflow-y: auto;
}

.sidebar-open .sidebar {
  transform: translateX(0);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  font-size: 1.5rem;
}

.logo-text {
  font-family: var(--font-display);
  font-size: 1.2rem;
  color: var(--c-text-inverse);
}

.sidebar-close {
  color: rgba(255, 255, 255, 0.4);
  font-size: 1rem;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: color var(--transition);
}

.sidebar-close:hover {
  color: white;
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: rgba(200, 130, 42, 0.25);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--c-brand-light);
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--c-text-inverse);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-role {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
}

.nav-list {
  flex: 1;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.875rem;
  transition:
    background var(--transition),
    color var(--transition);
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.07);
  color: var(--c-text-inverse);
}

.nav-item--active {
  background: rgba(200, 130, 42, 0.18);
  color: var(--c-brand-light);
  font-weight: 500;
}

.sidebar-footer {
  padding: 12px 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.btn-logout {
  width: 100%;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.875rem;
  text-align: left;
  transition:
    background var(--transition),
    color var(--transition);
}

.btn-logout:hover {
  background: rgba(192, 57, 43, 0.15);
  color: #f08080;
}

/* ─── Main area ───────────────────────────────────────────── */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--c-bg);
  width: 100%;
}

.top-bar {
  height: 60px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  background: var(--c-bg-card);
  border-bottom: 1px solid var(--c-border);
  position: sticky;
  top: 0;
  z-index: 30;
}

.menu-toggle {
  font-size: 1.25rem;
  color: var(--c-text-second);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.top-bar-title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--c-text-primary);
  flex: 1;
}

.top-avatar {
  width: 32px;
  height: 32px;
  background: var(--c-brand-pale);
  border: 1.5px solid var(--c-brand);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--c-brand-dark);
  flex-shrink: 0;
}

.page-content {
  flex: 1;
  padding: 20px 16px;
}

/* ─── Desktop ────────────────────────────────────────────── */
@media (min-width: 1024px) {
  .sidebar {
    position: sticky;
    top: 0;
    height: 100dvh;
    transform: translateX(0);
    flex-shrink: 0;
  }

  .sidebar-close {
    display: none;
  }
  .menu-toggle {
    display: none;
  }
  .top-avatar {
    display: none;
  }

  .sidebar-overlay {
    display: none !important;
  }

  .page-content {
    padding: 28px 32px;
  }
}
</style>
