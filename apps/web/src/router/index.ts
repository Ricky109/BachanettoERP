import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/components/layout/AppLayout.vue'),
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/dashboard/DashboardView.vue'),
          meta: { title: 'Dashboard' },
        },
        {
          path: 'clientes',
          name: 'clientes',
          component: () => import('@/views/clients/ClientesView.vue'),
          meta: { title: 'Clientes', roles: ['ADMIN'] },
        },
        {
          path: 'productos',
          name: 'productos',
          component: () => import('@/views/products/ProductosView.vue'),
          meta: { title: 'Productos', roles: ['ADMIN'] },
        },
        {
          path: 'pedidos',
          name: 'pedidos',
          component: () => import('@/views/orders/PedidosView.vue'),
          meta: { title: 'Pedidos', roles: ['ADMIN'] },
        },
        {
          path: 'entregas',
          name: 'entregas',
          component: () => import('@/views/deliveries/EntregasView.vue'),
          meta: { title: 'Entregas' },
        },
        {
          path: 'pagos',
          name: 'pagos',
          component: () => import('@/views/payments/PagosView.vue'),
          meta: { title: 'Pagos' },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { public: true },
    },
  ],
})

// Guard global
router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (auth.token && !auth.usuario) {
    await auth.init()
  }

  if (to.meta.public) return true
  if (!auth.isAuthenticated) return { name: 'login' }

  const roles = to.meta.roles as string[] | undefined
  if (roles && auth.usuario && !roles.includes(auth.usuario.rol)) {
    return { name: 'dashboard' }
  }

  return true
})

router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  document.title = title ? `${title} — Bachanetto` : 'Bachanetto'
})

export default router