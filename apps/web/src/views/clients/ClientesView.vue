<template>
  <div class="clientes-view">
    <!-- Cabecera -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Clientes</h1>
        <p class="page-desc">Gestión de clientes de reparto</p>
      </div>
      <button class="btn-new" @click="abrirFormulario()">+ Nuevo cliente</button>
    </div>

    <!-- Buscador -->
    <div class="search-bar">
      <input
        v-model="search"
        class="search-input"
        placeholder="Buscar por nombre, referencia o DNI..."
        @input="onSearch"
      />
    </div>

    <label class="check-label">
      <input v-model="mostrarInactivos" type="checkbox" @change="onSearch" />
      Mostrar desactivados
    </label>

    <!-- Estado de carga -->
    <div v-if="loading" class="state-msg">Cargando...</div>
    <div v-else-if="error" class="state-msg state-msg--error">{{ error }}</div>

    <!-- Tabla -->
    <div v-else-if="clientes.length > 0" class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>DNI</th>
            <th>Nombre</th>
            <th>Referencia</th>
            <th>Teléfono</th>
            <th>Límite S/</th>
            <th>Límite días</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="cliente in clientes"
            :key="cliente.ID_CLI"
            :class="{ 'row--inactivo': !cliente.ACT_CLI }"
          >
            <td class="td-mono">{{ cliente.ID_CLI }}</td>
            <td class="td-bold">
              {{ cliente.NOM_CLI }}
              <span v-if="!cliente.ACT_CLI" class="badge-inactivo">Inactivo</span>
            </td>
            <td class="td-muted">{{ cliente.REF_CLI ?? "—" }}</td>
            <td>{{ cliente.TEL_CLI ?? "—" }}</td>
            <td>{{ cliente.LIM_MON_CLI ? `S/ ${cliente.LIM_MON_CLI}` : "—" }}</td>
            <td>{{ cliente.LIM_DIA_CLI ? `${cliente.LIM_DIA_CLI} días` : "—" }}</td>
            <td class="td-actions">
              <button class="btn-edit" @click="abrirFormulario(cliente)">Editar</button>
              <button class="btn-precios" @click="abrirPrecios(cliente)">Precios</button>
              <button
                class="btn-delete"
                :class="{ 'btn-activar': !cliente.ACT_CLI }"
                @click="confirmarToggle(cliente)"
              >
                {{ cliente.ACT_CLI ? 'Desactivar' : 'Activar' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Sin resultados -->
    <div v-else class="state-msg">
      {{ search ? "No se encontraron clientes." : "Aún no hay clientes registrados." }}
    </div>

    <!-- Modal -->
    <div v-if="modalAbierto" class="modal-overlay" @click.self="cerrarModal">
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">
            {{ clienteEditando ? "Editar cliente" : "Nuevo cliente" }}
          </h2>
          <button class="modal-close" @click="cerrarModal">✕</button>
        </div>
        <div class="modal-body">
          <ClienteForm
            :cliente="clienteEditando ?? undefined"
            :loading="store.loading"
            @submit="onSubmit"
            @cancel="cerrarModal"
          />
        </div>
      </div>
    </div>
    <!-- Modal precios pactados -->
    <PreciosPactadosModal
      v-if="modalPreciosAbierto"
      :cliente="clientePrecios!"
      @close="cerrarPrecios"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useClientesStore } from "@/stores/clientes.store";
import ClienteForm from "@/components/forms/ClienteForm.vue";
import type { Cliente, CreateClienteDto, UpdateClienteDto } from "@/services/clientes.service";
import PreciosPactadosModal from "@/components/forms/PreciosPactadosModal.vue";

const store = useClientesStore();
const { clientes, loading, error } = storeToRefs(store);

const modalPreciosAbierto = ref(false);
const clientePrecios = ref<Cliente | null>(null);

const search = ref("");
const mostrarInactivos = ref(false);
const modalAbierto = ref(false);
const clienteEditando = ref<Cliente | null>(null);

onMounted(() => store.listar(undefined, mostrarInactivos.value));

function onSearch() {
  store.listar(search.value || undefined, mostrarInactivos.value);
}

function abrirFormulario(cliente?: Cliente) {
  clienteEditando.value = cliente ?? null;
  modalAbierto.value = true;
}

function cerrarModal() {
  modalAbierto.value = false;
  clienteEditando.value = null;
}

function abrirPrecios(cliente: Cliente) {
  clientePrecios.value = cliente;
  modalPreciosAbierto.value = true;
}

function cerrarPrecios() {
  modalPreciosAbierto.value = false;
  clientePrecios.value = null;
}

async function onSubmit(dto: CreateClienteDto | UpdateClienteDto) {
  let ok = false;
  if (clienteEditando.value) {
    if (!confirm('¿Confirmar los cambios en el cliente?')) return;
    ok = await store.actualizar(clienteEditando.value.ID_CLI, dto as UpdateClienteDto);
  } else {
    if (!confirm('¿Confirmar el registro del nuevo cliente?')) return;
    ok = await store.crear(dto as CreateClienteDto);
  }
  if (ok) cerrarModal();
}

async function confirmarToggle(cliente: Cliente) {
  const accion = cliente.ACT_CLI ? 'desactivar' : 'activar';
  if (!confirm(`¿${accion === 'desactivar' ? 'Desactivar' : 'Activar'} a ${cliente.NOM_CLI}?`)) return;
  await store.toggle(cliente.ID_CLI);
}
</script>

<style scoped>
.clientes-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-title {
  font-size: 1.75rem;
  color: var(--c-text-primary);
}

.page-desc {
  font-size: 0.875rem;
  color: var(--c-text-muted);
  margin-top: 2px;
}

.btn-new {
  padding: 10px 20px;
  background: var(--c-brand);
  color: white;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  width: 100%;
  transition: background var(--transition);
}

.btn-new:hover {
  background: var(--c-brand-dark);
}

.search-bar {
  display: flex;
}

.check-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: var(--c-text-second);
  cursor: pointer;
}

