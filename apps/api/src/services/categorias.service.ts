import { prisma } from '../config/prisma'

export const categoriasService = {

  async listar() {
    return prisma.vEN_CAT_PRD.findMany({
      orderBy: { NOM_CAT: 'asc' },
    })
  },

  async crear(data: { NOM_CAT: string; DES_CAT?: string }) {
    return prisma.vEN_CAT_PRD.create({ data })
  },

  async actualizar(id: number, data: { NOM_CAT?: string; DES_CAT?: string }) {
    const existe = await prisma.vEN_CAT_PRD.findUnique({ where: { ID_CAT: id } })
    if (!existe) throw new Error('Categoría no encontrada')
    return prisma.vEN_CAT_PRD.update({ where: { ID_CAT: id }, data })
  },
}