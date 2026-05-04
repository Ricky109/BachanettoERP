import { http } from '@/config/http'
import type { ProductoPactado } from '@bachanetto/shared'

export interface Cliente {
  ID_CLI:      string
  NOM_CLI:     string
  REF_CLI:     string | null
  TEL_CLI:     string | null
  DIR_CLI:     string | null
  LIM_MON_CLI: number | null
  LIM_DIA_CLI: number | null
  ACT_CLI:     boolean
  FEC_CRE:     string
}

export interface CreateClienteDto {
  ID_CLI:       string
  NOM_CLI:      string
  REF_CLI?:     string
  TEL_CLI?:     string
  DIR_CLI?:     string
  LIM_MON_CLI?: number
  LIM_DIA_CLI?: number
}

export interface UpdateClienteDto {
  NOM_CLI?:     string
  REF_CLI?:     string | null
  TEL_CLI?:     string | null
  DIR_CLI?:     string | null
  LIM_MON_CLI?: number | null
  LIM_DIA_CLI?: number | null
}

export const clientesService = {
  async listar(search?: string): Promise<Cliente[]> {
    const params = search ? { search } : {}
    const { data } = await http.get('/clientes', { params })
    return data.data
  },

  async buscarPorId(id: string): Promise<Cliente> {
    const { data } = await http.get(`/clientes/${id}`)
    return data.data
  },

  async crear(dto: CreateClienteDto): Promise<Cliente> {
    const { data } = await http.post('/clientes', dto)
    return data.data
  },

  async actualizar(id: string, dto: UpdateClienteDto): Promise<Cliente> {
    const { data } = await http.put(`/clientes/${id}`, dto)
    return data.data
  },

  async desactivar(id: string): Promise<void> {
    await http.delete(`/clientes/${id}`)
  },

  async listarPreciosPactados(idCli: string): Promise<ProductoPactado[]> {
    const { data } = await http.get(`/pedidos/productos-pactados/${idCli}`)
    return data.data
  },

  async actualizarPrecioPactado(idCli: string, idPrd: number, precio: number): Promise<void> {
    await http.patch(`/pedidos/productos-pactados/${idCli}/${idPrd}`, { precio })
  },
}