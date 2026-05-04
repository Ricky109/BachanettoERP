import { prisma } from '../config/prisma'
import { PaginationQuery } from '@bachanetto/shared'

interface ProductoFiltros extends PaginationQuery {
  idCat?:  number
  activo?: boolean
}

const includeCategoria = {
  categoria: { select: { ID_CAT: true, NOM_CAT: true } },
}

export const productosService = {

  async listar({ page = 1, limit = 20, search, idCat, activo }: ProductoFiltros) {
    const skip  = (page - 1) * limit
    const where: any = {}

    if (search !== undefined) where.NOM_PRD = { contains: search, mode: 'insensitive' }
    if (idCat  !== undefined) where.ID_CAT  = idCat
    if (activo !== undefined) where.ACT_PRD = activo

    const [total, data] = await Promise.all([
      prisma.vEN_PRD.count({ where }),
      prisma.vEN_PRD.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { NOM_PRD: 'asc' },
        include: includeCategoria,
      }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  },

  async buscarPorId(id: number) {
    const producto = await prisma.vEN_PRD.findUnique({
      where:   { ID_PRD: id },
      include: includeCategoria,
    })
    if (!producto) throw new Error('Producto no encontrado')
    return producto
  },

  async crear(data: { NOM_PRD: string; PRC_STD: number; ID_CAT?: number }) {
    return prisma.vEN_PRD.create({ data, include: includeCategoria })
  },

  async actualizar(id: number, data: { NOM_PRD?: string; PRC_STD?: number; ID_CAT?: number | null }) {
    const existe = await prisma.vEN_PRD.findUnique({ where: { ID_PRD: id } })
    if (!existe) throw new Error('Producto no encontrado')
    return prisma.vEN_PRD.update({ where: { ID_PRD: id }, data, include: includeCategoria })
  },

  async toggle(id: number) {
    const prod = await prisma.vEN_PRD.findUnique({ where: { ID_PRD: id } })
    if (!prod) throw new Error('Producto no encontrado')
    return prisma.vEN_PRD.update({
      where:   { ID_PRD: id },
      data:    { ACT_PRD: !prod.ACT_PRD },
      include: includeCategoria,
    })
  },
}