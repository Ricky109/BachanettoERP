import { defineStore } from 'pinia'
import { ref } from 'vue'
import { entregasService, salidasService } from '@/services/entregas.service'
import type { Entrega, ResumenCarro } from '@/services/entregas.service'
import type { CreateEntregaDto, CreateSalidaDto } from '@bachanetto/shared'

export const useEntregasStore = defineStore('entregas', () => {

  // ── Entregas ──────────────────────────────────────────
  const entregas = ref<Entrega[]>([])
  const loading  = ref(false)
  const error    = ref<string | null>(null)

  async function listar(params?: { fecha?: string }) {
    loading.value = true
    error.value   = null
    try {
      entregas.value = await entregasService.listar(params)
    } catch {
      error.value = 'Error al cargar las entregas'
    } finally {
      loading.value = false
    }
  }

  async function crear(dto: CreateEntregaDto): Promise<boolean> {
    loading.value = true
    error.value   = null
    try {
      const nueva = await entregasService.crear(dto)
      entregas.value.unshift(nueva)
      return true
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      error.value = msg ?? 'Error al registrar la entrega'
      return false
    } finally {
      loading.value = false
    }
  }

  // ── Salidas / Carro ───────────────────────────────────
  const resumenCarro  = ref<ResumenCarro[]>([])
  const loadingCarro  = ref(false)
  const errorCarro    = ref<string | null>(null)

  async function cargarResumen(params: { fecha: string; turno: string }) {
    loadingCarro.value = true
    errorCarro.value   = null
    try {
      resumenCarro.value = await salidasService.resumen(params)
    } catch {
      errorCarro.value = 'Error al cargar el resumen del carro'
    } finally {
      loadingCarro.value = false
    }
  }

  async function registrarSalida(dto: CreateSalidaDto): Promise<boolean> {
    loadingCarro.value = true
    errorCarro.value   = null
    try {
      await salidasService.registrar(dto)
      return true
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      errorCarro.value = msg ?? 'Error al registrar la salida'
      return false
    } finally {
      loadingCarro.value = false
    }
  }

  return {
    entregas, loading, error,
    listar, crear,
    resumenCarro, loadingCarro, errorCarro,
    cargarResumen, registrarSalida,
  }
})