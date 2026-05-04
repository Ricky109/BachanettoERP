import { http } from '@/config/http'
import type { Producto } from '@/services/productos.service'
import type {
  Pedido,
  ProductoPactado,
  CreatePedidoDto,
  UpdatePedidoDto,
} from '@bachanetto/shared'

export type { Pedido, ProductoPactado }

export const pedidosService = {

  async listar(params?: { fecha?: string; search?: string }): Promise<Pedido[]> {
    const { data } = await http.get('/pedidos', { params })
    return data.data
  },

  async buscarPorId(id: number): Promise<Pedido> {
    const { data } = await http.get(`/pedidos/${id}`)
    return data.data
  },

  async productosPactados(idCli: string): Promise<ProductoPactado[]> {
    const { data } = await http.get(`/pedidos/productos-pactados/${idCli}`)
    return data.data
  },

  async crear(dto: CreatePedidoDto): Promise<Pedido> {
    const { data } = await http.post('/pedidos', dto)
    return data.data
  },

  async actualizar(id: number, dto: UpdatePedidoDto): Promise<Pedido> {
    const { data } = await http.put(`/pedidos/${id}`, dto)
    return data.data
  },

  async cancelar(id: number): Promise<Pedido> {
    const { data } = await http.patch(`/pedidos/${id}/cancelar`)
    return data.data
  },
}