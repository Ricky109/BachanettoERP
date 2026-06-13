import { defineStore } from 'pinia'
import { ref } from 'vue'
import { pedidosService } from '@/services/pedidos.service'
import type { Pedido, CreatePedidoDto, UpdatePedidoDto } from '@bachanetto/shared'

export const usePedidosStore = defineStore('pedidos', () => {

  const pedidos = ref<Pedido[]>([])
  const loading = ref(false)
  const error   = ref<string | null>(null)

  async function listar(params?: { fecha?: string; fechaRegistro?: string; search?: string }) {
    loading.value = true
    error.value   = null
    try {
      pedidos.value = await pedidosService.listar(params)
    } catch {
      error.value = 'Error al cargar los pedidos'
    } finally {
      loading.value = false
    }
  }

  async function crear(dto: CreatePedidoDto): Promise<boolean> {
    loading.value = true
    error.value   = null
    try {
      const nuevo = await pedidosService.crear(dto)
      pedidos.value.unshift(nuevo)
      return true
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      error.value = msg ?? 'Error al crear el pedido'
      return false
    } finally {
      loading.value = false
    }
  }

  async function actualizar(id: number, dto: UpdatePedidoDto): Promise<boolean> {
    loading.value = true
    error.value   = null
    try {
      const actualizado = await pedidosService.actualizar(id, dto)
      const index = pedidos.value.findIndex(p => p.ID_PED === id)
      if (index !== -1) pedidos.value[index] = actualizado
      return true
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      error.value = msg ?? 'Error al actualizar el pedido'
      return false
    } finally {
      loading.value = false
    }
  }

  async function cancelar(id: number): Promise<boolean> {
    loading.value = true
    error.value   = null
    try {
      const actualizado = await pedidosService.cancelar(id)
      const index = pedidos.value.findIndex(p => p.ID_PED === id)
      if (index !== -1) pedidos.value[index] = actualizado
      return true
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      error.value = msg ?? 'Error al cancelar el pedido'
      return false
    } finally {
      loading.value = false
    }
  }

  return { pedidos, loading, error, listar, crear, actualizar, cancelar }
})
