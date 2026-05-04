<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <div>
          <h2 class="modal-title">Precios pactados</h2>
          <p class="modal-sub">{{ cliente.NOM_CLI }}</p>
        </div>
        <button class="modal-close" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <!-- Cargando -->
        <div v-if="loadingPrecios" class="state-msg">Cargando...</div>
        <div v-else-if="errorPrecios" class="state-msg state-msg--error">{{ errorPrecios }}</div>

        <template v-else>
          <!-- Lista de precios pactados -->
          <div v-if="filasEditables.length > 0" class="section">
            <p class="section-label">Productos pactados</p>
            <div class="precios-list">
              <div v-for="fila in filasEditables" :key="fila.ID_PRD" class="precio-row">
                <span class="precio-nombre">{{ fila.NOM_PRD }}</span>
                <div class="precio-input-wrap">
                  <span class="precio-prefix">S/</span>
                  <input
                    v-model.number="fila.precioActual"
                    type="number"
                    min="0"
                    step="0.01"
                    class="field-input precio-input"
                    :class="{ 'precio-input--changed': fila.precioActual !== fila.precioOriginal }"
                  />
                </div>
              </div>
            </div>
          </div>

          <div v-else class="state-msg">Este cliente aún no tiene precios pactados.</div>

          <!-- Agregar producto nuevo -->
          <div class="section section--new">
            <p class="section-label">Agregar producto</p>
            <div class="add-row">
              <div class="search-wrap">
                <input
                  v-model="busquedaProducto"
                  class="field-input"
                  placeholder="Buscar producto..."
                  @input="onBuscarProducto"
                />
                <ul v-if="resultadosBusqueda.length > 0" class="search-dropdown">
                  <li
                    v-for="prod in resultadosBusqueda"
                    :key="prod.ID_PRD"
                    class="search-option"
                    @click="seleccionarProducto(prod)"
                  >
                    {{ prod.NOM_PRD }}
                    <span class="search-option-prc"
                      >S/ {{ parseFloat(prod.PRC_STD).toFixed(2) }}</span
                    >
                  </li>
                </ul>
              </div>
            </div>

            <!-- Producto seleccionado para agregar -->
            <div v-if="productoNuevo" class="nuevo-row">
              <span class="precio-nombre">{{ productoNuevo.NOM_PRD }}</span>
              <div class="precio-input-wrap">
                <span class="precio-prefix">S/</span>
                <input
                  v-model.number="precioNuevo"
                  type="number"
                  min="0"
                  step="0.01"
                  class="field-input precio-input"
                  placeholder="0.00"
                />
              </div>
              <button class="btn-add" @click="agregarProducto">+ Agregar</button>
            </div>
          </div>
        </template>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="$emit('close')">Cancelar</button>
        <button class="btn-submit" :disabled="loadingPrecios || !haycambios" @click="guardar">
          {{ loadingPrecios ? "Guardando..." : "Guardar cambios" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useClientesStore } from "@/stores/clientes.store";
import { productosService } from "@/services/productos.service";
import type { Cliente } from "@/services/clientes.service";
import type { Producto } from "@/services/productos.service";
import { storeToRefs } from "pinia";

const props = defineProps<{
  cliente: Cliente;
}>();

const emit = defineEmits<{ close: [] }>();

const store = useClientesStore();
const { preciosPactados, loadingPrecios, errorPrecios } = storeToRefs(store); // ← necesita import

// Filas editables con precio original para comparar
interface FilaEditable {
  ID_PRD: number;
  NOM_PRD: string;
  precioOriginal: number;
  precioActual: number;
}

const filasEditables = ref<FilaEditable[]>([]);
const busquedaProducto = ref("");
const resultadosBusqueda = ref<Producto[]>([]);
const productoNuevo = ref<Producto | null>(null);
const precioNuevo = ref<number | null>(null);

const haycambios = computed(() => {
  const modificados = filasEditables.value.some((f) => f.precioActual !== f.precioOriginal);
  const nuevos =
    productoNuevo.value !== null && precioNuevo.value !== null && precioNuevo.value >= 0;
  return modificados || nuevos;
});

onMounted(async () => {
  await store.listarPreciosPactados(props.cliente.ID_CLI);
  filasEditables.value = preciosPactados.value.map((p) => ({
    ID_PRD: p.ID_PRD,
    NOM_PRD: p.NOM_PRD,
    precioOriginal: parseFloat(p.PRC_UNI),
    precioActual: parseFloat(p.PRC_UNI),
  }));
});

let debounceTimer: ReturnType<typeof setTimeout>;
function onBuscarProducto() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    if (!busquedaProducto.value.trim()) {
      resultadosBusqueda.value = [];
      return;
    }
    const resultados = await productosService.listar({ search: busquedaProducto.value });
    // Filtrar los que ya están en la lista pactada
    const idsPactados = filasEditables.value.map((f) => f.ID_PRD);
    resultadosBusqueda.value = resultados.filter((p) => !idsPactados.includes(p.ID_PRD));
  }, 300);
}

