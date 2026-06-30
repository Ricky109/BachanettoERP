<template>
  <div class="entregas-view">

    <!-- Cabecera -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Entregas</h1>
        <p class="page-desc">Control de entregas del día</p>
      </div>
      <button class="btn-new" @click="abrirModalEntrega">
        + Nueva entrega
      </button>
    </div>

    <!-- Filtros -->
    <div class="filters-bar">
      <div class="fecha-wrap">
        <input
          v-if="isAdmin"
          v-model="fechaFiltro"
          type="date"
          class="field-input fecha-input"
          @change="cargarDatos"
        />
        <span class="dia-label">{{ diaSemana }}</span>
      </div>
      <div class="turno-tabs">
        <button
          v-for="t in turnos"
          :key="t.value"
          class="turno-tab"
          :class="{ 'turno-tab--active': turnoActivo === t.value }"
          @click="cambiarTurno(t.value)"
        >
          {{ t.label }}
        </button>
      </div>
    </div>

    <!-- Resumen del carro -->
    <div class="carro-section">
      <div class="carro-header">
        <h2 class="carro-title">Resumen del carro</h2>
        <button v-if="isAdmin" class="btn-carga" @click="abrirModalCarga">
          Registrar carga
        </button>
      </div>

      <div v-if="store.loadingCarro" class="state-msg">Cargando...</div>
      <div v-else-if="store.errorCarro" class="state-msg state-msg--error">
        {{ store.errorCarro }}
      </div>
      <div v-else-if="store.resumenCarro.length === 0" class="state-msg">
        No hay carga registrada para este turno.
      </div>
      <div v-else class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Salió con</th>
              <th>Entregado</th>
              <th>Queda</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in store.resumenCarro" :key="item.ID_PRD">
              <td class="td-bold">{{ item.NOM_PRD }}</td>
              <td>{{ item.CAN_SAL }}</td>
              <td>{{ item.CAN_ENT }}</td>
              <td>
                <span
                  class="badge"
                  :class="item.CAN_RES <= 0 ? 'badge--entregado' : 'badge--pendiente'"
                >
                  {{ item.CAN_RES }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Lista de entregas del día -->
    <div class="entregas-section">
      <h2 class="section-title">Entregas del día</h2>

      <div v-if="store.loading" class="state-msg">Cargando...</div>
      <div v-else-if="store.error" class="state-msg state-msg--error">{{ store.error }}</div>

      <div v-else-if="entregasFiltradas.length > 0" class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Cliente</th>
              <th>Turno</th>
              <th>Estado</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entrega in entregasFiltradas" :key="entrega.ID_ENT">
              <td class="td-mono">{{ entrega.ID_ENT }}</td>
              <td class="td-bold">{{ entrega.NOM_CLI }}</td>
              <td>{{ TurnoLabel[entrega.TUR_ENT as Turno] }}</td>
              <td>
                <span class="badge" :class="badgeClass(entrega.EST_ENT)">
                  {{ EstadoEntregaLabel[entrega.EST_ENT as EstadoEntrega] }}
                </span>
              </td>
              <td>S/ {{ parseFloat(entrega.TOT_ENT).toFixed(2) }}</td>
              <td class="td-actions">
                <button class="btn-edit" @click="verDetalle(entrega)">
                  Ver
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="state-msg">
        No hay entregas registradas para este turno.
      </div>
    </div>

    <!-- Modal registrar carga (solo ADMIN) -->
    <div v-if="modalCargaAbierto" class="modal-overlay" @click.self="cerrarModalCarga">
      <div class="modal modal--lg">
        <div class="modal-header">
          <h2 class="modal-title">Registrar carga del día</h2>
          <button class="modal-close" @click="cerrarModalCarga">✕</button>
        </div>
        <div class="modal-body">

          <div class="form-header-fields">
            <div class="field">
              <label class="field-label">Fecha</label>
              <input
                v-model="formCarga.FEC_SAL"
                type="date"
                class="field-input"
                @change="cargarProductosCargaDesdePedidos"
              />
            </div>
            <div class="field">
              <label class="field-label">Turno</label>
              <select
                v-model="formCarga.TUR_SAL"
                class="field-input"
                @change="cargarProductosCargaDesdePedidos"
              >
                <option value="MANANA">Mañana</option>
                <option value="TARDE">Tarde</option>
              </select>
            </div>
          </div>

          <div class="productos-header">
            <p class="section-label">Productos</p>
            <div class="agregar-wrap">
              <input
                v-model="busquedaProductoCarga"
                class="field-input search-prod"
                placeholder="Agregar producto..."
                @input="onBuscarProductoCarga"
              />
              <ul v-if="resultadosProductoCarga.length > 0" class="search-dropdown">
                <li
                  v-for="prod in resultadosProductoCarga"
                  :key="prod.ID_PRD"
                  class="search-option"
                  @click="agregarProductoCarga(prod)"
                >
                  {{ prod.NOM_PRD }}
                </li>
              </ul>
            </div>
          </div>

          <div v-if="loadingPedidosCarga" class="state-msg">
            Cargando pedidos pendientes...
          </div>

          <div v-else-if="lineasCarga.length === 0" class="state-msg">
            No hay pedidos pendientes para esta fecha y turno.
          </div>

          <div v-else class="lineas-list">
            <div class="lineas-header lineas-header--carga">
              <span>Producto</span>
              <span>Pedido</span>
              <span>Excedente</span>
              <span>Total</span>
              <span></span>
            </div>
            <div
              v-for="(linea, i) in lineasCarga"
              :key="linea.ID_PRD"
              class="linea-row linea-row--carga"
            >
              <span class="linea-nombre">{{ linea.NOM_PRD }}</span>
              <span class="linea-centro">{{ linea.CAN_PED }}</span>
              <input
                v-model.number="linea.CAN_EXC"
                type="number"
                min="0"
                class="field-input linea-input"
              />
              <span class="linea-centro">{{ totalLineaCarga(linea) }}</span>
              <button class="btn-remove" @click="quitarLineaCarga(i)">✕</button>
            </div>
          </div>

          <div v-if="store.errorCarro" class="state-msg state-msg--error">
            {{ store.errorCarro }}
          </div>

        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="cerrarModalCarga">Cancelar</button>
          <button
            class="btn-submit"
            :disabled="store.loadingCarro || loadingPedidosCarga || lineasCargaConSalida.length === 0"
            @click="confirmarCarga"
          >
            {{ store.loadingCarro ? 'Guardando...' : 'Registrar carga' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal nueva entrega -->
    <div v-if="modalEntregaAbierto" class="modal-overlay" @click.self="cerrarModalEntrega">
      <div class="modal modal--lg">
        <div class="modal-header">
          <h2 class="modal-title">Nueva entrega</h2>
          <button class="modal-close" @click="cerrarModalEntrega">✕</button>
        </div>
        <div class="modal-body">

          <div class="form-header-fields">
            <div class="field">
              <label class="field-label">Fecha <span class="required">*</span></label>
              <input v-model="formEntrega.FEC_ENT" type="date" class="field-input" />
            </div>
            <div class="field">
              <label class="field-label">Turno <span class="required">*</span></label>
              <select v-model="formEntrega.TUR_ENT" class="field-input">
                <option value="MANANA">Mañana</option>
                <option value="TARDE">Tarde</option>
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
              <ul v-if="resultadosCliente.length === 0 && busquedaCliente === ''" class="cliente-dropdown cliente-dropdown--lista">
                <li v-if="loadingClientesPedido" class="cliente-option cliente-option--msg">
                  Cargando...
                </li>
                <li v-else-if="clientesConPedido.length === 0" class="cliente-option cliente-option--msg">
                  No hay clientes con pedido para esta fecha y turno.
                </li>
                <li
                  v-else
                  v-for="cli in clientesConPedido"
                  :key="cli.ID_CLI"
                  class="cliente-option"
                  @click="seleccionarCliente(cli)"
                >
                  <span class="cliente-nombre">{{ nombreConReferencia(cli) }}</span>
                  <span class="cliente-dni">{{ cli.ID_CLI }}</span>
                </li>
              </ul>
              <ul v-if="resultadosCliente.length > 0" class="cliente-dropdown">
                <li
                  v-for="cli in resultadosCliente"
                  :key="cli.ID_CLI"
                  class="cliente-option"
                  @click="seleccionarCliente(cli)"
                >
                  <span class="cliente-nombre">{{ nombreConReferencia(cli) }}</span>
                  <span class="cliente-dni">{{ cli.ID_CLI }}</span>
                </li>
              </ul>
            </div>
            <div v-else class="cliente-seleccionado">
              <span>{{ nombreConReferencia(clienteSeleccionado) }}</span>
              <button class="btn-clear" @click="limpiarCliente">✕</button>
            </div>
          </div>

          <!-- Productos -->
          <template v-if="clienteSeleccionado">
            <div v-if="loadingProductos" class="state-msg">Cargando productos...</div>
            <template v-else>

              <div class="productos-header">
                <p class="section-label">Productos</p>
                <div class="agregar-wrap">
                  <input
                    v-model="busquedaProductoEntrega"
                    class="field-input search-prod"
                    placeholder="Agregar producto..."
                    @input="onBuscarProductoEntrega"
                  />
                  <ul v-if="resultadosProductoEntrega.length > 0" class="search-dropdown">
                    <li
                      v-for="prod in resultadosProductoEntrega"
                      :key="prod.ID_PRD"
                      class="search-option"
                      @click="agregarProductoEntrega(prod)"
                    >
                      {{ prod.NOM_PRD }}
                      <span class="search-option-prc">
                        S/ {{ parseFloat(prod.PRC_STD).toFixed(2) }}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              <div v-if="lineasEntrega.length === 0" class="state-msg">
                Este cliente no tiene productos pactados aún.
              </div>

              <div v-else class="lineas-list">
                <div class="lineas-header">
                  <span>Producto</span>
                  <span>Precio S/</span>
                  <span>Cantidad</span>
                  <span>Cambios</span>
                  <span>Subtotal</span>
                </div>
                <div
                  v-for="linea in lineasEntrega"
                  :key="linea.ID_PRD"
                  class="linea-row linea-row--entrega"
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
                  <input
                    v-model.number="linea.CAN_CAM"
                    type="number"
                    min="0"
                    class="field-input linea-input"
                  />
                  <span class="linea-subtotal">
                    S/ {{ subtotalLinea(linea) }}
                  </span>
                </div>
              </div>

              <!-- Total -->
              <div class="total-row">
                <span class="total-label">Total</span>
                <span class="total-valor">S/ {{ totalEntrega }}</span>
              </div>

              <div class="field">
                <label class="field-label">Observaciones</label>
                <input
                  v-model="formEntrega.OBS_ENT"
                  class="field-input"
                  placeholder="Opcional..."
                />
              </div>

              <!-- Pago al contado -->
              <div class="pago-contado-wrap">
                <label class="check-label">
                  <input
                    v-model="formEntrega.pago_contado"
                    type="checkbox"
                  />
                  Pago al contado
                </label>
                <div v-if="formEntrega.pago_contado" class="field">
                  <label class="field-label">Método de pago <span class="required">*</span></label>
                  <select v-model="formEntrega.MET_PAG" class="field-input">
                    <option value="">Seleccionar...</option>
                    <option v-for="(label, key) in MetodoPagoLabel" :key="key" :value="key">
                      {{ label }}
                    </option>
                  </select>
                </div>
              </div>

              <div v-if="store.error" class="state-msg state-msg--error">
                {{ store.error }}
              </div>

            </template>
          </template>

        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="cerrarModalEntrega">Cancelar</button>
          <button
            class="btn-submit"
            :disabled="store.loading || !clienteSeleccionado || lineasConCantidad.length === 0"
            @click="confirmarEntrega"
          >
            {{ store.loading ? 'Guardando...' : 'Registrar entrega' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal detalle entrega -->
    <div v-if="modalDetalleAbierto" class="modal-overlay" @click.self="cerrarModalDetalle">
      <div class="modal modal--lg">
        <div class="modal-header">
          <h2 class="modal-title">Entrega #{{ entregaDetalle?.ID_ENT }}</h2>
          <button class="modal-close" @click="cerrarModalDetalle">✕</button>
        </div>
        <div class="modal-body" v-if="entregaDetalle">

          <div class="detalle-info">
            <div class="detalle-row">
              <span class="detalle-label">Cliente</span>
              <span class="detalle-valor">{{ entregaDetalle.NOM_CLI }}</span>
            </div>
            <div class="detalle-row">
              <span class="detalle-label">Fecha</span>
              <span class="detalle-valor">{{ formatFecha(entregaDetalle.FEC_ENT) }}</span>
            </div>
            <div class="detalle-row">
              <span class="detalle-label">Turno</span>
              <span class="detalle-valor">
                {{ TurnoLabel[entregaDetalle.TUR_ENT as Turno] }}
              </span>
            </div>
            <div class="detalle-row">
              <span class="detalle-label">Estado</span>
              <span class="badge" :class="badgeClass(entregaDetalle.EST_ENT)">
                {{ EstadoEntregaLabel[entregaDetalle.EST_ENT as EstadoEntrega] }}
              </span>
            </div>
            <div v-if="entregaDetalle.OBS_ENT" class="detalle-row">
              <span class="detalle-label">Observaciones</span>
              <span class="detalle-valor">{{ entregaDetalle.OBS_ENT }}</span>
            </div>
          </div>

          <div class="lineas-list">
            <div class="lineas-header">
              <span>Producto</span>
              <span>Precio S/</span>
              <span>Cantidad</span>
              <span>Cambios</span>
              <span>Subtotal</span>
            </div>
            <div
              v-for="det in entregaDetalle.detalles"
              :key="det.ID_PRD"
              class="linea-row linea-row--entrega linea-row--readonly"
            >
              <span class="linea-nombre">{{ det.NOM_PRD }}</span>
              <span class="linea-centro">S/ {{ parseFloat(det.PRC_UNI).toFixed(2) }}</span>
              <span class="linea-centro">{{ det.CAN }}</span>
              <span class="linea-centro">{{ det.CAN_CAM }}</span>
              <span class="linea-subtotal">S/ {{ parseFloat(det.SUB_TOT).toFixed(2) }}</span>
            </div>
          </div>

          <div class="total-row">
            <span class="total-label">Total</span>
            <span class="total-valor">S/ {{ parseFloat(entregaDetalle.TOT_ENT).toFixed(2) }}</span>
          </div>

        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="cerrarModalDetalle">Cerrar</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useEntregasStore }  from '@/stores/entregas.store'
import { useAuthStore }      from '@/stores/auth.store'
import { clientesService }   from '@/services/clientes.service'
import { productosService }  from '@/services/productos.service'
import { pedidosService }    from '@/services/pedidos.service'
import { Turno, TurnoLabel, EstadoEntrega, EstadoEntregaLabel, MetodoPago, MetodoPagoLabel } from '@bachanetto/shared'
import type { Entrega } from '@/services/entregas.service'
import type { Cliente } from '@/services/clientes.service'
import type { Producto } from '@/services/productos.service'

const store   = useEntregasStore()
const auth    = useAuthStore()
const isAdmin = computed(() => auth.isAdmin)
const { entregas, resumenCarro } = storeToRefs(store)

// ── Helpers fecha ─────────────────────────────────────────
function localISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function hoyISO(): string { return localISO(new Date()) }

function formatFecha(iso: string): string {
  const parts = iso.split('T')[0]?.split('-') ?? []
  const y = Number(parts[0] ?? 0)
  const m = Number(parts[1] ?? 1)
  const d = Number(parts[2] ?? 1)
  return new Date(y, m - 1, d).toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

// ── Filtros ───────────────────────────────────────────────
const fechaFiltro = ref(hoyISO())
const turnoActivo = ref<string>('MANANA')

const turnos = [
  { value: 'MANANA', label: 'Mañana' },
  { value: 'TARDE',  label: 'Tarde'  },
]

const diaSemana = computed((): string => {
  const parts = fechaFiltro.value.split('-')
  const y = Number(parts[0] ?? 0)
  const m = Number(parts[1] ?? 1)
  const d = Number(parts[2] ?? 1)
  const dias = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
  return dias[new Date(y, m - 1, d).getDay()] ?? ''
})

const entregasFiltradas = computed(() =>
  entregas.value.filter(e => e.TUR_ENT === turnoActivo.value)
)

function cambiarTurno(turno: string) {
  turnoActivo.value = turno
  store.cargarResumen({ fecha: fechaFiltro.value, turno })
}

function cargarDatos() {
  store.listar({ fecha: fechaFiltro.value })
  store.cargarResumen({ fecha: fechaFiltro.value, turno: turnoActivo.value })
}

onMounted(() => cargarDatos())

// ── Modal carga ───────────────────────────────────────────
interface LineaCarga {
  ID_PRD:  number
  NOM_PRD: string
  CAN_PED: number
  CAN_EXC: number
}

const modalCargaAbierto      = ref(false)
const lineasCarga            = ref<LineaCarga[]>([])
const busquedaProductoCarga  = ref('')
const resultadosProductoCarga = ref<Producto[]>([])
const loadingPedidosCarga    = ref(false)
const clientesConPedido    = ref<Cliente[]>([])
const loadingClientesPedido = ref(false)

const formCarga = ref({ FEC_SAL: hoyISO(), TUR_SAL: 'MANANA' })

const lineasCargaConSalida = computed(() =>
  lineasCarga.value.filter(l => totalLineaCarga(l) > 0)
)

function totalLineaCarga(linea: LineaCarga): number {
  return Number(linea.CAN_PED || 0) + Number(linea.CAN_EXC || 0)
}

async function abrirModalCarga() {
  formCarga.value = { FEC_SAL: fechaFiltro.value, TUR_SAL: turnoActivo.value }
  lineasCarga.value = []
  modalCargaAbierto.value = true
  await cargarProductosCargaDesdePedidos()
}

function cerrarModalCarga() {
  modalCargaAbierto.value = false
  lineasCarga.value = []
  busquedaProductoCarga.value = ''
  resultadosProductoCarga.value = []
}

async function cargarProductosCargaDesdePedidos() {
  if (!formCarga.value.FEC_SAL || !formCarga.value.TUR_SAL) return

  loadingPedidosCarga.value = true
  try {
    const pedidos = await pedidosService.listar({ fecha: formCarga.value.FEC_SAL })
    const acumulados = new Map<number, LineaCarga>()

    for (const pedido of pedidos) {
      if (pedido.TUR_PED !== formCarga.value.TUR_SAL || pedido.EST_PED !== 'PENDIENTE') continue

      for (const detalle of pedido.detalles) {
        const actual = acumulados.get(detalle.ID_PRD)
        if (actual) {
          actual.CAN_PED += detalle.CAN
        } else {
          acumulados.set(detalle.ID_PRD, {
            ID_PRD: detalle.ID_PRD,
            NOM_PRD: detalle.NOM_PRD,
            CAN_PED: detalle.CAN,
            CAN_EXC: 0,
          })
        }
      }
    }

    lineasCarga.value = Array.from(acumulados.values())
      .sort((a, b) => a.NOM_PRD.localeCompare(b.NOM_PRD))
  } catch {
    lineasCarga.value = []
  } finally {
    loadingPedidosCarga.value = false
  }
}

let debounceCarga: ReturnType<typeof setTimeout>
function onBuscarProductoCarga() {
  clearTimeout(debounceCarga)
  if (!busquedaProductoCarga.value.trim()) {
    resultadosProductoCarga.value = []
    return
  }
  debounceCarga = setTimeout(async () => {
    const resultados = await productosService.listar({ search: busquedaProductoCarga.value })
    const ids = lineasCarga.value.map(l => l.ID_PRD)
    resultadosProductoCarga.value = resultados.filter(p => !ids.includes(p.ID_PRD))
  }, 300)
}

function agregarProductoCarga(prod: Producto) {
  lineasCarga.value.push({ ID_PRD: prod.ID_PRD, NOM_PRD: prod.NOM_PRD, CAN_PED: 0, CAN_EXC: 0 })
  busquedaProductoCarga.value = ''
  resultadosProductoCarga.value = []
}

function quitarLineaCarga(i: number) {
  lineasCarga.value.splice(i, 1)
}

async function confirmarCarga() {
  if (lineasCargaConSalida.value.length === 0) return
  const ok = await store.registrarSalida({
    FEC_SAL: formCarga.value.FEC_SAL,
    TUR_SAL: formCarga.value.TUR_SAL,
    items:   lineasCargaConSalida.value.map(l => ({ ID_PRD: l.ID_PRD, CAN_SAL: totalLineaCarga(l) })),
  })
  if (ok) {
    cerrarModalCarga()
    store.cargarResumen({ fecha: formCarga.value.FEC_SAL, turno: formCarga.value.TUR_SAL })
  }
}

async function cargarClientesConPedido() {
  loadingClientesPedido.value = true
  try {
    const pedidos = await pedidosService.listar({
      fecha: formEntrega.value.FEC_ENT,
    })
    const pendientes = pedidos.filter(
      p => p.TUR_PED === formEntrega.value.TUR_ENT && p.EST_PED === 'PENDIENTE'
    )
    const idsUnicos = Array.from(new Set(pendientes.map(p => p.ID_CLI)))

    const clientesCompletos = await Promise.all(
      idsUnicos.map(id => clientesService.buscarPorId(id))
    )

    clientesConPedido.value = clientesCompletos
  } catch {
    clientesConPedido.value = []
  } finally {
    loadingClientesPedido.value = false
  }
}

// ── Modal entrega ─────────────────────────────────────────
interface LineaEntrega {
  ID_PRD:       number
  NOM_PRD:      string
  CAN:          number
  CAN_CAM:      number
  PRC_UNI:      number
  precio_nuevo: boolean
}

const modalEntregaAbierto      = ref(false)
const clienteSeleccionado      = ref<Cliente | null>(null)
const busquedaCliente          = ref('')
const resultadosCliente        = ref<Cliente[]>([])
const loadingProductos         = ref(false)
const lineasEntrega            = ref<LineaEntrega[]>([])
const busquedaProductoEntrega  = ref('')
const resultadosProductoEntrega = ref<Producto[]>([])
const pedidoVinculado          = ref<number | null>(null)

const formEntrega = ref({
  FEC_ENT:      hoyISO(),
  TUR_ENT:      'MANANA',
  OBS_ENT:      '',
  pago_contado: false,
  MET_PAG:      '' as MetodoPago | '',
})

const lineasConCantidad = computed(() =>
  lineasEntrega.value.filter(l => l.CAN > 0)
)

const totalEntrega = computed(() => {
  const t = lineasEntrega.value.reduce((acc, l) => {
    return acc + ((l.CAN - l.CAN_CAM) * l.PRC_UNI)
  }, 0)
  return t.toFixed(2)
})

function subtotalLinea(linea: LineaEntrega): string {
  return ((linea.CAN - linea.CAN_CAM) * linea.PRC_UNI).toFixed(2)
}

function nombreConReferencia(cliente: Cliente): string {
  const referencia = cliente.REF_CLI?.trim()
  return referencia ? `${cliente.NOM_CLI} - (${referencia})` : cliente.NOM_CLI
}

function abrirModalEntrega() {
  formEntrega.value = {
    FEC_ENT:      fechaFiltro.value,
    TUR_ENT:      turnoActivo.value,
    OBS_ENT:      '',
    pago_contado: false,
    MET_PAG:      '',
  }
  limpiarCliente()
  cargarClientesConPedido()
  modalEntregaAbierto.value = true
}

function cerrarModalEntrega() {
  modalEntregaAbierto.value = false
  limpiarCliente()
}

let debounceCliente: ReturnType<typeof setTimeout>
function onBuscarCliente() {
  clearTimeout(debounceCliente)
  if (!busquedaCliente.value.trim()) {
    resultadosCliente.value = []
    return
  }
  debounceCliente = setTimeout(async () => {
    resultadosCliente.value = await clientesService.listar(busquedaCliente.value)
  }, 300)
}

async function seleccionarCliente(cli: Cliente) {
  clienteSeleccionado.value = cli
  resultadosCliente.value   = []
  busquedaCliente.value     = ''
  await cargarProductosCliente(cli.ID_CLI)
}

async function cargarProductosCliente(idCli: string) {
  loadingProductos.value = true
  pedidoVinculado.value  = null
  try {
    // Buscar pedido pendiente del cliente para la fecha y turno
    const pedidos = await pedidosService.listar({
      fecha:  formEntrega.value.FEC_ENT,
      search: idCli,
    })
    const pedido = pedidos.find(
      p => p.ID_CLI === idCli &&
           p.TUR_PED === formEntrega.value.TUR_ENT &&
           p.EST_PED === 'PENDIENTE'
    )

    if (pedido) {
      pedidoVinculado.value = pedido.ID_PED
      lineasEntrega.value = pedido.detalles.map(d => ({
        ID_PRD:       d.ID_PRD,
        NOM_PRD:      d.NOM_PRD,
        CAN:          d.CAN,
        CAN_CAM:      0,
        PRC_UNI:      parseFloat(d.PRC_UNI),
        precio_nuevo: false,
      }))
    } else {
      // Entrega directa — cargar productos pactados
      const pactados = await pedidosService.productosPactados(idCli)
      lineasEntrega.value = pactados.map(p => ({
        ID_PRD:       p.ID_PRD,
        NOM_PRD:      p.NOM_PRD,
        CAN:          0,
        CAN_CAM:      0,
        PRC_UNI:      parseFloat(p.PRC_UNI),
        precio_nuevo: false,
      }))
    }
  } catch {
    lineasEntrega.value = []
  } finally {
    loadingProductos.value = false
  }
}

function limpiarCliente() {
  clienteSeleccionado.value      = null
  busquedaCliente.value          = ''
  resultadosCliente.value        = []
  lineasEntrega.value            = []
  pedidoVinculado.value          = null
  busquedaProductoEntrega.value  = ''
  resultadosProductoEntrega.value = []
}

let debounceProductoEntrega: ReturnType<typeof setTimeout>
function onBuscarProductoEntrega() {
  clearTimeout(debounceProductoEntrega)
  if (!busquedaProductoEntrega.value.trim()) {
    resultadosProductoEntrega.value = []
    return
  }
  debounceProductoEntrega = setTimeout(async () => {
    const resultados = await productosService.listar({ search: busquedaProductoEntrega.value })
    const ids = lineasEntrega.value.map(l => l.ID_PRD)
    resultadosProductoEntrega.value = resultados.filter(p => !ids.includes(p.ID_PRD))
  }, 300)
}

function agregarProductoEntrega(prod: Producto) {
  lineasEntrega.value.push({
    ID_PRD:       prod.ID_PRD,
    NOM_PRD:      prod.NOM_PRD,
    CAN:          0,
    CAN_CAM:      0,
    PRC_UNI:      parseFloat(prod.PRC_STD),
    precio_nuevo: true,
  })
  busquedaProductoEntrega.value   = ''
  resultadosProductoEntrega.value = []
}

async function confirmarEntrega() {
  if (!clienteSeleccionado.value || lineasConCantidad.value.length === 0) return

  if (formEntrega.value.pago_contado && !formEntrega.value.MET_PAG) {
    store.error = 'Selecciona un método de pago'
    return
  }

  const ok = await store.crear({
    ID_PED:       pedidoVinculado.value ?? undefined,
    ID_CLI:       clienteSeleccionado.value.ID_CLI,
    FEC_ENT:      formEntrega.value.FEC_ENT,
    TUR_ENT:      formEntrega.value.TUR_ENT,
    OBS_ENT:      formEntrega.value.OBS_ENT || undefined,
    pago_contado: formEntrega.value.pago_contado,
    MET_PAG:      formEntrega.value.pago_contado ? formEntrega.value.MET_PAG : undefined,
    detalles:     lineasConCantidad.value.map(l => ({
      ID_PRD:  l.ID_PRD,
      CAN:     l.CAN,
      CAN_CAM: l.CAN_CAM,
      PRC_UNI: l.PRC_UNI,
    })),
  } as any)

  if (ok) {
    cerrarModalEntrega()
    cargarDatos()
  }
}

// ── Modal detalle ─────────────────────────────────────────
const modalDetalleAbierto = ref(false)
const entregaDetalle      = ref<Entrega | null>(null)

function verDetalle(entrega: Entrega) {
  entregaDetalle.value      = entrega
  modalDetalleAbierto.value = true
}

function cerrarModalDetalle() {
  modalDetalleAbierto.value = false
  entregaDetalle.value      = null
}

// ── Badge ─────────────────────────────────────────────────
function badgeClass(estado: string) {
  return {
    'badge--pendiente': estado === 'PENDIENTE',
    'badge--entregado': estado === 'CONFIRMADA',
  }
}
</script>

<style scoped>
.entregas-view { display: flex; flex-direction: column; gap: 24px; }

.page-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-title { font-size: 1.75rem; color: var(--c-text-primary); }
.page-desc  { font-size: 0.875rem; color: var(--c-text-muted); margin-top: 2px; }

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
.btn-new:hover { background: var(--c-brand-dark); }

/* ─── Filtros ─────────────────────────────────────────────── */
.filters-bar {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fecha-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fecha-input { width: 100%; }

.dia-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--c-brand-dark);
  min-width: 28px;
}

.turno-tabs {
  display: flex;
  gap: 8px;
}

.turno-tab {
  padding: 8px 20px;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--c-border);
  background: var(--c-bg-card);
  font-size: 0.875rem;
  color: var(--c-text-second);
  transition: all var(--transition);
}

.turno-tab--active {
  background: var(--c-brand);
  color: white;
  border-color: var(--c-brand);
}

/* ─── Carro ───────────────────────────────────────────────── */
.carro-section {
  border: 1px solid var(--c-border);
  border-radius: var(--radius-lg);
  background: var(--c-bg-card);
  overflow: hidden;
}

.carro-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--c-border);
  background: var(--c-bg-alt);
}

.carro-title {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--c-text-second);
}