.row--inactivo {
  opacity: 0.55;
}

.badge-inactivo {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 0.6875rem;
  font-weight: 500;
  background: var(--c-danger-bg);
  color: var(--c-danger);
}

.btn-activar {
  border-color: rgba(45,122,79,0.2);
  background: var(--c-success-bg);
  color: var(--c-success);
}

.btn-activar:hover {
  background: #d4ecdd;
}

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
  box-shadow: 0 0 0 3px rgba(200, 130, 42, 0.12);
}

/* ─── Tabla → cards en mobile ────────────────────────────── */
.table-wrap {
  overflow-x: auto;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-lg);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  min-width: 600px;
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

.table tbody tr:last-child td {
  border-bottom: none;
}
.table tbody tr:hover {
  background: var(--c-surface-1);
}

.td-mono {
  font-family: monospace;
  font-size: 0.8125rem;
}
.td-bold {
  font-weight: 500;
}
.td-muted {
  color: var(--c-text-muted);
}

.td-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn-edit {
  padding: 5px 12px;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--c-border);
  background: var(--c-bg-card);
  font-size: 0.8125rem;
  color: var(--c-text-second);
  transition: background var(--transition);
}

.btn-edit:hover {
  background: var(--c-bg-alt);
}

.btn-precios {
  padding: 5px 12px;
  border-radius: var(--radius-sm);
  border: 1.5px solid rgba(200, 130, 42, 0.3);
  background: var(--c-brand-pale);
  font-size: 0.8125rem;
  color: var(--c-brand-dark);
  transition: background var(--transition);
}

.btn-precios:hover {
  background: #f5e0c0;
}

.btn-delete {
  padding: 5px 12px;
  border-radius: var(--radius-sm);
  border: 1.5px solid rgba(192, 57, 43, 0.2);
  background: var(--c-danger-bg);
  font-size: 0.8125rem;
  color: var(--c-danger);
  transition: background var(--transition);
}

.btn-delete:hover {
  background: #f9d4d0;
}

.state-msg {
  padding: 40px;
  text-align: center;
  color: var(--c-text-muted);
  font-size: 0.9375rem;
}

.state-msg--error {
  color: var(--c-danger);
}

/* ─── Modal ───────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(28, 17, 10, 0.45);
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
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--c-border);
  position: sticky;
  top: 0;
  background: var(--c-bg-card);
  z-index: 1;
}

.modal-title {
  font-size: 1.1rem;
  font-family: var(--font-display);
}

.modal-close {
  font-size: 1rem;
  color: var(--c-text-muted);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: color var(--transition);
}

.modal-close:hover {
  color: var(--c-text-primary);
}

.modal-body {
  padding: 20px;
}

/* ─── Desktop ────────────────────────────────────────────── */
@media (min-width: 640px) {
  .page-header {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }

  .btn-new {
    width: auto;
  }
}

@media (min-width: 1024px) {
  .modal-overlay {
    align-items: center;
    padding: 24px;
  }

  .modal {
    max-width: 560px;
    max-height: calc(100dvh - 48px);
    border-radius: var(--radius-xl);
  }
}
</style>
