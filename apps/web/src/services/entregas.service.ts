import { http } from '@/config/http'
import type {
  Entrega,
  CreateEntregaDto,
  Salida,
  CreateSalidaDto,
} from '@bachanetto/shared'

export type { Entrega }

export interface ResumenCarro {
  ID_PRD:  number
  NOM_PRD: string
  CAN_SAL: number
  CAN_ENT: number
  CAN_RES: number
}

export const entregasService = {

  async listar(params?: { fecha?: string }): Promise<Entrega[]> {
    const { data } = await http.get('/entregas', { params })
    return data.data
  },

  async buscarPorId(id: number): Promise<Entrega> {
    const { data } = await http.get(`/entregas/${id}`)
    return data.data
  },

  async crear(dto: CreateEntregaDto): Promise<Entrega> {
    const { data } = await http.post('/entregas', dto)
    return data.data
  },
}

export const salidasService = {

  async listar(params: { fecha: string; turno?: string }): Promise<Salida[]> {
    const { data } = await http.get('/salidas', { params })
    return data.data
  },

  async resumen(params: { fecha: string; turno: string }): Promise<ResumenCarro[]> {
    const { data } = await http.get('/salidas/resumen', { params })
    return data.data
  },

  async registrar(dto: CreateSalidaDto): Promise<Salida> {
    const { data } = await http.post('/salidas', dto)
    return data.data
  },
}