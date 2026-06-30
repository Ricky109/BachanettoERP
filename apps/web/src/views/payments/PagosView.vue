<template>
  <div class="pagos-view">

    <!-- Cabecera -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Pagos</h1>
        <p class="page-desc">Saldos y pagos de clientes</p>
      </div>
    </div>

    <!-- Buscador -->
    <div class="search-bar">
      <input
        v-model="search"
        class="search-input"
        placeholder="Buscar cliente..."
        @input="onSearch"
      />
    </div>

    <!-- Estado de carga -->
    <div v-if="store.loading" class="state-msg">Cargando...</div>
    <div v-else-if="store.error" class="state-msg state-msg--error">{{ store.error }}</div>

    <!-- Tabla de clientes con saldo -->
    <div v-else-if="clientesFiltrados.length > 0" class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Referencia</th>
            <th>Total entregas</th>
            <th>Total pagos</th>
            <th>Saldo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cli in clientesFiltrados" :key="cli.ID_CLI">
            <td class="td-bold">{{ cli.NOM_CLI }}</td>
            <td class="td-muted">{{ cli.REF_CLI ?? '—' }}</td>
            <td>S/ {{ cli.total_entregas }}</td>
            <td>S/ {{ cli.total_pagos }}</td>
            <td>
              <span class="saldo-badge" :class="saldoClass(cli.saldo)">
                S/ {{ cli.saldo }}
              </span>
            </td>
            <td class="td-actions">
              <button class="btn-edit" @click="abrirModal(cli)">
                Ver / Pagar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="state-msg">
      {{ search ? 'No se encontraron clientes.' : 'No hay clientes con saldo pendiente.' }}
    </div>

    <!-- Modal detalle y pago -->
    <div v-if="modalAbierto" class="modal-overlay" @click.self="cerrarModal">
      <div class="modal modal--lg">

        <div class="modal-header">
          <div>
            <h2 class="modal-title">{{ store.saldoActual?.NOM_CLI }}</h2>
            <p class="modal-sub">{{ store.saldoActual?.REF_CLI ?? '' }}</p>
          </div>
          <button class="modal-close" @click="cerrarModal">✕</button>
        </div>

        <div class="modal-body">

          <!-- Resumen saldo -->
          <div v-if="store.loadingPagos" class="state-msg">Cargando...</div>
          <template v-else>

            <div class="saldo-resumen">
              <div class="saldo-item">
                <span class="saldo-label">Total entregas</span>
                <span class="saldo-valor">S/ {{ store.saldoActual?.total_entregas }}</span>
              </div>
              <div class="saldo-item">
                <span class="saldo-label">Total pagos</span>
                <span class="saldo-valor saldo-valor--green">
                  S/ {{ store.saldoActual?.total_pagos }}
                </span>
              </div>
              <div class="saldo-item saldo-item--total">
                <span class="saldo-label">Saldo pendiente</span>
                <span class="saldo-valor saldo-valor--red">
                  S/ {{ store.saldoActual?.saldo }}
                </span>
              </div>
            </div>

            <!-- Formulario nuevo pago -->
            <div class="pago-form">
              <p class="section-label">Registrar pago</p>
              <div class="pago-fields">
                <div class="field">
                  <label class="field-label">Monto S/ <span class="required">*</span></label>
                  <input
                    v-model.number="formPago.MON_PAG"
                    type="number"
                    min="0.01"
                    step="0.01"
                    class="field-input"
                    :class="{ 'field-input--error': errorMonto }"
                    placeholder="0.00"
                  />
                  <span v-if="errorMonto" class="field-error">{{ errorMonto }}</span>
                </div>
                <div class="field">
                  <label class="field-label">Método <span class="required">*</span></label>
                  <select v-model="formPago.MET_PAG" class="field-input">
                    <option value="">Seleccionar...</option>
                    <option
                      v-for="(label, key) in MetodoPagoLabel"
                      :key="key"
                      :value="key"
                    >
                      {{ label }}
                    </option>
                  </select>
                </div>
                <div class="field">
                  <label class="field-label">Fecha <span class="required">*</span></label>
                  <input
                    v-model="formPago.FEC_PAG"
                    type="date"
                    class="field-input"
                  />
                </div>
                <div class="field field--full">
                  <label class="field-label">Observaciones</label>
                  <input
                    v-model="formPago.OBS_PAG"
                    class="field-input"
                    placeholder="Opcional..."
                  />
                </div>
              </div>

              <div v-if="store.errorPagos" class="state-msg state-msg--error">
                {{ store.errorPagos }}
              </div>

              <div class="pago-actions">
                <button
                  class="btn-submit"
                  :disabled="store.loadingPagos"
                  @click="confirmarPago"
                >
                  {{ store.loadingPagos ? 'Guardando...' : 'Registrar pago' }}
                </button>
              </div>
            </div>

            <!-- Historial de pagos -->
            <div class="historial">
              <p class="section-label">Últimos pagos</p>

              <div v-if="store.pagos.length === 0" class="state-msg">
                Sin pagos registrados aún.
              </div>

              <div v-else class="table-wrap">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Método</th>
                      <th>Monto</th>
                      <th>Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="pago in store.pagos" :key="pago.ID_PAG">
                      <td>{{ formatFecha(pago.FEC_PAG) }}</td>
                      <td>
                        <span class="metodo-badge">
                          {{ MetodoPagoLabel[pago.MET_PAG] }}
                        </span>
                      </td>
                      <td class="td-bold">S/ {{ parseFloat(pago.MON_PAG).toFixed(2) }}</td>
                      <td class="td-muted">{{ pago.OBS_PAG ?? '—' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </template>

        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="cerrarModal">Cerrar</button>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { usePagosStore } from '@/stores/pagos.store'
import { MetodoPago, MetodoPagoLabel } from '@bachanetto/shared'
import type { SaldoCliente } from '@/services/pagos.service'

const store = usePagosStore()
const { clientes } = storeToRefs(store)

// ── Helpers fecha ─────────────────────────────────────────
function localISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatFecha(iso: string): string {
  const parts = iso.split('T')[0]?.split('-') ?? []
  const y = Number(parts[0] ?? 0)
  const m = Number(parts[1] ?? 1)
  const d = Number(parts[2] ?? 1)
  return new Date(y, m - 1, d).toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

// ── Búsqueda ──────────────────────────────────────────────
const search = ref('')

const clientesFiltrados = computed(() => {
  if (!search.value.trim()) return clientes.value
  const q = search.value.toLowerCase()
  return clientes.value.filter(c =>
    c.NOM_CLI.toLowerCase().includes(q) ||
    (c.REF_CLI ?? '').toLowerCase().includes(q)
  )
})

function onSearch() {
  // filtrado local, no hace llamada al backend
}

onMounted(() => store.listarClientes())

// ── Modal ─────────────────────────────────────────────────
const modalAbierto = ref(false)

async function abrirModal(cli: SaldoCliente) {
  modalAbierto.value = true
  resetFormPago()
  await store.cargarDetalle(cli.ID_CLI)
}

function cerrarModal() {
  modalAbierto.value = false
  resetFormPago()
}

// ── Formulario pago ───────────────────────────────────────
const errorMonto = ref('')

const formPago = ref({
  MON_PAG: null as number | null,
  MET_PAG: '' as MetodoPago | '',
  FEC_PAG: localISO(new Date()),
  OBS_PAG: '',
})

function resetFormPago() {
  formPago.value = {
    MON_PAG: null,
    MET_PAG: '',
    FEC_PAG: '',
    OBS_PAG: '',
  }
  errorMonto.value = ''
}

function validar(): boolean {
  errorMonto.value = ''
  if (!formPago.value.MON_PAG || formPago.value.MON_PAG <= 0) {
    errorMonto.value = 'El monto debe ser mayor a 0'
    return false
  }
  if (!formPago.value.MET_PAG) {
    errorMonto.value = 'Selecciona un método de pago'
    return false
  }
  if (!formPago.value.FEC_PAG) {
    errorMonto.value = 'La fecha es requerida'
    return false
  }
  return true
}

async function confirmarPago() {
  if (!validar() || !store.saldoActual) return

  const ok = await store.registrar({
    ID_CLI:  store.saldoActual.ID_CLI,
    MON_PAG: formPago.value.MON_PAG!,
    MET_PAG: formPago.value.MET_PAG as MetodoPago,
    FEC_PAG: formPago.value.FEC_PAG,
    OBS_PAG: formPago.value.OBS_PAG || undefined,
  })

  if (ok) resetFormPago()
}

// ── Helpers visuales ──────────────────────────────────────
function saldoClass(saldo: string) {
  const n = parseFloat(saldo)
  if (n <= 0)   return 'saldo-badge--ok'
  if (n < 100)  return 'saldo-badge--warn'
  return 'saldo-badge--danger'
}
</script>

<style scoped>
.pagos-view { display: flex; flex-direction: column; gap: 20px; }

.page-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-title { font-size: 1.75rem; color: var(--c-text-primary); }
.page-desc  { font-size: 0.875rem; color: var(--c-text-muted); margin-top: 2px; }

/* ─── Buscador ────────────────────────────────────────────── */
.search-bar { display: flex; }

.search-input {
  width: 100%;
  padding: 9px 14px;
  border: 1.5px solid var(--c-border);
  border-radius: var(--radius-md);
  font-size: 0.9375rem;
  outline: none;
  transition: border-color var(--transition);
}

.search-input:focus {
  border-color: var(--c-brand);
  box-shadow: 0 0 0 3px rgba(200,130,42,0.12);
}

/* ─── Tabla ───────────────────────────────────────────────── */
.table-wrap {
  overflow-x: auto;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-lg);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  min-width: 500px;
}

.table th {
  padding: 11px 14px;
  text-align: left;
  font-weight: 500;
  color: var(--c-text-muted);
  background: var(--c-bg-alt);
  border-bottom: 1px solid var(--c-border);
  white-space: nowrap;
}

.table td {
  padding: 11px 14px;
  border-bottom: 1px solid var(--c-border);
  color: var(--c-text-primary);
}

.table tbody tr:last-child td { border-bottom: none; }
.table tbody tr:hover          { background: var(--c-surface-1); }

.td-bold    { font-weight: 500; }
.td-muted   { color: var(--c-text-muted); }
.td-actions { display: flex; gap: 8px; justify-content: flex-end; }

.btn-edit {
  padding: 5px 12px;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--c-border);
  background: var(--c-bg-card);
  font-size: 0.8125rem;
  color: var(--c-text-second);
  transition: background var(--transition);
}
.btn-edit:hover { background: var(--c-bg-alt); }

/* ─── Saldo badge ─────────────────────────────────────────── */
.saldo-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: 0.8125rem;
  font-weight: 600;
}

