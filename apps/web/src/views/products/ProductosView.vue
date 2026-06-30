<template>
  <div class="productos-view">
    <!-- Cabecera -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Productos</h1>
        <p class="page-desc">Catálogo de productos de reparto</p>
      </div>
      <button class="btn-new" @click="abrirFormulario()">+ Nuevo producto</button>
    </div>

    <!-- Contenido de dos columnas -->
    <div class="productos-layout">
      <!-- Columna principal: productos -->
      <div class="productos-main">
        <!-- Filtros -->
        <div class="filters-bar">
          <input
            v-model="search"
            class="search-input"
            placeholder="Buscar producto..."
            @input="onSearch"
          />
          <select v-model="filtroCategoria" class="field-input filter-cat" @change="onSearch">
            <option :value="undefined">Todas las categorías</option>
            <option v-for="cat in store.categorias" :key="cat.ID_CAT" :value="cat.ID_CAT">
              {{ cat.NOM_CAT }}
            </option>
          </select>
        </div>

        <label class="check-label">
          <input v-model="mostrarInactivos" type="checkbox" @change="onSearch" />
          Mostrar desactivados
        </label>

        <!-- Estado de carga -->
        <div v-if="store.loading" class="state-msg">Cargando...</div>
        <div v-else-if="store.error" class="state-msg state-msg--error">{{ store.error }}</div>

        <!-- Tabla -->
        <div v-else-if="store.productos.length > 0" class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio S/</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="producto in store.productos"
                :key="producto.ID_PRD"
                :class="{ 'row--inactivo': !producto.ACT_PRD }"
              >
                <td class="td-bold">
                  {{ producto.NOM_PRD }}
                  <span v-if="!producto.ACT_PRD" class="badge-inactivo">Inactivo</span>
                </td>
                <td class="td-muted">{{ producto.categoria?.NOM_CAT ?? "—" }}</td>
                <td>S/ {{ parseFloat(producto.PRC_STD).toFixed(2) }}</td>
                <td class="td-actions">
                  <button class="btn-edit" @click="abrirFormulario(producto)">Editar</button>
                  <button
                    class="btn-delete"
                    :class="{ 'btn-activar': !producto.ACT_PRD }"
                    @click="confirmarToggle(producto)"
                  >
                    {{ producto.ACT_PRD ? 'Desactivar' : 'Activar' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Sin resultados -->
        <div v-else class="state-msg">
          {{ search ? "No se encontraron productos." : "Aún no hay productos registrados." }}
        </div>
      </div>

      <!-- Panel lateral: categorías -->
      <aside class="cat-panel">
        <div class="cat-panel-header">
          <h2 class="cat-panel-title">Categorías</h2>
        </div>

        <div v-if="store.loadingCat" class="state-msg">Cargando...</div>
        <div v-else-if="store.errorCat" class="state-msg state-msg--error">
          {{ store.errorCat }}
        </div>

        <ul v-else class="cat-list">
          <li v-for="cat in store.categorias" :key="cat.ID_CAT" class="cat-item">
            <!-- Modo edición inline -->
            <div v-if="categoriaEditando?.ID_CAT === cat.ID_CAT" class="cat-edit">
              <input v-model="formCat.NOM_CAT" class="field-input" placeholder="Nombre *" />
              <input v-model="formCat.DES_CAT" class="field-input" placeholder="Descripción" />
              <!-- botones en modo edición -->
              <div class="cat-edit-actions">
                <button class="btn-cancel-sm" @click="cancelarEditar">Cancelar</button>
                <button class="btn-save-sm" :disabled="store.loadingCat" @click="guardarCategoria">
                  {{ store.loadingCat ? "..." : "Guardar" }}
                </button>
              </div>
            </div>

            <!-- Modo lectura -->
            <div v-else class="cat-row">
              <span class="cat-name">{{ cat.NOM_CAT }}</span>
              <button class="btn-edit" @click="editarCategoria(cat)">Editar</button>
            </div>
          </li>

          <li v-if="store.categorias.length === 0" class="state-msg">Sin categorías aún.</li>
        </ul>

        <!-- Formulario nueva categoría (solo cuando no se está editando) -->
        <div v-if="!categoriaEditando" class="cat-new">
          <p class="cat-new-label">Nueva categoría</p>
          <input v-model="formCat.NOM_CAT" class="field-input" placeholder="Nombre *" />
          <input v-model="formCat.DES_CAT" class="field-input" placeholder="Descripción" />
          <!-- botón agregar nueva categoría -->
          <button class="btn-add-cat" :disabled="store.loadingCat" @click="crearCategoria">
            {{ store.loadingCat ? "..." : "+ Agregar" }}
          </button>
        </div>
      </aside>
    </div>

    <!-- Modal producto -->
    <div v-if="modalAbierto" class="modal-overlay" @click.self="cerrarModal">
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">
            {{ productoEditando ? "Editar producto" : "Nuevo producto" }}
          </h2>
          <button class="modal-close" @click="cerrarModal">✕</button>
        </div>
        <div class="modal-body">
          <ProductoForm
            :producto="productoEditando ?? undefined"
            :categorias="store.categorias"
            :loading="store.loading"
            @submit="onSubmit"
            @cancel="cerrarModal"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useProductosStore } from "@/stores/productos.store";
import ProductoForm from "@/components/forms/ProductoForm.vue";
import type {
  Producto,
  Categoria,
  CreateProductoDto,
  UpdateProductoDto,
} from "@/services/productos.service";

const store = useProductosStore();

// Productos
const search = ref("");
const filtroCategoria = ref<number | undefined>(undefined);
const mostrarInactivos = ref(false);
const modalAbierto = ref(false);
const productoEditando = ref<Producto | null>(null);

// Categorías
const categoriaEditando = ref<Categoria | null>(null);
const formCat = ref({ NOM_CAT: "", DES_CAT: "" });

onMounted(() => {
  store.listar();
  store.listarCategorias();
});

function onSearch() {
  store.listar({
    search: search.value || undefined,
    categoria: filtroCategoria.value,
    incluirInactivos: mostrarInactivos.value,
  });
}

function abrirFormulario(producto?: Producto) {
  productoEditando.value = producto ?? null;
  modalAbierto.value = true;
}

function cerrarModal() {
  modalAbierto.value = false;
  productoEditando.value = null;
}

async function onSubmit(dto: CreateProductoDto | UpdateProductoDto) {
  let ok = false;
  if (productoEditando.value) {
    ok = await store.actualizar(productoEditando.value.ID_PRD, dto as UpdateProductoDto);
  } else {
    ok = await store.crear(dto as CreateProductoDto);
  }
  if (ok) cerrarModal();
}

async function confirmarToggle(producto: Producto) {
  const accion = producto.ACT_PRD ? 'desactivar' : 'activar';
  if (!confirm(`¿${accion === 'desactivar' ? 'Desactivar' : 'Activar'} "${producto.NOM_PRD}"?`)) return;
  await store.toggle(producto.ID_PRD);
}

function editarCategoria(cat: Categoria) {
  categoriaEditando.value = cat;
  formCat.value = { NOM_CAT: cat.NOM_CAT, DES_CAT: cat.DES_CAT ?? "" };
}

function cancelarEditar() {
  categoriaEditando.value = null;
  formCat.value = { NOM_CAT: "", DES_CAT: "" };
}

async function guardarCategoria() {
  if (!categoriaEditando.value) return;
  const ok = await store.actualizarCategoria(categoriaEditando.value.ID_CAT, {
    NOM_CAT: formCat.value.NOM_CAT || undefined,
    DES_CAT: formCat.value.DES_CAT || undefined,
  });
  if (ok) cancelarEditar();
}

async function crearCategoria() {
  if (!formCat.value.NOM_CAT.trim()) return;
  const ok = await store.crearCategoria({
    NOM_CAT: formCat.value.NOM_CAT,
    DES_CAT: formCat.value.DES_CAT || undefined,
  });
  if (ok) formCat.value = { NOM_CAT: "", DES_CAT: "" };
}
</script>

<style scoped>
.productos-view {
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

/* ─── Layout dos columnas ─────────────────────────────────── */
.productos-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.productos-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

/* ─── Filtros ─────────────────────────────────────────────── */
.filters-bar {
  display: flex;
  flex-direction: column;
  gap: 10px;
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

.table tbody tr:last-child td {
  border-bottom: none;
}
.table tbody tr:hover {
  background: var(--c-surface-1);
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

.state-msg {
  padding: 40px;
  text-align: center;
  color: var(--c-text-muted);
  font-size: 0.9375rem;
}

.state-msg--error {
  color: var(--c-danger);
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

/* ─── Panel categorías ────────────────────────────────────── */
.cat-panel {
  border: 1px solid var(--c-border);
  border-radius: var(--radius-lg);
  background: var(--c-bg-card);
  overflow: hidden;
}

.cat-panel-header {
  padding: 14px 16px;
  border-bottom: 1px solid var(--c-border);
  background: var(--c-bg-alt);
}

.cat-panel-title {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--c-text-second);
}

.cat-list {
  padding: 8px 0;
}

.cat-item {
  padding: 0 16px;
}

.cat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--c-border);
}

.cat-item:last-child .cat-row {
  border-bottom: none;
}

.cat-name {
  font-size: 0.875rem;
  color: var(--c-text-primary);
}

.cat-edit {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 0;
  border-bottom: 1px solid var(--c-border);
}

.cat-edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn-cancel-sm {
  padding: 5px 12px;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--c-border);
  background: var(--c-bg-card);
  font-size: 0.8125rem;
  color: var(--c-text-second);
  transition: background var(--transition);
}

.btn-cancel-sm:hover {
  background: var(--c-bg-alt);
}

.btn-save-sm {
  padding: 5px 12px;
  border-radius: var(--radius-sm);
  background: var(--c-brand);
  color: white;
  font-size: 0.8125rem;
  font-weight: 500;
  transition: background var(--transition);
}

.btn-save-sm:hover:not(:disabled) {
  background: var(--c-brand-dark);
}
.btn-save-sm:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.cat-new {
  padding: 14px 16px;
  border-top: 1px solid var(--c-border);
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--c-bg-alt);
}

.cat-new-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--c-text-second);
}

.btn-add-cat {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  background: var(--c-brand);
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  width: 100%;
  transition: background var(--transition);
}

.btn-add-cat:hover:not(:disabled) {
  background: var(--c-brand-dark);
}
.btn-add-cat:disabled {
  opacity: 0.7;
  cursor: not-allowed;
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

  .filters-bar {
    flex-direction: row;
    align-items: center;
  }

  .filters-bar .search-input {
    flex: 1;
  }
  .filter-cat {
    width: 180px;
    flex-shrink: 0;
  }
}

@media (min-width: 960px) {
  .productos-layout {
    flex-direction: row;
    align-items: start;
  }

  .productos-main {
    flex: 1;
  }

  .cat-panel {
    width: 240px;
    flex-shrink: 0;
  }

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
