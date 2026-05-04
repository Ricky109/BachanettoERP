import { prisma } from '../config/prisma'
import type { ProductoPactado } from '@bachanetto/shared'

export interface CreateClienteDto {
  ID_CLI:      string
  NOM_CLI:     string
  REF_CLI?:    string
  TEL_CLI?:    string
  DIR_CLI?:    string
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

  async listar(search?: string) {
    return prisma.vEN_CLI.findMany({
      where: {
        ACT_CLI: true,
        ...(search && {
          OR: [
            { NOM_CLI: { contains: search, mode: 'insensitive' } },
            { REF_CLI: { contains: search, mode: 'insensitive' } },
            { ID_CLI:  { contains: search } },
          ],
        }),
      },
      orderBy: { NOM_CLI: 'asc' },
      select: {
        ID_CLI: true, NOM_CLI: true, REF_CLI: true,
        TEL_CLI: true, DIR_CLI: true,
        LIM_MON_CLI: true, LIM_DIA_CLI: true,
        ACT_CLI: true, FEC_CRE: true,
      },
    })
  },

  async buscarPorId(id: string) {
    return prisma.vEN_CLI.findUnique({
      where: { ID_CLI: id },
    })
  },

    async crear(dto: CreateClienteDto) {
    const existe = await prisma.vEN_CLI.findUnique({
      where: { ID_CLI: dto.ID_CLI },
    })
    if (existe) throw new Error('Ya existe un cliente con ese DNI')

    return prisma.vEN_CLI.create({
      data: {
        ID_CLI:      dto.ID_CLI,
        NOM_CLI:     dto.NOM_CLI.trim(),
        REF_CLI:     dto.REF_CLI?.trim()  ?? null,
        TEL_CLI:     dto.TEL_CLI?.trim()  ?? null,
        DIR_CLI:     dto.DIR_CLI?.trim()  ?? null,
        LIM_MON_CLI: dto.LIM_MON_CLI      ?? null,
        LIM_DIA_CLI: dto.LIM_DIA_CLI      ?? null,
      },
    })
  },

  async actualizar(id: string, dto: UpdateClienteDto) {
    const existe = await prisma.vEN_CLI.findUnique({
      where: { ID_CLI: id },
    })
    if (!existe) throw new Error('Cliente no encontrado')

    return prisma.vEN_CLI.update({
      where: { ID_CLI: id },
      data: {
        ...(dto.NOM_CLI     !== undefined && { NOM_CLI:     dto.NOM_CLI.trim() }),
        ...(dto.REF_CLI     !== undefined && { REF_CLI:     dto.REF_CLI?.trim() ?? null }),
        ...(dto.TEL_CLI     !== undefined && { TEL_CLI:     dto.TEL_CLI?.trim() ?? null }),
        ...(dto.DIR_CLI     !== undefined && { DIR_CLI:     dto.DIR_CLI?.trim() ?? null }),
        ...(dto.LIM_MON_CLI !== undefined && { LIM_MON_CLI: dto.LIM_MON_CLI }),
        ...(dto.LIM_DIA_CLI !== undefined && { LIM_DIA_CLI: dto.LIM_DIA_CLI }),
      },
    })
  },

  async desactivar(id: string) {
    const existe = await prisma.vEN_CLI.findUnique({
      where: { ID_CLI: id },
    })
    if (!existe) throw new Error('Cliente no encontrado')

    return prisma.vEN_CLI.update({
      where: { ID_CLI: id },
      data:  { ACT_CLI: false },
    })
  },
}