.saldo-badge--ok     { background: var(--c-success-bg); color: var(--c-success); }
.saldo-badge--warn   { background: var(--c-warning-bg); color: var(--c-warning); }
.saldo-badge--danger { background: var(--c-danger-bg);  color: var(--c-danger);  }

/* ─── Modal ───────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(28,17,10,0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 100;
  padding: 0;
}

.modal {
  width: 100%;
  max-height: 90dvh;
  overflow-y: auto;
  background: var(--c-bg-card);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
}

.modal--lg { min-height: 70dvh; }

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--c-border);
  position: sticky;
  top: 0;
  background: var(--c-bg-card);
  z-index: 1;
}

.modal-title { font-size: 1.1rem; font-family: var(--font-display); }
.modal-sub   { font-size: 0.8125rem; color: var(--c-text-muted); margin-top: 2px; }

.modal-close {
  font-size: 1rem;
  color: var(--c-text-muted);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: color var(--transition);
}
.modal-close:hover { color: var(--c-text-primary); }

.modal-body {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--c-border);
  display: flex;
  justify-content: flex-end;
  position: sticky;
  bottom: 0;
  background: var(--c-bg-card);
}

/* ─── Saldo resumen ───────────────────────────────────────── */
.saldo-resumen {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

.saldo-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: var(--c-bg-alt);
  border-radius: var(--radius-md);
  border: 1px solid var(--c-border);
}