.btn-carga {
  padding: 6px 14px;
  border-radius: var(--radius-md);
  background: var(--c-brand);
  color: white;
  font-size: 0.8125rem;
  font-weight: 500;
  transition: background var(--transition);
}
.btn-carga:hover { background: var(--c-brand-dark); }

/* ─── Tabla ───────────────────────────────────────────────── */
.table-wrap {
  overflow-x: auto;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-lg);
}

.carro-section .table-wrap {
  border: none;
  border-radius: 0;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  min-width: 420px;
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

.td-mono    { font-family: monospace; font-size: 0.8125rem; }
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

/* ─── Badge ───────────────────────────────────────────────── */
.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 500;
}
.badge--pendiente { background: var(--c-warning-bg); color: var(--c-warning); }
.badge--entregado { background: var(--c-success-bg); color: var(--c-success); }

/* ─── Secciones ───────────────────────────────────────────── */
.entregas-section { display: flex; flex-direction: column; gap: 12px; }
.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--c-text-second);
}

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
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--c-border);
  position: sticky;
  top: 0;
  background: var(--c-bg-card);
  z-index: 1;
}

.modal-title { font-size: 1.1rem; font-family: var(--font-display); }

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
  overflow: visible;
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.field { display: flex; flex-direction: column; gap: 6px; }

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

