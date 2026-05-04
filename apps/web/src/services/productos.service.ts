import { http } from '@/config/http'

export interface Categoria {
  ID_CAT:  number
  NOM_CAT: string
  DES_CAT: string | null
}

export interface Producto {
  ID_PRD:    number
  ID_CAT:    number | null
  NOM_PRD:   string
  PRC_STD:   string  // Decimal llega como string desde la API
  ACT_PRD:   boolean
  FEC_CRE:   string
  FEC_ACT:   string
  categoria: Pick<Categoria, 'ID_CAT' | 'NOM_CAT'> | null
}

export interface CreateProductoDto {
  NOM_PRD: string
  PRC_STD: number
  ID_CAT?: number
}

export interface UpdateProductoDto {
  NOM_PRD?: string
  PRC_STD?: number
  ID_CAT?:  number | null
}

export interface CreateCategoriaDto {
  NOM_CAT:  string
  DES_CAT?: string
}

export interface UpdateCategoriaDto {
  NOM_CAT?: string
  DES_CAT?: string
}

export const productosService = {
  async listar(params?: { search?: string; categoria?: number }): Promise<Producto[]> {
    const { data } = await http.get('/productos', { params: { ...params, activo: true } })
    return data.data.data
  },

  async crear(dto: CreateProductoDto): Promise<Producto> {
    const { data } = await http.post('/productos', dto)
    return data.data
  },

  async actualizar(id: number, dto: UpdateProductoDto): Promise<Producto> {
    const { data } = await http.put(`/productos/${id}`, dto)
    return data.data
  },

  async desactivar(id: number): Promise<void> {
    await http.patch(`/productos/${id}/toggle`)
  },
}

export const categoriasService = {
  async listar(): Promise<Categoria[]> {
    const { data } = await http.get('/categorias')
    return data.data
  },

  async crear(dto: CreateCategoriaDto): Promise<Categoria> {
    const { data } = await http.post('/categorias', dto)
    return data.data
  },

  async actualizar(id: number, dto: UpdateCategoriaDto): Promise<Categoria> {
    const { data } = await http.put(`/categorias/${id}`, dto)
    return data.data
  },
}