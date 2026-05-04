<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <span class="login-icon">🥐</span>
        <h1 class="login-title">Bachanetto</h1>
        <p class="login-subtitle">Ingresa tus credenciales para continuar</p>
      </div>

      <form class="login-form" @submit.prevent="handleSubmit" novalidate>
        <div class="field" :class="{ 'field--error': errors.email }">
          <label for="email" class="field-label">Correo electrónico</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            class="field-input"
            placeholder="correo@ejemplo.com"
            autocomplete="email"
            :disabled="loading"
          />
          <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
        </div>

        <div class="field" :class="{ 'field--error': errors.password }">
          <label for="password" class="field-label">Contraseña</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            class="field-input"
            placeholder="••••••••"
            autocomplete="current-password"
            :disabled="loading"
          />
          <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
        </div>

        <div v-if="authError" class="alert-error">
          {{ authError }}
        </div>

        <button type="submit" class="btn-submit" :disabled="loading">
          <span v-if="!loading">Ingresar</span>
          <span v-else>Cargando...</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const auth   = useAuthStore()
const router = useRouter()

const form = ref({ email: '', password: '' })
const errors = ref<{ email?: string; password?: string }>({})

const loading   = computed(() => auth.loading)
const authError = computed(() => auth.error)

function validate(): boolean {
  errors.value = {}
  if (!form.value.email) {
    errors.value.email = 'El correo es requerido'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = 'Ingresa un correo válido'
  }
  if (!form.value.password) {
    errors.value.password = 'La contraseña es requerida'
  }
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validate()) return
  const ok = await auth.login(form.value.email, form.value.password)
  if (ok) router.push('/')
}
</script>

<style scoped>
.login-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--c-bg);
  padding: 24px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: white;
  border: 1px solid #e8d5be;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 24px rgba(28,17,10,0.08);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-icon { font-size: 2.5rem; }

.login-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1c110a;
  margin: 8px 0 4px;
}

.login-subtitle {
  font-size: 0.875rem;
  color: #9c7b6a;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #5c4033;
}

.field-input {
  padding: 10px 14px;
  border: 1.5px solid #e8d5be;
  border-radius: 8px;
  font-size: 1rem;
  color: #1c110a;
  transition: border-color 150ms;
  outline: none;
}

.field-input:focus {
  border-color: #c8822a;
  box-shadow: 0 0 0 3px rgba(200,130,42,0.12);
}

.field-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.field--error .field-input {
  border-color: #c0392b;
}

.field-error {
  font-size: 0.75rem;
  color: #c0392b;
  font-weight: 500;
}

.alert-error {
  padding: 10px 14px;
  background: #fdecea;
  border: 1px solid rgba(192,57,43,0.2);
  border-radius: 8px;
  font-size: 0.875rem;
  color: #c0392b;
}

.btn-submit {
  padding: 12px;
  background: #c8822a;
  color: white;
  font-size: 1rem;
  font-weight: 500;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 150ms, transform 150ms;
}

.btn-submit:hover:not(:disabled) {
  background: #9e6220;
  transform: translateY(-1px);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>