function seleccionarProducto(prod: Producto) {
  productoNuevo.value = prod;
  precioNuevo.value = parseFloat(prod.PRC_STD);
  busquedaProducto.value = "";
  resultadosBusqueda.value = [];
}

function agregarProducto() {
  if (!productoNuevo.value || precioNuevo.value === null) return;

  filasEditables.value.push({
    ID_PRD: productoNuevo.value.ID_PRD,
    NOM_PRD: productoNuevo.value.NOM_PRD,
    precioOriginal: -1, // -1 indica que es nuevo
    precioActual: precioNuevo.value,
  });

  productoNuevo.value = null;
  precioNuevo.value = null;
}

async function guardar() {
  const cambios = filasEditables.value.filter((f) => f.precioActual !== f.precioOriginal);

  for (const fila of cambios) {
    await store.actualizarPrecioPactado(props.cliente.ID_CLI, fila.ID_PRD, fila.precioActual);
  }

  emit("close");
}
</script>

<style scoped>
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
  align-items: flex-start;
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

.modal-sub {
  font-size: 0.8125rem;
  color: var(--c-text-muted);
  margin-top: 2px;
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
  gap: 24px;
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

.section-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--c-text-second);
  margin-bottom: 10px;
}

.section--new {
  border-top: 1px solid var(--c-border);
  padding-top: 20px;
}

.precios-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.precio-row,
.nuevo-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.precio-nombre {
  flex: 1;
  font-size: 0.875rem;
  color: var(--c-text-primary);
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.precio-input-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.precio-prefix {
  font-size: 0.875rem;
  color: var(--c-text-muted);
}

.precio-input {
  width: 90px;
  text-align: right;
  padding: 7px 10px;
}

.precio-input--changed {
  border-color: var(--c-brand);
  background: var(--c-brand-pale);
}

/* Buscador */
.search-wrap {
  position: relative;
  flex: 1;
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
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
}

.search-option {
  padding: 10px 14px;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background var(--transition);
}

.search-option:hover {
  background: var(--c-surface-1);
}

.search-option-prc {
  font-size: 0.8125rem;
  color: var(--c-text-muted);
}

/* Botones */
.btn-add {
  padding: 7px 14px;
  border-radius: var(--radius-md);
  background: var(--c-brand);
  color: white;
  font-size: 0.8125rem;
  font-weight: 500;
  flex-shrink: 0;
  transition: background var(--transition);
}

.btn-add:hover {
  background: var(--c-brand-dark);
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
  padding: 24px;
  text-align: center;
  color: var(--c-text-muted);
  font-size: 0.9375rem;
}

.state-msg--error {
  color: var(--c-danger);
}

@media (min-width: 640px) {
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
    max-width: 560px; /* ← antes 520px */
    min-height: 480px; /* ← agregar esto */
    max-height: calc(100dvh - 48px);
    border-radius: var(--radius-xl);
  }
}
</style>