/* ─── Cliente ─────────────────────────────────────────────── */
.search-wrap { position: relative; }

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
  max-height: 210px;
  overflow-y: auto;
}

.cliente-dropdown--lista {
  position: static;
  max-height: 240px;
  margin-top: 6px;
  box-shadow: none;
}

.cliente-option--msg {
  justify-content: center;
  color: var(--c-text-muted);
  cursor: default;
}

.cliente-option--msg:hover {
  background: transparent;
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
.cliente-option:last-child { border-bottom: none; }
.cliente-option:hover      { background: var(--c-surface-1); }
.cliente-nombre { font-weight: 500; }
.cliente-dni    { font-size: 0.8125rem; color: var(--c-text-muted); font-family: monospace; }

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
.btn-clear:hover { color: var(--c-danger); }

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

.agregar-wrap { position: relative; flex: 1; max-width: 260px; }
.search-prod  { font-size: 0.875rem; }

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
  max-height: 210px;
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
.search-option:last-child { border-bottom: none; }
.search-option:hover      { background: var(--c-surface-1); }
.search-option-prc        { font-size: 0.8125rem; color: var(--c-text-muted); }

/* ─── Líneas ──────────────────────────────────────────────── */
.lineas-list {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.lineas-list {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-md);
  overflow-x: auto;
}

.lineas-header {
  display: grid;
  grid-template-columns: minmax(140px, 1fr) 110px 80px 80px 90px;
  gap: 8px;
  padding: 8px 12px;
  background: var(--c-bg-alt);
  border-bottom: 1px solid var(--c-border);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--c-text-muted);
  min-width: 520px;
}

