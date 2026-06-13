import { prisma } from '../config/prisma'
import { Turno, EstadoPedido } from '@bachanetto/shared'
import type { CreatePedidoDto, UpdatePedidoDto } from '@bachanetto/shared'

const includePedido = {
  cliente:    { select: { ID_CLI: true, NOM_CLI: true } },
  creado_por: { select: { ID_USR: true, NOM_USR: true } },
  detalles: {
    include: {
      producto: { select: { ID_PRD: true, NOM_PRD: true } },
    },
  },
}

function mapPedido(p: any) {
  return {
    ID_PED:      p.ID_PED,
    ID_CLI:      p.ID_CLI,
    NOM_CLI:     p.cliente?.NOM_CLI ?? '',
    ID_USR_CRE:  p.ID_USR_CRE,
    NOM_USR_CRE: p.creado_por?.NOM_USR ?? '',
    FEC_ENT_PED: p.FEC_ENT_PED,
    TUR_PED:     p.TUR_PED,
    EST_PED:     p.EST_PED,
    FEC_CRE:     p.FEC_CRE,
    FEC_ACT:     p.FEC_ACT,
    detalles: (p.detalles ?? []).map((d: any) => ({
      ID_PRD:   d.ID_PRD,
      NOM_PRD:  d.producto?.NOM_PRD ?? '',
      CAN:      d.CAN,
      PRC_UNI:  d.PRC_UNI.toString(),
    })),
  }
}

