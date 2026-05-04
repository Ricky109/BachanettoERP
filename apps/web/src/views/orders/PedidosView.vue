<template>
  <div class="pedidos-view">
    <!-- Cabecera -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Pedidos</h1>
        <p class="page-desc">Registro de pedidos de reparto</p>
      </div>
      <button v-if="isAdmin" class="btn-new" @click="abrirModalNuevo">+ Nuevo pedido</button>
    </div>

    <!-- Filtros -->
    <div class="filters-bar">
      <div v-if="isAdmin" class="fecha-wrap">
        <input
          v-model="fechaFiltro"
          type="date"
          class="field-input fecha-input"
          @change="cargarPedidos"
        />
        <span class="dia-label">{{ diaSemana }}</span>
      </div>
      <input
        v-model="searchFiltro"
        class="search-input"
        placeholder="Buscar por cliente..."
        @input="cargarPedidos"
      />
    </div>

    <!-- Checkboxes visibilidad -->
    <div v-if="isAdmin" class="visibility-bar">
      <label class="check-label">
        <input v-model="mostrarEntregados" type="checkbox" />
        Mostrar últimos entregados
      </label>
      <label class="check-label">
        <input v-model="mostrarCancelados" type="checkbox" />
        Mostrar últimos cancelados
      </label>
    </div>

    <!-- Tabla -->
    <div v-if="store.loading" class="state-msg">Cargando...</div>
    <div v-else-if="store.error" class="state-msg state-msg--error">{{ store.error }}</div>

    <div v-else-if="pedidosFiltrados.length > 0" class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Cliente</th>
            <th>Fecha entrega</th>
            <th>Turno</th>
            <th>Estado</th>
            <th>Productos</th>
            <th v-if="isAdmin"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="pedido in pedidosFiltrados" :key="pedido.ID_PED">
            <td class="td-mono">{{ pedido.ID_PED }}</td>
            <td class="td-bold">{{ pedido.NOM_CLI }}</td>
            <td>{{ formatFecha(pedido.FEC_ENT_PED) }}</td>
            <td>{{ TurnoLabel[pedido.TUR_PED as Turno] }}</td>
            <td>
              <span class="badge" :class="badgeClass(pedido.EST_PED)">
                {{ EstadoPedidoLabel[pedido.EST_PED as EstadoPedido] }}
              </span>
            </td>
            <td class="td-muted">{{ pedido.detalles.length }} producto(s)</td>
            <td v-if="isAdmin" class="td-actions">
              <button
                v-if="pedido.EST_PED === 'PENDIENTE'"
                class="btn-edit"
                @click="abrirModalEditar(pedido)"
              >
                Editar
              </button>
              <button
                v-if="pedido.EST_PED === 'PENDIENTE'"
                class="btn-delete"
                @click="confirmarCancelar(pedido)"
              >
                Cancelar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="state-msg">No hay pedidos para esta fecha.</div>

    <!-- Modal Nuevo pedido -->
    <div v-if="modalNuevoAbierto" class="modal-overlay" @click.self="cerrarModalNuevo">
      <div class="modal modal--lg">
        <div class="modal-header">
          <h2 class="modal-title">Nuevo pedido</h2>
          <button class="modal-close" @click="cerrarModalNuevo">✕</button>
        </div>
        <div class="modal-body">
          <!-- Fecha y turno -->
          <div class="form-header-fields">
            <div class="field">
              <label class="field-label">Fecha de entrega <span class="required">*</span></label>
              <input v-model="formNuevo.FEC_ENT_PED" type="date" class="field-input" />
            </div>
            <div class="field">
              <label class="field-label">Turno</label>
              <select v-model="formNuevo.TUR_PED" class="field-input">
                <option :value="Turno.MANANA">Mañana</option>
                <option :value="Turno.TARDE">Tarde</option>
              </select>
            </div>
          </div>

          <!-- Buscador cliente -->
          <div class="field">
            <label class="field-label">Cliente <span class="required">*</span></label>
            <div class="search-wrap" v-if="!clienteSeleccionado">
              <input
                v-model="busquedaCliente"
                class="field-input"
                placeholder="Buscar por nombre o DNI..."
                @input="onBuscarCliente"
              />
              <ul v-if="resultadosCliente.length > 0" class="cliente-dropdown">
                <li
                  v-for="cli in resultadosCliente"
                  :key="cli.ID_CLI"
                  class="cliente-option"
                  @click="seleccionarCliente(cli)"
                >
                  <span class="cliente-nombre">{{ cli.NOM_CLI }}</span>
                  <span class="cliente-dni">{{ cli.ID_CLI }}</span>
                </li>
              </ul>
            </div>
            <div v-else class="cliente-seleccionado">
              <span>{{ clienteSeleccionado.NOM_CLI }}</span>
              <button class="btn-clear" @click="limpiarCliente">✕</button>
            </div>
          </div>

          <!-- Productos pactados -->
          <template v-if="clienteSeleccionado">
            <div v-if="loadingProductos" class="state-msg">Cargando productos...</div>
            <template v-else>
              <div class="productos-header">
                <p class="section-label">Productos</p>
                <div class="agregar-wrap">
                  <input
                    v-model="busquedaProductoNuevo"
                    class="field-input search-prod"
                    placeholder="Agregar producto..."
                    @input="onBuscarProductoNuevo"
                  />
                  <ul v-if="resultadosProducto.length > 0" class="search-dropdown">
                    <li
                      v-for="prod in resultadosProducto"
                      :key="prod.ID_PRD"
                      class="search-option"
                      @click="agregarProducto(prod)"
                    >
                      {{ prod.NOM_PRD }}
                      <span class="search-option-prc"
                        >S/ {{ parseFloat(prod.PRC_STD).toFixed(2) }}</span
                      >
                    </li>
                  </ul>
                </div>
              </div>

              <div v-if="lineasNuevo.length === 0" class="state-msg">
                Este cliente no tiene productos pactados aún.
              </div>

              <div v-else class="lineas-list">
                <!-- en modal nuevo, reemplaza lineas-header -->
                <div class="lineas-header lineas-header--nuevo">
                  <span>Producto</span>
                  <span>Precio S/</span>
                  <span>Cantidad</span>
                </div>
                <div
                  v-for="linea in lineasNuevo"
                  :key="linea.ID_PRD"
                  class="linea-row linea-row--nuevo-pedido"
                  :class="{ 'linea-row--nueva': linea.precio_nuevo }"
                >
                  <span class="linea-nombre">{{ linea.NOM_PRD }}</span>
                  <div class="linea-precio-wrap">
                    <span class="precio-prefix">S/</span>
                    <input
                      v-model.number="linea.PRC_UNI"
                      type="number"
                      min="0"
                      step="0.01"
                      class="field-input linea-input"
                    />
                  </div>
                  <input
                    v-model.number="linea.CAN"
                    type="number"
                    min="0"
                    class="field-input linea-input"
                  />
                </div>
              </div>

              <!-- Total -->
              <div class="total-row">
                <span class="total-label">Total estimado</span>
                <span class="total-valor">S/ {{ totalNuevo }}</span>
              </div>

              <div v-if="store.error" class="state-msg state-msg--error">{{ store.error }}</div>
            </template>
          </template>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="cerrarModalNuevo">Cancelar</button>
          <button
            class="btn-submit"
            :disabled="store.loading || !clienteSeleccionado || lineasConCantidad.length === 0"
            @click="confirmarNuevo"
          >
            {{ store.loading ? "Guardando..." : "Registrar pedido" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Editar pedido -->
    <div v-if="modalEditarAbierto" class="modal-overlay" @click.self="cerrarModalEditar">
      <div class="modal modal--lg">
        <div class="modal-header">
          <h2 class="modal-title">Editando pedido #{{ pedidoEditando?.ID_PED }}</h2>
          <button class="modal-close" @click="cerrarModalEditar">✕</button>
        </div>
        <div class="modal-body">
          <!-- Fecha y turno -->
          <div class="form-header-fields">
            <div class="field">
              <label class="field-label">Fecha de entrega</label>
              <input v-model="formEditar.FEC_ENT_PED" type="date" class="field-input" />
            </div>
            <div class="field">
              <label class="field-label">Turno</label>
              <select v-model="formEditar.TUR_PED" class="field-input">
                <option :value="Turno.MANANA">Mañana</option>
                <option :value="Turno.TARDE">Tarde</option>
              </select>
            </div>
          </div>

          <!-- Cliente fijo -->
          <div class="field">
            <label class="field-label">Cliente</label>
            <div class="cliente-fijo">{{ pedidoEditando?.NOM_CLI }}</div>
          </div>

          <!-- Líneas -->
          <div class="productos-header">
            <p class="section-label">Productos</p>
            <div class="agregar-wrap">
              <input
                v-model="busquedaProductoEditar"
                class="field-input search-prod"
                placeholder="Agregar producto..."
                @input="onBuscarProductoEditar"
              />
              <ul v-if="resultadosProductoEditar.length > 0" class="search-dropdown">
                <li
                  v-for="prod in resultadosProductoEditar"
                  :key="prod.ID_PRD"
                  class="search-option"
                  @click="agregarProductoEditar(prod)"
                >
                  {{ prod.NOM_PRD }}
                  <span class="search-option-prc"
                    >S/ {{ parseFloat(prod.PRC_STD).toFixed(2) }}</span
                  >
                </li>
              </ul>
            </div>
          </div>

          <div v-if="lineasEditar.length === 0" class="state-msg">
            No hay productos en este pedido.
          </div>

          <div v-else class="lineas-list">
            <div class="lineas-header">
              <span>Producto</span>
              <span>Precio S/</span>
              <span>Cantidad</span>
              <span></span>
            </div>
            <div
              v-for="(linea, i) in lineasEditar"
              :key="linea.ID_PRD"
              class="linea-row"
              :class="{ 'linea-row--nueva': linea.precio_nuevo }"
            >
              <span class="linea-nombre">{{ linea.NOM_PRD }}</span>
              <div class="linea-precio-wrap">
                <span class="precio-prefix">S/</span>
                <input
                  v-model.number="linea.PRC_UNI"
                  type="number"
                  min="0"
                  step="0.01"
                  class="field-input linea-input"
                />
              </div>
              <input
                v-model.number="linea.CAN"
                type="number"
                min="1"
                class="field-input linea-input"
              />
              <button class="btn-remove" @click="quitarLineaEditar(i)">✕</button>
            </div>
          </div>

          <!-- Total -->
          <div class="total-row">
            <span class="total-label">Total estimado</span>
            <span class="total-valor">S/ {{ totalEditar }}</span>
          </div>

          <div v-if="store.error" class="state-msg state-msg--error">{{ store.error }}</div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="cerrarModalEditar">Cancelar</button>
          <button
            class="btn-submit"
            :disabled="store.loading || lineasEditar.length === 0"
            @click="confirmarEditar"
          >
            {{ store.loading ? "Guardando..." : "Guardar cambios" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { usePedidosStore } from "@/stores/pedidos.store";
import { useAuthStore } from "@/stores/auth.store";
import { clientesService } from "@/services/clientes.service";
import { productosService } from "@/services/productos.service";
import { pedidosService } from "@/services/pedidos.service";
import { Turno, TurnoLabel, EstadoPedido, EstadoPedidoLabel } from "@bachanetto/shared";
import type { Pedido } from "@bachanetto/shared";
import type { Cliente } from "@/services/clientes.service";
import type { Producto } from "@/services/productos.service";

const store = usePedidosStore();
const auth = useAuthStore();
const isAdmin = computed(() => auth.isAdmin);
const { pedidos } = storeToRefs(store);

// ── Helpers de fecha ──────────────────────────────────────
function localISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function hoyISO(): string {
  return localISO(new Date());
}

function mananaISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return localISO(d);
}

function formatFecha(iso: string): string {
  const datePart = iso.split('T')[0] ?? ''
  const parts    = datePart.split('-')
  const y = Number(parts[0] ?? 0)
  const m = Number(parts[1] ?? 1)
  const d = Number(parts[2] ?? 1)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

// ── Filtros tabla ─────────────────────────────────────────
const fechaFiltro = ref(isAdmin.value ? mananaISO() : hoyISO());
const searchFiltro = ref("");
const mostrarEntregados = ref(false);
const mostrarCancelados = ref(false);

const diaSemana = computed((): string => {
  if (!fechaFiltro.value) return ''
  const parts = fechaFiltro.value.split('-')
  const y = Number(parts[0] ?? 0)
  const m = Number(parts[1] ?? 1)
  const d = Number(parts[2] ?? 1)
  const date = new Date(y, m - 1, d)
  const dias = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
  return dias[date.getDay()] ?? ''
})

const pedidosFiltrados = computed(() => {
  const pendientes = pedidos.value.filter((p) => p.EST_PED === "PENDIENTE");
  const entregados = mostrarEntregados.value
    ? pedidos.value.filter((p) => p.EST_PED === "ENTREGADO").slice(-5)
    : [];
  const cancelados = mostrarCancelados.value
    ? pedidos.value.filter((p) => p.EST_PED === "CANCELADO").slice(-5)
    : [];
  return [...pendientes, ...entregados, ...cancelados];
});

function cargarPedidos() {
  store.listar({
    fecha: isAdmin.value ? fechaFiltro.value : undefined,
    search: searchFiltro.value || undefined,
  });
}

onMounted(() => cargarPedidos());

// ── Tipo línea ────────────────────────────────────────────
interface LineaPedido {
  ID_PRD: number;
  NOM_PRD: string;
  CAN: number;
  PRC_UNI: number;
  precio_nuevo: boolean;
}

// ══════════════════════════════════════════════════════════
// MODAL NUEVO PEDIDO
// ══════════════════════════════════════════════════════════
const modalNuevoAbierto = ref(false);
const clienteSeleccionado = ref<Cliente | null>(null);
const busquedaCliente = ref("");
const resultadosCliente = ref<Cliente[]>([]);
const loadingProductos = ref(false);
const lineasNuevo = ref<LineaPedido[]>([]);
const busquedaProductoNuevo = ref("");
const resultadosProducto = ref<Producto[]>([]);

const formNuevo = ref<{ FEC_ENT_PED: string; TUR_PED: Turno }>({
  FEC_ENT_PED: mananaISO(),
  TUR_PED: Turno.MANANA,
});

const lineasConCantidad = computed(() => lineasNuevo.value.filter((l) => l.CAN > 0));

const totalNuevo = computed(() => {
  const t = lineasNuevo.value.reduce((acc, l) => acc + l.PRC_UNI * l.CAN, 0);
  return t.toFixed(2);
});

function abrirModalNuevo() {
  formNuevo.value = { FEC_ENT_PED: mananaISO(), TUR_PED: Turno.MANANA };
  limpiarCliente();
  modalNuevoAbierto.value = true;
}

function cerrarModalNuevo() {
  modalNuevoAbierto.value = false;
  limpiarCliente();
}

let debounceCliente: ReturnType<typeof setTimeout>;
function onBuscarCliente() {
  clearTimeout(debounceCliente);
  if (!busquedaCliente.value.trim()) {
    resultadosCliente.value = [];
    return;
  }
  debounceCliente = setTimeout(async () => {
    resultadosCliente.value = await clientesService.listar(busquedaCliente.value);
  }, 300);
}

async function seleccionarCliente(cli: Cliente) {
  clienteSeleccionado.value = cli;
  resultadosCliente.value = [];
  busquedaCliente.value = "";
  await cargarProductosPactados(cli.ID_CLI);
}

async function cargarProductosPactados(idCli: string) {
  loadingProductos.value = true;
  try {
    const pactados = await pedidosService.productosPactados(idCli);
    lineasNuevo.value = pactados.map((p) => ({
      ID_PRD: p.ID_PRD,
      NOM_PRD: p.NOM_PRD,
      CAN: 0,
      PRC_UNI: parseFloat(p.PRC_UNI),
      precio_nuevo: false,
    }));
  } catch {
    lineasNuevo.value = [];
  } finally {
    loadingProductos.value = false;
  }
}

function limpiarCliente() {
  clienteSeleccionado.value = null;
  busquedaCliente.value = "";
  resultadosCliente.value = [];
  lineasNuevo.value = [];
  busquedaProductoNuevo.value = "";
  resultadosProducto.value = [];
}

let debounceProducto: ReturnType<typeof setTimeout>;
function onBuscarProductoNuevo() {
  clearTimeout(debounceProducto);
  if (!busquedaProductoNuevo.value.trim()) {
    resultadosProducto.value = [];
    return;
  }
  debounceProducto = setTimeout(async () => {
    const resultados = await productosService.listar({ search: busquedaProductoNuevo.value });
    const idsActuales = lineasNuevo.value.map((l) => l.ID_PRD);
    resultadosProducto.value = resultados.filter((p) => !idsActuales.includes(p.ID_PRD));
  }, 300);
}

function agregarProducto(prod: Producto) {
  lineasNuevo.value.push({
    ID_PRD: prod.ID_PRD,
    NOM_PRD: prod.NOM_PRD,
    CAN: 0,
    PRC_UNI: parseFloat(prod.PRC_STD),
    precio_nuevo: true,
  });
  busquedaProductoNuevo.value = "";
  resultadosProducto.value = [];
}

async function confirmarNuevo() {
  if (!clienteSeleccionado.value || lineasConCantidad.value.length === 0) return;

  const ok = await store.crear({
    ID_CLI: clienteSeleccionado.value.ID_CLI,
    FEC_ENT_PED: formNuevo.value.FEC_ENT_PED,
    TUR_PED: formNuevo.value.TUR_PED,
    detalles: lineasConCantidad.value.map((l) => ({
      ID_PRD: l.ID_PRD,
      CAN: l.CAN,
      PRC_UNI: l.PRC_UNI,
      precio_nuevo: l.precio_nuevo,
    })),
  });

  if (ok) {
    cerrarModalNuevo();
    cargarPedidos();
  }
}

// ══════════════════════════════════════════════════════════
// MODAL EDITAR PEDIDO
// ══════════════════════════════════════════════════════════
const modalEditarAbierto = ref(false);
const pedidoEditando = ref<Pedido | null>(null);
const lineasEditar = ref<LineaPedido[]>([]);
const busquedaProductoEditar = ref("");
const resultadosProductoEditar = ref<Producto[]>([]);

const formEditar = ref<{ FEC_ENT_PED: string; TUR_PED: Turno }>({
  FEC_ENT_PED: mananaISO(),
  TUR_PED: Turno.MANANA,
});

const totalEditar = computed(() => {
  const t = lineasEditar.value.reduce((acc, l) => acc + l.PRC_UNI * l.CAN, 0);
  return t.toFixed(2);
});

function abrirModalEditar(pedido: Pedido) {
  pedidoEditando.value = pedido;
  formEditar.value = {
    FEC_ENT_PED: pedido.FEC_ENT_PED.split("T")[0] ?? mananaISO(),
    TUR_PED: pedido.TUR_PED as Turno,
  };
  lineasEditar.value = pedido.detalles.map((d) => ({
    ID_PRD: d.ID_PRD,
    NOM_PRD: d.NOM_PRD,
    CAN: d.CAN,
    PRC_UNI: parseFloat(d.PRC_UNI),
    precio_nuevo: false,
  }));
  busquedaProductoEditar.value = "";
  resultadosProductoEditar.value = [];
  modalEditarAbierto.value = true;
}

function cerrarModalEditar() {
  modalEditarAbierto.value = false;
  pedidoEditando.value = null;
  lineasEditar.value = [];
}

let debounceProductoEditar: ReturnType<typeof setTimeout>;
function onBuscarProductoEditar() {
  clearTimeout(debounceProductoEditar);
  if (!busquedaProductoEditar.value.trim()) {
    resultadosProductoEditar.value = [];
    return;
  }
  debounceProductoEditar = setTimeout(async () => {
    const resultados = await productosService.listar({ search: busquedaProductoEditar.value });
    const idsActuales = lineasEditar.value.map((l) => l.ID_PRD);
    resultadosProductoEditar.value = resultados.filter((p) => !idsActuales.includes(p.ID_PRD));
  }, 300);
}

function agregarProductoEditar(prod: Producto) {
  lineasEditar.value.push({
    ID_PRD: prod.ID_PRD,
    NOM_PRD: prod.NOM_PRD,
    CAN: 1,
    PRC_UNI: parseFloat(prod.PRC_STD),
    precio_nuevo: true,
  });
  busquedaProductoEditar.value = "";
  resultadosProductoEditar.value = [];
}

function quitarLineaEditar(index: number) {
  lineasEditar.value.splice(index, 1);
}

async function confirmarEditar() {
  if (!pedidoEditando.value || lineasEditar.value.length === 0) return;

  const ok = await store.actualizar(pedidoEditando.value.ID_PED, {
    FEC_ENT_PED: formEditar.value.FEC_ENT_PED,
    TUR_PED: formEditar.value.TUR_PED,
    detalles: lineasEditar.value.map((l) => ({
      ID_PRD: l.ID_PRD,
      CAN: l.CAN,
      PRC_UNI: l.PRC_UNI,
      precio_nuevo: l.precio_nuevo,
    })),
  });

  if (ok) {
    cerrarModalEditar();
    cargarPedidos();
  }
}

// ── Cancelar pedido ────────────────────────────────────────
async function confirmarCancelar(pedido: Pedido) {
  if (!confirm(`¿Cancelar el pedido #${pedido.ID_PED} de ${pedido.NOM_CLI}?`)) return;
  await store.cancelar(pedido.ID_PED);
}

// ── Badge ──────────────────────────────────────────────────
function badgeClass(estado: string) {
  return {
    "badge--pendiente": estado === "PENDIENTE",
    "badge--entregado": estado === "ENTREGADO",
    "badge--cancelado": estado === "CANCELADO",
  };
}
</script>

<style scoped>
.pedidos-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
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

/* ─── Filtros ─────────────────────────────────────────────── */
.filters-bar {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fecha-input {
  width: 100%;
}

.fecha-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.dia-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--c-brand-dark);
  min-width: 28px;
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

.visibility-bar {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.check-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: var(--c-text-second);
  cursor: pointer;
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
  min-width: 560px;
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

/* ─── Badge ───────────────────────────────────────────────── */
.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 500;
}

.badge--pendiente {
  background: var(--c-warning-bg);
  color: var(--c-warning);
}
.badge--entregado {
  background: var(--c-success-bg);
  color: var(--c-success);
}
.badge--cancelado {
  background: var(--c-danger-bg);
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
  display: flex;
  flex-direction: column;
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
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow: visible; /* ← permite que el dropdown se salga */
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--c-border);
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: sticky;
  bottom: 0;
  background: var(--c-bg-card);
}

/* ─── Formulario ──────────────────────────────────────────── */
.form-header-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--c-text-second);
}

.required {
  color: var(--c-danger);
}

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
  box-shadow: 0 0 0 3px rgba(200, 130, 42, 0.12);
}