.linea-row {
  display: grid;
  grid-template-columns: minmax(140px, 1fr) 110px 80px 80px 90px;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--c-border);
  transition: background var(--transition);
  min-width: 520px;
}

.lineas-header--carga {
  grid-template-columns: 1fr 80px 90px 80px 32px;
}

.linea-row--entrega  { grid-template-columns: 1fr 110px 80px 80px 90px; }
.linea-row--carga    { grid-template-columns: 1fr 80px 90px 80px 32px; }
.linea-row--readonly { pointer-events: none; }

.linea-row:last-child { border-bottom: none; }
.linea-row:hover      { background: var(--c-surface-1); }
.linea-row--nueva     { background: var(--c-brand-pale); }
.linea-row--nueva:hover { background: #f5e0c0; }

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

.precio-prefix { font-size: 0.8125rem; color: var(--c-text-muted); flex-shrink: 0; }

.linea-input   { padding: 6px 8px; font-size: 0.875rem; text-align: right; }
.linea-centro  { font-size: 0.875rem; text-align: center; }
.linea-subtotal { font-size: 0.875rem; font-weight: 500; text-align: right; }

.btn-remove {
  font-size: 0.75rem;
  color: var(--c-text-muted);
  padding: 4px;
  border-radius: var(--radius-sm);
  transition: color var(--transition);
}
.btn-remove:hover { color: var(--c-danger); }

/* ─── Detalle ─────────────────────────────────────────────── */
.detalle-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: var(--c-bg-alt);
  border-radius: var(--radius-md);
  border: 1px solid var(--c-border);
}

