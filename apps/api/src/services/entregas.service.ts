import { prisma } from '../config/prisma'
import { EstadoPedido, EstadoEntrega } from '@bachanetto/shared'
import type { CreateEntregaDto } from '@bachanetto/shared'

const includeEntrega = {
  cliente:        { select: { ID_CLI: true, NOM_CLI: true } },
  registrado_por: { select: { ID_USR: true, NOM_USR: true } },
  detalles: {
    include: {
      producto: { select: { ID_PRD: true, NOM_PRD: true } },
    },
  },
}

function mapEntrega(e: any) {
  return {
    ID_ENT:      e.ID_ENT,
    ID_PED:      e.ID_PED ?? null,
    ID_CLI:      e.ID_CLI,
    NOM_CLI:     e.cliente?.NOM_CLI ?? '',
    ID_USR_REG:  e.ID_USR_REG,
    NOM_USR_REG: e.registrado_por?.NOM_USR ?? '',
    FEC_ENT:     e.FEC_ENT,
    TUR_ENT:     e.TUR_ENT,
    EST_ENT:     e.EST_ENT,
    TOT_ENT:     e.TOT_ENT.toString(),
    PAG_ENT:     e.PAG_ENT ?? false,
    OBS_ENT:     e.OBS_ENT ?? null,
    FEC_CRE:     e.FEC_CRE,
    FEC_ACT:     e.FEC_ACT,
    detalles: (e.detalles ?? []).map((d: any) => ({
      ID_PRD:  d.ID_PRD,
      NOM_PRD: d.producto?.NOM_PRD ?? '',
      CAN:     d.CAN,
      CAN_CAM: d.CAN_CAM ?? 0,
      PRC_UNI: d.PRC_UNI.toString(),
      SUB_TOT: d.SUB_TOT.toString(),
    })),
  }
}

export const entregasService = {

  async listar({ fecha, rol }: { fecha?: string; rol: string }) {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const fechaFiltro = fecha ? new Date(fecha) : hoy

    const rows = await prisma.vEN_ENT.findMany({
      where:   { FEC_ENT: fechaFiltro },
      orderBy: [{ TUR_ENT: 'asc' }, { ID_CLI: 'asc' }],
      include: includeEntrega,
    })
    return rows.map(mapEntrega)
  },

  async buscarPorId(id: number) {
    const entrega = await prisma.vEN_ENT.findUnique({
      where:   { ID_ENT: id },
      include: includeEntrega,
    })
    if (!entrega) throw new Error('Entrega no encontrada')
    return mapEntrega(entrega)
  },

  async crear(dto: CreateEntregaDto & {
    pago_contado?: boolean
    MET_PAG?:      string
    FEC_PAG?:      string
  }, idUsr: string) {
    return prisma.$transaction(async (tx) => {

      // Calcular total
      const total = dto.detalles.reduce((acc, d) => {
        const efectivas = d.CAN - d.CAN_CAM
        return acc + (efectivas * d.PRC_UNI)
      }, 0)

      const entrega = await tx.vEN_ENT.create({
        data: {
          ID_PED:     dto.ID_PED ?? null,
          ID_CLI:     dto.ID_CLI,
          ID_USR_REG: idUsr,
          FEC_ENT:    new Date(dto.FEC_ENT),
          TUR_ENT:    dto.TUR_ENT,
          EST_ENT:    EstadoEntrega.CONFIRMADA,
          TOT_ENT:    total,
          OBS_ENT:    dto.OBS_ENT ?? null,
          PAG_ENT:    dto.pago_contado ?? false,
          detalles: {
            create: dto.detalles.map(d => ({
              ID_PRD:  d.ID_PRD,
              CAN:     d.CAN,
              CAN_CAM: d.CAN_CAM,
              PRC_UNI: d.PRC_UNI,
              SUB_TOT: (d.CAN - d.CAN_CAM) * d.PRC_UNI,
            })),
          },
        },
        include: includeEntrega,
      })

      // Si hay pedido vinculado, actualizar estado y sincronizar cantidades
      if (dto.ID_PED) {
        await tx.vEN_PED.update({
          where: { ID_PED: dto.ID_PED },
          data:  { EST_PED: EstadoPedido.ENTREGADO },
        })

        await tx.vEN_DET_PED.deleteMany({ where: { ID_PED: dto.ID_PED } })
        await tx.vEN_DET_PED.createMany({
          data: dto.detalles.map(d => ({
            ID_PED:  dto.ID_PED!,
            ID_PRD:  d.ID_PRD,
            CAN:     d.CAN,
            PRC_UNI: d.PRC_UNI,
          })),
        })
      }

      // Registrar cambios si los hay
      const conCambios = dto.detalles.filter(d => d.CAN_CAM > 0)
      for (const d of conCambios) {
        await tx.vEN_CAM.create({
          data: {
            ID_ENT:  entrega.ID_ENT,
            ID_PRD:  d.ID_PRD,
            CAN:     d.CAN_CAM,
            FEC_CAM: new Date(dto.FEC_ENT),
          },
        })
      }

      // Registrar pago al contado si aplica
      if (dto.pago_contado && dto.MET_PAG) {
        await tx.vEN_PAG.create({
          data: {
            ID_CLI:     dto.ID_CLI,
            ID_USR_REG: idUsr,
            ID_ENT:     entrega.ID_ENT,
            MON_PAG:    total,
            MET_PAG:    dto.MET_PAG,
            FEC_PAG:    new Date(dto.FEC_PAG ?? dto.FEC_ENT),
            OBS_PAG:    'Pago al contado',
          },
        })
      }

      return mapEntrega(entrega)
    })
  },
}