import { prisma } from '../config/prisma'
import type { CreateSalidaDto } from '@bachanetto/shared'

const includeSalida = {
  detalles: {
    include: {
      producto: { select: { ID_PRD: true, NOM_PRD: true } },
    },
  },
}

function mapSalida(s: any) {
  return {
    ID_SAL:  s.ID_SAL,
    FEC_SAL: s.FEC_SAL,
    TUR_SAL: s.TUR_SAL,
    FEC_CRE: s.FEC_CRE,
    items: (s.detalles ?? []).map((d: any) => ({
      ID_DET_SAL: d.ID_DET_SAL,
      ID_PRD:     d.ID_PRD,
      NOM_PRD:    d.producto?.NOM_PRD ?? '',
      CAN_SAL:    d.CAN_SAL,
    })),
  }
}

export const salidasService = {

  async listar({ fecha, turno }: { fecha: string; turno?: string }) {
    const where: any = { FEC_SAL: new Date(fecha) }
    if (turno) where.TUR_SAL = turno

    const rows = await prisma.vEN_SAL.findMany({
      where,
      include: includeSalida,
      orderBy: { TUR_SAL: 'asc' },
    })
    return rows.map(mapSalida)
  },

  async buscarPorFechaTurno({ fecha, turno }: { fecha: string; turno: string }) {
    const salida = await prisma.vEN_SAL.findFirst({
      where: {
        FEC_SAL: new Date(fecha),
        TUR_SAL: turno,
      },
      include: includeSalida,
    })
    if (!salida) throw new Error('Salida no encontrada')
    return mapSalida(salida)
  },

  async registrar(dto: CreateSalidaDto) {
    return prisma.$transaction(async (tx) => {

      const existente = await tx.vEN_SAL.findFirst({
        where: {
          FEC_SAL: new Date(dto.FEC_SAL),
          TUR_SAL: dto.TUR_SAL,
        },
      })

      if (existente) {
        await tx.vEN_SAL.delete({ where: { ID_SAL: existente.ID_SAL } })
      }

      const salida = await tx.vEN_SAL.create({
        data: {
          FEC_SAL: new Date(dto.FEC_SAL),
          TUR_SAL: dto.TUR_SAL,
          detalles: {
            create: dto.items.map(i => ({
              ID_PRD:  i.ID_PRD,
              CAN_SAL: i.CAN_SAL,
            })),
          },
        },
        include: includeSalida,
      })

      return mapSalida(salida)
    })
  },

  async resumen({ fecha, turno }: { fecha: string; turno: string }) {
    const salida = await prisma.vEN_SAL.findFirst({
      where: {
        FEC_SAL: new Date(fecha),
        TUR_SAL: turno,
      },
      include: includeSalida,
    })

    if (!salida) return []

    const entregas = await prisma.vEN_ENT.findMany({
      where: {
        FEC_ENT: new Date(fecha),
        TUR_ENT: turno,
        EST_ENT: 'CONFIRMADA',
      },
      include: {
        detalles: { select: { ID_PRD: true, CAN: true, CAN_CAM: true } },
      },
    })

    const entregadasMap: Record<number, number> = {}
    for (const ent of entregas) {
      for (const det of ent.detalles) {
        entregadasMap[det.ID_PRD] = (entregadasMap[det.ID_PRD] ?? 0) + (det.CAN - det.CAN_CAM)
      }
    }

    return salida.detalles.map((d: any) => ({
      ID_PRD:  d.ID_PRD,
      NOM_PRD: d.producto?.NOM_PRD ?? '',
      CAN_SAL: d.CAN_SAL,
      CAN_ENT: entregadasMap[d.ID_PRD] ?? 0,
      CAN_RES: d.CAN_SAL - (entregadasMap[d.ID_PRD] ?? 0),
    }))
  },
}