.detalle-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detalle-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--c-text-muted);
  min-width: 100px;
}

.detalle-valor {
  font-size: 0.9375rem;
  color: var(--c-text-primary);
}

/* ─── Total ───────────────────────────────────────────────── */
.total-row {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
}

.total-label { font-size: 0.875rem; color: var(--c-text-muted); }
.total-valor { font-size: 1.1rem; font-weight: 600; color: var(--c-text-primary); }

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

.state-msg {
  padding: 32px;
  text-align: center;
  color: var(--c-text-muted);
  font-size: 0.9375rem;
}
.state-msg--error { color: var(--c-danger); }

/* ─── Desktop ────────────────────────────────────────────── */
@media (min-width: 640px) {
  .page-header  { flex-direction: row; align-items: flex-start; justify-content: space-between; }
  .btn-new      { width: auto; }
  .filters-bar  { flex-direction: row; align-items: center; }
  .fecha-input  { width: 180px; flex-shrink: 0; }
  .modal-footer { flex-direction: row; justify-content: flex-end; }
  .btn-cancel   { width: auto; }
  .btn-submit   { width: auto; }
}

@media (min-width: 1024px) {
  .modal-overlay { align-items: center; padding: 24px; }
  .modal {
    max-width: 760px;
    max-height: calc(100dvh - 48px);
    border-radius: var(--radius-xl);
  }
}

.pago-contado-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: 1.5px solid var(--c-border);
  border-radius: var(--radius-md);
  background: var(--c-bg-alt);
}

.check-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--c-text-second);
  cursor: pointer;
}
</style>
