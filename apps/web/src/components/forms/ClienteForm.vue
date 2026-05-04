<template>
  <form @submit.prevent="handleSubmit" novalidate>
    <div class="form-grid">

      <div class="field">
        <label class="field-label">DNI <span class="required">*</span></label>
        <input
          v-model="form.ID_CLI"
          class="field-input"
          :class="{ 'field-input--error': errors.ID_CLI }"
          placeholder="12345678"
          maxlength="8"
          :disabled="isEditing"
        />
        <span v-if="errors.ID_CLI" class="field-error">{{ errors.ID_CLI }}</span>
      </div>

      <div class="field">
        <label class="field-label">Nombre <span class="required">*</span></label>
        <input
          v-model="form.NOM_CLI"
          class="field-input"
          :class="{ 'field-input--error': errors.NOM_CLI }"
          placeholder="Rosa Flores"
        />
        <span v-if="errors.NOM_CLI" class="field-error">{{ errors.NOM_CLI }}</span>
      </div>

      <div class="field field--full">
        <label class="field-label">Referencia</label>
        <input
          v-model="form.REF_CLI"
          class="field-input"
          placeholder="Mercado central puesto 12"
        />
        <span class="field-hint">Ayuda a diferenciar clientes con el mismo nombre</span>
      </div>

      <div class="field">
        <label class="field-label">Teléfono</label>
        <input
          v-model="form.TEL_CLI"
          class="field-input"
          placeholder="987654321"
        />
      </div>

      <div class="field">
        <label class="field-label">Dirección</label>
        <input
          v-model="form.DIR_CLI"
          class="field-input"
          placeholder="Av. La Marina 123"
        />
      </div>

      <div class="field">
        <label class="field-label">Límite de crédito (S/)</label>
        <input
          v-model.number="form.LIM_MON_CLI"
          type="number"
          min="0"
          step="0.01"
          class="field-input"
          placeholder="Sin límite"
        />
      </div>

      <div class="field">
        <label class="field-label">Límite de días sin pago</label>
        <input
          v-model.number="form.LIM_DIA_CLI"
          type="number"
          min="1"
          class="field-input"
          placeholder="Sin límite"
        />
      </div>

    </div>

    <div class="form-actions">
      <button type="button" class="btn-cancel" @click="$emit('cancel')">
        Cancelar
      </button>
      <button type="submit" class="btn-submit" :disabled="loading">
        {{ loading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear cliente' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Cliente, CreateClienteDto, UpdateClienteDto } from '@/services/clientes.service'

const props = defineProps<{
  cliente?: Cliente
  loading:  boolean
}>()

const emit = defineEmits<{
  submit: [data: CreateClienteDto | UpdateClienteDto]
  cancel: []
}>()

const isEditing = computed(() => !!props.cliente)

const form = ref({
  ID_CLI:      props.cliente?.ID_CLI      ?? '',
  NOM_CLI:     props.cliente?.NOM_CLI     ?? '',
  REF_CLI:     props.cliente?.REF_CLI     ?? '',
  TEL_CLI:     props.cliente?.TEL_CLI     ?? '',
  DIR_CLI:     props.cliente?.DIR_CLI     ?? '',
  LIM_MON_CLI: props.cliente?.LIM_MON_CLI ?? null as number | null,
  LIM_DIA_CLI: props.cliente?.LIM_DIA_CLI ?? null as number | null,
})

const errors = ref<Record<string, string>>({})

function validate(): boolean {
  errors.value = {}
  if (!isEditing.value) {
    if (!form.value.ID_CLI) {
      errors.value['ID_CLI'] = 'El DNI es requerido'
    } else if (!/^\d{8}$/.test(form.value.ID_CLI)) {
      errors.value['ID_CLI'] = 'El DNI debe tener 8 dígitos'
    }
  }
  if (!form.value.NOM_CLI.trim()) {
    errors.value['NOM_CLI'] = 'El nombre es requerido'
  }
  return Object.keys(errors.value).length === 0
}

function handleSubmit() {
  if (!validate()) return

  if (isEditing.value) {
    const dto: UpdateClienteDto = {
      NOM_CLI:     form.value.NOM_CLI     || undefined,
      REF_CLI:     form.value.REF_CLI     || null,
      TEL_CLI:     form.value.TEL_CLI     || null,
      DIR_CLI:     form.value.DIR_CLI     || null,
      LIM_MON_CLI: form.value.LIM_MON_CLI ?? null,
      LIM_DIA_CLI: form.value.LIM_DIA_CLI ?? null,
    }
    emit('submit', dto)
  } else {
    const dto: CreateClienteDto = {
      ID_CLI:      form.value.ID_CLI,
      NOM_CLI:     form.value.NOM_CLI,
      REF_CLI:     form.value.REF_CLI     || undefined,
      TEL_CLI:     form.value.TEL_CLI     || undefined,
      DIR_CLI:     form.value.DIR_CLI     || undefined,
      LIM_MON_CLI: form.value.LIM_MON_CLI ?? undefined,
      LIM_DIA_CLI: form.value.LIM_DIA_CLI ?? undefined,
    }
    emit('submit', dto)
  }
}
</script>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field--full { grid-column: 1 / -1; }

.field-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--c-text-second);
}

.required { color: var(--c-danger); }

.field-input {
  padding: 9px 12px;
  border: 1.5px solid var(--c-border);
  border-radius: var(--radius-md);
  font-size: 0.9375rem;
  color: var(--c-text-primary);
  background: var(--c-bg-card);
  transition: border-color var(--transition);
  outline: none;
  width: 100%;
}

.field-input:focus {
  border-color: var(--c-brand);
  box-shadow: 0 0 0 3px rgba(200,130,42,0.12);
}

.field-input:disabled {
  background: var(--c-bg-alt);
  cursor: not-allowed;
  opacity: 0.7;
}

.field-input--error { border-color: var(--c-danger); }

.field-error {
  font-size: 0.75rem;
  color: var(--c-danger);
  font-weight: 500;
}

.field-hint {
  font-size: 0.75rem;
  color: var(--c-text-muted);
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-cancel {
  padding: 10px 20px;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--c-border);
  background: var(--c-bg-card);
  color: var(--c-text-second);
  font-size: 0.875rem;
  font-weight: 500;
  width: 100%;
  transition: background var(--transition);
}

.btn-cancel:hover { background: var(--c-bg-alt); }

.btn-submit {
  padding: 10px 24px;
  border-radius: var(--radius-md);
  background: var(--c-brand);
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  width: 100%;
  transition: background var(--transition);
}

.btn-submit:hover:not(:disabled) { background: var(--c-brand-dark); }
.btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

/* ─── Desktop ────────────────────────────────────────────── */
@media (min-width: 540px) {
  .form-grid {
    grid-template-columns: 1fr 1fr;
  }

  .form-actions {
    flex-direction: row;
    justify-content: flex-end;
  }

  .btn-cancel { width: auto; }
  .btn-submit { width: auto; }
}
</style>