export const pedidosService = {

  async listar({
    fecha,
    fechaRegistro,
    search,
    rol,
  }: {
    fecha?: string
    fechaRegistro?: string
    search?: string
    rol: string
  }) {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const fechaFiltro = rol === 'REPARTIDOR'
      ? hoy
      : fecha ? new Date(fecha) : undefined

    const fechaRegistroInicio = fechaRegistro ? new Date(fechaRegistro) : undefined
    const fechaRegistroFin = fechaRegistroInicio
      ? new Date(fechaRegistroInicio)
      : undefined
    fechaRegistroFin?.setDate(fechaRegistroFin.getDate() + 1)

    const rows = await prisma.vEN_PED.findMany({
      where: {
        ...(fechaFiltro && { FEC_ENT_PED: fechaFiltro }),
        ...(fechaRegistroInicio && fechaRegistroFin && {
          FEC_CRE: {
            gte: fechaRegistroInicio,
            lt: fechaRegistroFin,
          },
        }),
        ...(search && {
          cliente: {
            OR: [
              { NOM_CLI: { contains: search, mode: 'insensitive' } },
              { ID_CLI:  { contains: search } },
            ],
          },
        }),
      },
      orderBy: [{ FEC_ENT_PED: 'asc' }, { TUR_PED: 'asc' }, { ID_PED: 'asc' }],
      include: includePedido,
    })
    return rows.map(mapPedido)
  },

  async buscarPorId(id: number) {
    const pedido = await prisma.vEN_PED.findUnique({
      where:   { ID_PED: id },
      include: includePedido,
    })
    if (!pedido) throw new Error('Pedido no encontrado')
    return mapPedido(pedido)
  },

  async productosPactados(idCli: string) {
    const cliente = await prisma.vEN_CLI.findUnique({ where: { ID_CLI: idCli } })
    if (!cliente) throw new Error('Cliente no encontrado')

    const pactados = await prisma.vEN_PPC.findMany({
      where: { ID_CLI: idCli, ACT_PPC: true },
      include: {
        producto: { select: { ID_PRD: true, NOM_PRD: true, ACT_PRD: true } },
      },
      orderBy: { producto: { NOM_PRD: 'asc' } },
    })

    return pactados
      .filter(p => p.producto.ACT_PRD)
      .map(p => ({
        ID_PRD:       p.producto.ID_PRD,
        NOM_PRD:      p.producto.NOM_PRD,
        PRC_UNI:      p.PRC_PPC.toString(),
        precio_nuevo: false,
      }))
  },

  async crear(dto: CreatePedidoDto, idUsr: string) {
    const cliente = await prisma.vEN_CLI.findUnique({ where: { ID_CLI: dto.ID_CLI } })
    if (!cliente) throw new Error('Cliente no encontrado')

    return prisma.$transaction(async (tx) => {
      const pedido = await tx.vEN_PED.create({
        data: {
          ID_CLI:      dto.ID_CLI,
          ID_USR_CRE:  idUsr,
          FEC_ENT_PED: new Date(dto.FEC_ENT_PED),
          TUR_PED:     dto.TUR_PED ?? Turno.MANANA,
          EST_PED:     EstadoPedido.PENDIENTE,
          detalles: {
            create: dto.detalles.map(d => ({
              ID_PRD:  d.ID_PRD,
              CAN:     d.CAN,
              PRC_UNI: d.PRC_UNI,
            })),
          },
        },
        include: includePedido,
      })

      for (const det of dto.detalles) {
        if (det.precio_nuevo) {
          const existe = await tx.vEN_PPC.findFirst({
            where: { ID_CLI: dto.ID_CLI, ID_PRD: det.ID_PRD, ACT_PPC: true },
          })
          if (!existe) {
            await tx.vEN_PPC.create({
              data: {
                ID_CLI:  dto.ID_CLI,
                ID_PRD:  det.ID_PRD,
                PRC_PPC: det.PRC_UNI,
                ACT_PPC: true,
              },
            })
          }
        }
      }

      return mapPedido(pedido)
    })
  },

  async actualizar(id: number, dto: UpdatePedidoDto) {
    const pedido = await prisma.vEN_PED.findUnique({ where: { ID_PED: id } })
    if (!pedido) throw new Error('Pedido no encontrado')
    if (pedido.EST_PED !== EstadoPedido.PENDIENTE) {
      throw new Error('Solo se pueden editar pedidos en estado pendiente')
    }

    return prisma.$transaction(async (tx) => {
      await tx.vEN_PED.update({
        where: { ID_PED: id },
        data: {
          ...(dto.FEC_ENT_PED && { FEC_ENT_PED: new Date(dto.FEC_ENT_PED) }),
          ...(dto.TUR_PED     && { TUR_PED: dto.TUR_PED }),
        },
      })

      if (dto.detalles && dto.detalles.length > 0) {
        await tx.vEN_DET_PED.deleteMany({ where: { ID_PED: id } })
        await tx.vEN_DET_PED.createMany({
          data: dto.detalles.map(d => ({
            ID_PED:  id,
            ID_PRD:  d.ID_PRD,
            CAN:     d.CAN,
            PRC_UNI: d.PRC_UNI,
          })),
        })

        for (const det of dto.detalles) {
          if (det.precio_nuevo) {
            const existe = await tx.vEN_PPC.findFirst({
              where: { ID_CLI: pedido.ID_CLI, ID_PRD: det.ID_PRD, ACT_PPC: true },
            })
            if (!existe) {
              await tx.vEN_PPC.create({
                data: {
                  ID_CLI:  pedido.ID_CLI,
                  ID_PRD:  det.ID_PRD,
                  PRC_PPC: det.PRC_UNI,
                  ACT_PPC: true,
                },
              })
            }
          }
        }
      }

      const actualizado = await tx.vEN_PED.findUnique({
        where:   { ID_PED: id },
        include: includePedido,
      })
      return mapPedido(actualizado)
    })
  },

  async cancelar(id: number) {
    const pedido = await prisma.vEN_PED.findUnique({ where: { ID_PED: id } })
    if (!pedido) throw new Error('Pedido no encontrado')
    if (pedido.EST_PED !== EstadoPedido.PENDIENTE) {
      throw new Error('Solo se pueden cancelar pedidos en estado pendiente')
    }

    const actualizado = await prisma.vEN_PED.update({
      where:   { ID_PED: id },
      data:    { EST_PED: EstadoPedido.CANCELADO },
      include: includePedido,
    })
    return mapPedido(actualizado)
  },

  async actualizarPrecioPactado(idCli: string, idPrd: number, precio: number) {
    const cliente = await prisma.vEN_CLI.findUnique({ where: { ID_CLI: idCli } })
    if (!cliente) throw new Error('Cliente no encontrado')

    const producto = await prisma.vEN_PRD.findUnique({ where: { ID_PRD: idPrd } })
    if (!producto) throw new Error('Producto no encontrado')

    return prisma.$transaction(async (tx) => {
      await tx.vEN_PPC.updateMany({
        where: { ID_CLI: idCli, ID_PRD: idPrd, ACT_PPC: true },
        data:  { ACT_PPC: false },
      })
      return tx.vEN_PPC.create({
        data: {
          ID_CLI:  idCli,
          ID_PRD:  idPrd,
          PRC_PPC: precio,
          ACT_PPC: true,
        },
      })
    })
  },
}
