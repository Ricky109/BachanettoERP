import { defineStore } from 'pinia'
import { ref } from 'vue'
import { pagosService } from '@/services/pagos.service'
import type { SaldoCliente, Pago } from '@/services/pagos.service'
import type { CreatePagoDto } from '@bachanetto/shared'

export const usePagosStore = defineStore('pagos', () => {

  // ── Clientes con saldo ────────────────────────────────
  const clientes  = ref<SaldoCliente[]>([])
  const loading   = ref(false)
  const error     = ref<string | null>(null)

  async function listarClientes() {
    loading.value = true
    error.value   = null
    try {
      clientes.value = await pagosService.listarClientes()
    } catch {
      error.value = 'Error al cargar los clientes'
    } finally {
      loading.value = false
    }
  }

  // ── Pagos del cliente seleccionado ────────────────────
  const pagos        = ref<Pago[]>([])
  const loadingPagos = ref(false)
  const errorPagos   = ref<string | null>(null)
  const saldoActual  = ref<SaldoCliente | null>(null)

  async function cargarDetalle(idCli: string) {
    loadingPagos.value = true
    errorPagos.value   = null
    try {
      const [saldo, historial] = await Promise.all([
        pagosService.saldoCliente(idCli),
        pagosService.listarPagos(idCli),
      ])
      saldoActual.value = saldo
      pagos.value       = historial.slice(0, 10)
    } catch {
      errorPagos.value = 'Error al cargar el detalle del cliente'
    } finally {
      loadingPagos.value = false
    }
  }

  async function registrar(dto: CreatePagoDto): Promise<boolean> {
    loadingPagos.value = true
    errorPagos.value   = null
    try {
      const nuevo = await pagosService.registrar(dto)
      pagos.value.unshift(nuevo)
      if (pagos.value.length > 10) pagos.value = pagos.value.slice(0, 10)

      // Actualizar saldo local
      if (saldoActual.value) {
        const nuevoTotalPagos = parseFloat(saldoActual.value.total_pagos) + parseFloat(nuevo.MON_PAG)
        const nuevoSaldo      = parseFloat(saldoActual.value.total_entregas) - nuevoTotalPagos
        saldoActual.value = {
          ...saldoActual.value,
          total_pagos: nuevoTotalPagos.toFixed(2),
          saldo:       nuevoSaldo.toFixed(2),
        }

        // Si saldo llegó a 0 o menos, quitar de la lista
        if (nuevoSaldo <= 0) {
          clientes.value = clientes.value.filter(c => c.ID_CLI !== dto.ID_CLI)
        } else {
          const idx = clientes.value.findIndex(c => c.ID_CLI === dto.ID_CLI)
          if (idx !== -1) clientes.value[idx] = { ...saldoActual.value }
        }
      }

      return true
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      errorPagos.value = msg ?? 'Error al registrar el pago'
      return false
    } finally {
      loadingPagos.value = false
    }
  }

  return {
    clientes, loading, error, listarClientes,
    pagos, loadingPagos, errorPagos, saldoActual,
    cargarDetalle, registrar,
  }
})