<template>
  <form @submit.prevent="handleSubmit" novalidate>
    <div class="form-grid">

      <div class="field field--full">
        <label class="field-label">Nombre <span class="required">*</span></label>
        <input
          v-model="form.NOM_PRD"
          class="field-input"
          :class="{ 'field-input--error': errors.NOM_PRD }"
          placeholder="Pan de molde"
        />
        <span v-if="errors.NOM_PRD" class="field-error">{{ errors.NOM_PRD }}</span>
      </div>

      <div class="field">
        <label class="field-label">Precio estándar (S/) <span class="required">*</span></label>
        <input
          v-model.number="form.PRC_STD"
          type="number"
          min="0"
          step="0.01"
          class="field-input"
          :class="{ 'field-input--error': errors.PRC_STD }"
          placeholder="0.00"
        />
        <span v-if="errors.PRC_STD" class="field-error">{{ errors.PRC_STD }}</span>
      </div>

      <div class="field">
        <label class="field-label">Categoría</label>
        <select v-model="form.ID_CAT" class="field-input">
          <option :value="null">Sin categoría</option>
          <option v-for="cat in categorias" :key="cat.ID_CAT" :value="cat.ID_CAT">
            {{ cat.NOM_CAT }}
          </option>
        </select>
      </div>

    </div>

    <div class="form-actions">
      <button type="button" class="btn-cancel" @click="$emit('cancel')">
        Cancelar
      </button>
      <button type="submit" class="btn-submit" :disabled="loading">
        {{ loading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear producto' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Producto, Categoria, CreateProductoDto, UpdateProductoDto } from '@/services/productos.service'

const props = defineProps<{
  producto?:  Producto
  categorias: Categoria[]
  loading:    boolean
}>()

const emit = defineEmits<{
  submit: [data: CreateProductoDto | UpdateProductoDto]
  cancel: []
}>()

const isEditing = computed(() => !!props.producto)

const form = ref({
  NOM_PRD: props.producto?.NOM_PRD ?? '',
  PRC_STD: props.producto ? parseFloat(props.producto.PRC_STD) : null as number | null,
  ID_CAT:  props.producto?.ID_CAT ?? null as number | null,
})

const errors = ref<Record<string, string>>({})

function validate(): boolean {
  errors.value = {}
  if (!form.value.NOM_PRD.trim()) {
    errors.value['NOM_PRD'] = 'El nombre es requerido'
  }
  if (form.value.PRC_STD === null || form.value.PRC_STD < 0) {
    errors.value['PRC_STD'] = 'El precio es requerido y debe ser mayor o igual a 0'
  }
  return Object.keys(errors.value).length === 0
}

function handleSubmit() {
  if (!validate()) return

  if (isEditing.value) {
    const dto: UpdateProductoDto = {
      NOM_PRD: form.value.NOM_PRD || undefined,
      PRC_STD: form.value.PRC_STD ?? undefined,
      ID_CAT:  form.value.ID_CAT,
    }
    emit('submit', dto)
  } else {
    const dto: CreateProductoDto = {
      NOM_PRD: form.value.NOM_PRD,
      PRC_STD: form.value.PRC_STD!,
      ID_CAT:  form.value.ID_CAT ?? undefined,
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

.field-input--error { border-color: var(--c-danger); }

.field-error {
  font-size: 0.75rem;
  color: var(--c-danger);
  font-weight: 500;
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