.saldo-item--total {
  background: var(--c-danger-bg);
  border-color: rgba(192,57,43,0.2);
}

.saldo-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--c-text-muted);
}

.saldo-valor {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--c-text-primary);
}

.saldo-valor--green { color: var(--c-success); }
.saldo-valor--red   { color: var(--c-danger); }

/* ─── Formulario pago ─────────────────────────────────────── */
.pago-form {
  border: 1px solid var(--c-border);
  border-radius: var(--radius-lg);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--c-bg-card);
}

.pago-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.field { display: flex; flex-direction: column; gap: 6px; }
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

.pago-actions { display: flex; justify-content: flex-end; }

/* ─── Historial ───────────────────────────────────────────── */
.historial {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--c-text-second);
}

.metodo-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 500;
  background: var(--c-brand-pale);
  color: var(--c-brand-dark);
}

/* ─── Botones ─────────────────────────────────────────────── */
.btn-cancel {
  padding: 10px 20px;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--c-border);
  background: var(--c-bg-card);
  color: var(--c-text-second);
  font-size: 0.875rem;
  font-weight: 500;
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
  transition: background var(--transition);
}
.btn-submit:hover:not(:disabled) { background: var(--c-brand-dark); }
.btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

.state-msg {
  padding: 32px;
  text-align: center;
  color: var(--c-text-muted);
  font-size: 0.9375rem;
}
.state-msg--error { color: var(--c-danger); }

/* ─── Desktop ────────────────────────────────────────────── */
@media (min-width: 640px) {
  .modal-footer { flex-direction: row; justify-content: flex-end; }
}

@media (min-width: 1024px) {
  .modal-overlay { align-items: center; padding: 24px; }
  .modal {
    max-width: 600px;
    max-height: calc(100dvh - 48px);
    border-radius: var(--radius-xl);
  }
}

@media (max-width: 480px) {
  .saldo-resumen { grid-template-columns: 1fr; }
  .pago-fields   { grid-template-columns: 1fr; }
}
</style>