import { prisma } from '../config/prisma'

export const categoriasService = {

  async listar() {
    return prisma.vEN_CAT_PRD.findMany({
      orderBy: { NOM_CAT: 'asc' },
    })
  },

  async crear(data: { NOM_CAT: string; DES_CAT?: string }) {
    return prisma.vEN_CAT_PRD.create({ data:{
      NOM_CAT: data.NOM_CAT.toUpperCase().trim(),
      DES_CAT: data.DES_CAT?.toUpperCase().trim(),
    } })
  },

  async actualizar(id: number, data: { NOM_CAT?: string; DES_CAT?: string }) {
    const existe = await prisma.vEN_CAT_PRD.findUnique({ where: { ID_CAT: id } })
    if (!existe) throw new Error('Categoría no encontrada')
    return prisma.vEN_CAT_PRD.update({
      where: { ID_CAT: id },
      data: {
        ...(data.NOM_CAT !== undefined && { NOM_CAT: data.NOM_CAT.toUpperCase().trim() }),
        ...(data.DES_CAT !== undefined && { DES_CAT: data.DES_CAT.toUpperCase().trim() }),
      }
    })
  },
}