/* ─── Cliente ─────────────────────────────────────────────── */
.search-wrap {
  position: relative;
}

.cliente-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  z-index: 20;
  max-height: 210px; /* ~5 ítems de 42px */
  overflow-y: auto;
}

.cliente-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  cursor: pointer;
  font-size: 0.875rem;
  border-bottom: 1px solid var(--c-border);
  transition: background var(--transition);
}
.cliente-option:last-child {
  border-bottom: none;
}
.cliente-option:hover {
  background: var(--c-surface-1);
}

.cliente-nombre {
  font-weight: 500;
}
.cliente-dni {
  font-size: 0.8125rem;
  color: var(--c-text-muted);
  font-family: monospace;
}

.cliente-seleccionado {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  border: 1.5px solid var(--c-border);
  border-radius: var(--radius-md);
  background: var(--c-bg-alt);
  font-size: 0.9375rem;
  font-weight: 500;
}

.btn-clear {
  font-size: 0.8125rem;
  color: var(--c-text-muted);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  transition: color var(--transition);
}
.btn-clear:hover {
  color: var(--c-danger);
}

.cliente-fijo {
  padding: 9px 12px;
  border: 1.5px solid var(--c-border);
  border-radius: var(--radius-md);
  background: var(--c-bg-alt);
  font-size: 0.9375rem;
  font-weight: 500;
}

