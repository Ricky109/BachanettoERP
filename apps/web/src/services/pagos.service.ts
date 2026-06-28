import { http } from '@/config/http'
import type { SaldoCliente, Pago, CreatePagoDto } from '@bachanetto/shared'

export type { SaldoCliente, Pago }

export const pagosService = {

  async listarClientes(): Promise<SaldoCliente[]> {
    const { data } = await http.get('/pagos/clientes')
    return data.data
  },

  async saldoCliente(idCli: string): Promise<SaldoCliente> {
    const { data } = await http.get(`/pagos/clientes/${idCli}/saldo`)
    return data.data
  },

  async listarPagos(idCli: string): Promise<Pago[]> {
    const { data } = await http.get(`/pagos/clientes/${idCli}/pagos`)
    return data.data
  },

  async registrar(dto: CreatePagoDto): Promise<Pago> {
    const { data } = await http.post('/pagos', dto)
    return data.data
  },
}