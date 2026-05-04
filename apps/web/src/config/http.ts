import axios from 'axios'

export const http = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Adjunta el token JWT a cada petición si existe
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('bch_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Si el servidor responde 401 limpia la sesión
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('bch_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)