/* ─── Productos ───────────────────────────────────────────── */
.productos-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--c-text-second);
  flex-shrink: 0;
}

.agregar-wrap {
  position: relative;
  flex: 1;
  max-width: 260px;
}
.search-prod {
  font-size: 0.875rem;
}

.search-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  z-index: 20;
  max-height: 210px; /* ~5 ítems */
  overflow-y: auto;
}

.search-option {
  padding: 10px 14px;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--c-border);
  transition: background var(--transition);
}
.search-option:last-child {
  border-bottom: none;
}
.search-option:hover {
  background: var(--c-surface-1);
}
.search-option-prc {
  font-size: 0.8125rem;
  color: var(--c-text-muted);
}

/* ─── Líneas pedido ───────────────────────────────────────── */
.lineas-list {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.lineas-header {
  display: grid;
  grid-template-columns: 1fr 120px 90px 32px;
  gap: 8px;
  padding: 8px 12px;
  background: var(--c-bg-alt);
  border-bottom: 1px solid var(--c-border);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--c-text-muted);
}

.linea-row {
  display: grid;
  grid-template-columns: 1fr 120px 90px 32px;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--c-border);
  transition: background var(--transition);
}
.linea-row:last-child {
  border-bottom: none;
}
.linea-row:hover {
  background: var(--c-surface-1);
}
.linea-row--nueva {
  background: var(--c-brand-pale);
}
.linea-row--nueva:hover {
  background: #f5e0c0;
}

