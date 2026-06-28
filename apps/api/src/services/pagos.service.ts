import { prisma } from '../config/prisma'
import { MetodoPago } from '@bachanetto/shared'

export interface CreatePagoDto {
  ID_CLI:   string
  ID_ENT?:  number
  MON_PAG:  number
  MET_PAG:  MetodoPago
  FEC_PAG:  string
  OBS_PAG?: string
}

export const pagosService = {

  async saldoCliente(idCli: string) {
    const cliente = await prisma.vEN_CLI.findUnique({ where: { ID_CLI: idCli } })
    if (!cliente) throw new Error('Cliente no encontrado')

    const [totalEntregas, totalPagos] = await Promise.all([
      prisma.vEN_ENT.aggregate({
        where:  { ID_CLI: idCli, EST_ENT: 'CONFIRMADA' },
        _sum:   { TOT_ENT: true },
      }),
      prisma.vEN_PAG.aggregate({
        where:  { ID_CLI: idCli },
        _sum:   { MON_PAG: true },
      }),
    ])

    const totalEnt = Number(totalEntregas._sum.TOT_ENT ?? 0)
    const totalPag = Number(totalPagos._sum.MON_PAG ?? 0)

    return {
      ID_CLI:         cliente.ID_CLI,
      NOM_CLI:        cliente.NOM_CLI,
      REF_CLI:        cliente.REF_CLI ?? null,
      total_entregas: totalEnt.toFixed(2),
      total_pagos:    totalPag.toFixed(2),
      saldo:          (totalEnt - totalPag).toFixed(2),
    }
  },

  async listarPagos(idCli: string) {
    return prisma.vEN_PAG.findMany({
      where:   { ID_CLI: idCli },
      orderBy: { FEC_PAG: 'desc' },
      include: {
        entrega: { select: { ID_ENT: true, FEC_ENT: true, TOT_ENT: true } },
      },
    })
  },

  async registrar(dto: CreatePagoDto, idUsr: string) {
    const cliente = await prisma.vEN_CLI.findUnique({ where: { ID_CLI: dto.ID_CLI } })
    if (!cliente) throw new Error('Cliente no encontrado')

    if (dto.ID_ENT) {
      const entrega = await prisma.vEN_ENT.findUnique({ where: { ID_ENT: dto.ID_ENT } })
      if (!entrega) throw new Error('Entrega no encontrada')
    }

    return prisma.vEN_PAG.create({
      data: {
        ID_CLI:    dto.ID_CLI,
        ID_USR_REG: idUsr,
        ID_ENT:    dto.ID_ENT ?? null,
        MON_PAG:   dto.MON_PAG,
        MET_PAG:   dto.MET_PAG,
        FEC_PAG:   new Date(dto.FEC_PAG),
        OBS_PAG:   dto.OBS_PAG ?? null,
      },
      include: {
        entrega: { select: { ID_ENT: true, FEC_ENT: true, TOT_ENT: true } },
      },
    })
  },

  async listarClientes() {
    const clientes = await prisma.vEN_CLI.findMany({
      where:   { ACT_CLI: true },
      orderBy: { NOM_CLI: 'asc' },
      select:  { ID_CLI: true, NOM_CLI: true, REF_CLI: true },
    })

    const saldos = await Promise.all(
      clientes.map(c => pagosService.saldoCliente(c.ID_CLI))
    )

    return saldos.filter(s => Number(s.saldo) > 0)
  },
}