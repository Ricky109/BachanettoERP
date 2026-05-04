import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  productosService,
  categoriasService,
  type Producto,
  type Categoria,
  type CreateProductoDto,
  type UpdateProductoDto,
  type CreateCategoriaDto,
  type UpdateCategoriaDto,
} from '@/services/productos.service'

export const useProductosStore = defineStore('productos', () => {

  // ── Productos ────────────────────────────────────────────
  const productos = ref<Producto[]>([])
  const loading   = ref(false)
  const error     = ref<string | null>(null)

  async function listar(params?: { search?: string; categoria?: number }) {
    loading.value = true
    error.value   = null
    try {
      productos.value = await productosService.listar(params)
    } catch {
      error.value = 'Error al cargar los productos'
    } finally {
      loading.value = false
    }
  }

  async function crear(dto: CreateProductoDto): Promise<boolean> {
    loading.value = true
    error.value   = null
    try {
      const nuevo = await productosService.crear(dto)
      productos.value.push(nuevo)
      productos.value.sort((a, b) => a.NOM_PRD.localeCompare(b.NOM_PRD))
      return true
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      error.value = msg ?? 'Error al crear el producto'
      return false
    } finally {
      loading.value = false
    }
  }

  async function actualizar(id: number, dto: UpdateProductoDto): Promise<boolean> {
    loading.value = true
    error.value   = null
    try {
      const actualizado = await productosService.actualizar(id, dto)
      const index = productos.value.findIndex(p => p.ID_PRD === id)
      if (index !== -1) productos.value[index] = actualizado
      return true
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      error.value = msg ?? 'Error al actualizar el producto'
      return false
    } finally {
      loading.value = false
    }
  }

  async function desactivar(id: number): Promise<boolean> {
    loading.value = true
    error.value   = null
    try {
      await productosService.desactivar(id)
      productos.value = productos.value.filter(p => p.ID_PRD !== id)
      return true
    } catch {
      error.value = 'Error al desactivar el producto'
      return false
    } finally {
      loading.value = false
    }
  }

  // ── Categorías ───────────────────────────────────────────
  const categorias   = ref<Categoria[]>([])
  const loadingCat   = ref(false)
  const errorCat     = ref<string | null>(null)

  async function listarCategorias() {
    loadingCat.value = true
    errorCat.value   = null
    try {
      categorias.value = await categoriasService.listar()
    } catch {
      errorCat.value = 'Error al cargar las categorías'
    } finally {
      loadingCat.value = false
    }
  }

  async function crearCategoria(dto: CreateCategoriaDto): Promise<boolean> {
    loadingCat.value = true
    errorCat.value   = null
    try {
      const nueva = await categoriasService.crear(dto)
      categorias.value.push(nueva)
      categorias.value.sort((a, b) => a.NOM_CAT.localeCompare(b.NOM_CAT))
      return true
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      errorCat.value = msg ?? 'Error al crear la categoría'
      return false
    } finally {
      loadingCat.value = false
    }
  }

  async function actualizarCategoria(id: number, dto: UpdateCategoriaDto): Promise<boolean> {
    loadingCat.value = true
    errorCat.value   = null
    try {
      const actualizada = await categoriasService.actualizar(id, dto)
      const index = categorias.value.findIndex(c => c.ID_CAT === id)
      if (index !== -1) categorias.value[index] = actualizada
      return true
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      errorCat.value = msg ?? 'Error al actualizar la categoría'
      return false
    } finally {
      loadingCat.value = false
    }
  }

  return {
    productos, loading, error,
    listar, crear, actualizar, desactivar,
    categorias, loadingCat, errorCat,
    listarCategorias, crearCategoria, actualizarCategoria,
  }
})