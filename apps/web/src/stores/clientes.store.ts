import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ProductoPactado } from '@bachanetto/shared'
import { clientesService, type Cliente, type CreateClienteDto, type UpdateClienteDto } from '@/services/clientes.service'

export const useClientesStore = defineStore('clientes', () => {
  const clientes = ref<Cliente[]>([])
  const loading  = ref(false)
  const error    = ref<string | null>(null)
  const preciosPactados  = ref<ProductoPactado[]>([])
  const loadingPrecios   = ref(false)
  const errorPrecios     = ref<string | null>(null)

  async function listar(search?: string) {
    loading.value = true
    error.value   = null
    try {
      clientes.value = await clientesService.listar(search)
    } catch {
      error.value = 'Error al cargar los clientes'
    } finally {
      loading.value = false
    }
  }

  async function listarPreciosPactados(idCli: string) {
    loadingPrecios.value = true
    errorPrecios.value   = null
    try {
      preciosPactados.value = await clientesService.listarPreciosPactados(idCli)
    } catch {
      errorPrecios.value = 'Error al cargar los precios pactados'
    } finally {
      loadingPrecios.value = false
    }
  }

  async function actualizarPrecioPactado(
    idCli: string,
    idPrd: number,
    precio: number
  ): Promise<boolean> {
    loadingPrecios.value = true
    errorPrecios.value   = null
    try {
      await clientesService.actualizarPrecioPactado(idCli, idPrd, precio)
      // Actualizar el precio en el array local
      const index = preciosPactados.value.findIndex(p => p.ID_PRD === idPrd)
      const fila  = index !== -1 ? preciosPactados.value[index] : undefined
        if (fila) fila.PRC_UNI = precio.toString()
      return true
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      errorPrecios.value = msg ?? 'Error al actualizar el precio pactado'
      return false
    } finally {
      loadingPrecios.value = false
    }
  }

  async function crear(dto: CreateClienteDto): Promise<boolean> {
    loading.value = true
    error.value   = null
    try {
      const nuevo = await clientesService.crear(dto)
      clientes.value.push(nuevo)
      clientes.value.sort((a, b) => a.NOM_CLI.localeCompare(b.NOM_CLI))
      return true
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      error.value = msg ?? 'Error al crear el cliente'
      return false
    } finally {
      loading.value = false
    }
  }

  async function actualizar(id: string, dto: UpdateClienteDto): Promise<boolean> {
    loading.value = true
    error.value   = null
    try {
      const actualizado = await clientesService.actualizar(id, dto)
      const index = clientes.value.findIndex(c => c.ID_CLI === id)
      if (index !== -1) clientes.value[index] = actualizado
      return true
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      error.value = msg ?? 'Error al actualizar el cliente'
      return false
    } finally {
      loading.value = false
    }
  }

  async function desactivar(id: string): Promise<boolean> {
    loading.value = true
    error.value   = null
    try {
      await clientesService.desactivar(id)
      clientes.value = clientes.value.filter(c => c.ID_CLI !== id)
      return true
    } catch {
      error.value = 'Error al desactivar el cliente'
      return false
    } finally {
      loading.value = false
    }
  }

  return {clientes, loading, error,
    listar, crear, actualizar, desactivar,
    preciosPactados, loadingPrecios, errorPrecios,
    listarPreciosPactados, actualizarPrecioPactado,
  }
})