.linea-nombre {
  font-size: 0.875rem;
  color: var(--c-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.linea-precio-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
}

.precio-prefix {
  font-size: 0.8125rem;
  color: var(--c-text-muted);
  flex-shrink: 0;
}

.linea-input {
  padding: 6px 8px;
  font-size: 0.875rem;
  text-align: right;
}

.lineas-header--nuevo {
  grid-template-columns: 1fr 120px 90px;
}

.linea-row--nuevo-pedido {
  grid-template-columns: 1fr 120px 90px;
}

.btn-remove {
  font-size: 0.75rem;
  color: var(--c-text-muted);
  padding: 4px;
  border-radius: var(--radius-sm);
  transition: color var(--transition);
}
.btn-remove:hover {
  color: var(--c-danger);
}

/* ─── Total ───────────────────────────────────────────────── */
.total-row {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
}

.total-label {
  font-size: 0.875rem;
  color: var(--c-text-muted);
}
.total-valor {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--c-text-primary);
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
  width: 100%;
  transition: background var(--transition);
}
.btn-cancel:hover {
  background: var(--c-bg-alt);
}

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
.btn-submit:hover:not(:disabled) {
  background: var(--c-brand-dark);
}
.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.state-msg {
  padding: 32px;
  text-align: center;
  color: var(--c-text-muted);
  font-size: 0.9375rem;
}
.state-msg--error {
  color: var(--c-danger);
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
  .filters-bar {
    flex-direction: row;
    align-items: center;
  }
  .fecha-input {
    width: 180px;
    flex-shrink: 0;
  }
  .modal-footer {
    flex-direction: row;
    justify-content: flex-end;
  }
  .btn-cancel {
    width: auto;
  }
  .btn-submit {
    width: auto;
  }
}

@media (min-width: 1024px) {
  .modal-overlay {
    align-items: center;
    padding: 24px;
  }
  .modal {
    max-width: 640px;
    max-height: calc(100dvh - 48px);
    border-radius: var(--radius-xl);
  }
  .modal--lg {
    min-height: 70dvh;
  }
}
</style>
