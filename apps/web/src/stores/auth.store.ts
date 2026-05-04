import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { http } from '@/config/http'
import type { Rol } from '@bachanetto/shared'

interface Usuario {
  id:     string
  nombre: string
  email:  string
  rol:    Rol
}

const TOKEN_KEY = 'bch_token'

export const useAuthStore = defineStore('auth', () => {
  const token   = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const usuario = ref<Usuario | null>(null)
  const loading = ref(false)
  const error   = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin         = computed(() => usuario.value?.rol === 'ADMIN')
  const isRepartidor    = computed(() => usuario.value?.rol === 'REPARTIDOR')

  // Restaura el usuario desde el token al cargar la app
  async function init() {
    if (!token.value) return
    try {
      const { data } = await http.get('/auth/me')
      usuario.value = data.data
    } catch {
      logout()
    }
  }

  async function login(email: string, password: string) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await http.post('/auth/login', { email, password })
      token.value   = data.data.token
      usuario.value = data.data.usuario
      localStorage.setItem(TOKEN_KEY, data.data.token)
      return true
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      error.value = msg ?? 'Error al iniciar sesión'
      return false
    } finally {
      loading.value = false
    }
  }

  function logout() {
    token.value   = null
    usuario.value = null
    localStorage.removeItem(TOKEN_KEY)
  }

  return {
    token, usuario, loading, error,
    isAuthenticated, isAdmin, isRepartidor,
    init, login, logout,
  }
})